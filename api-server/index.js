const express = require('express');
const {generateSlug} = require('random-word-slugs')
const {ECSClient,RunTaskCommand}= require('@aws-sdk/client-ecs')
const {PrismaClient} =  require('@prisma/client')
const {z} = require('zod')
const {createClient} = require('@clickhouse/client')
const redis = require('ioredis')
const {Server} = require('socket.io');
const {Kafka} = require("kafkajs")
const {v4 : uuidv4 } = require('uuid')
const fs= require("fs")
const path= require("path")
const io = new Server({cors: '*'})

const kafka = new Kafka({
    clientId: `api-server`,
    broker: [], //kafka broker URl needed.
    ssl: {
        ca: [fs.readFileSync(path.join(__dirname,'kafka.pem'),'utf-8')]
    },
    sasl:{
        username: " ",
        password: " ",
        mechanism: "plain"
    }
})

const client =createClient({
    host: 'https://',
    database: '',
    username: '',
    password: ''
})

const consumer = kafka.consumer({groupId: 'api-server-logs-consumer'})

io.on('connection', Socket => {
    Socket.on('Subscribe',channel => {
        Socket.join(channel)
        Socket.emit('message',`Subscribed to ${channel}`)
    })
})

io.listen(9001,()=>{
    console.log("Socket Server on 9001")
}) 


const app= express();
const port = 9000;
//pisma client instance
const prisma = new PrismaClient();
//config for aws
const config = {
    CLUSTER: process.env.ECS_CLUSTER,
    TASK: process.env.ECS_TASK_DEFINITION,
    SUBNETS: process.env.AWS_SUBNETS ? process.env.AWS_SUBNETS.split(',') : [],
    SECURITY_GROUPS: process.env.AWS_SECURITY_GROUPS ? process.env.AWS_SECURITY_GROUPS.split(',') : []
}

const ecsClient = new ECSClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
})
//json parsing middleware
app.use(express.json());

app.post('/project', async (req, res) => {
    const schema = z.object({
        name: z.string(),
        gitURL: z.string()
    })
    const safeParseResult = schema.safeParse(req.body)

    if (safeParseResult.error) return res.status(400).json({ error: safeParseResult.error })

    const { name, gitURL } = safeParseResult.data

    const project = await prisma.project.create({
        data: {
            name,
            gitURL,
            subDomain: generateSlug()
        }
    })

    return res.json({ status: 'success', data: { project } })
})

app.post('/deploy', async (req, res) => {
    
    const {projectId}= req.body;
    const project = await prisma.project.findUnique({
        where: {
            id: projectId
        }
    })
    if (!project) {
        return res.status(404).json({ status: 'error', message: 'Project not found' })
    }

    //if there is not running deployment for the project
    const deployment = await prisma.deployment.create({
        data: {
            project: {
                connect: {
                    id: projectId
                }
            },
            status: 'QUEUED'
        }
    })

    // spin the container
     const command = new RunTaskCommand({
        cluster: config.CLUSTER,
        taskDefinition: config.TASK,
        launchType: 'FARGATE',
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                assignPublicIp: 'ENABLED',
                subnets: config.SUBNETS,
                securityGroups: config.SECURITY_GROUPS
            }
        },
        overrides: {
            containerOverrides: [
                {
                    name: 'builder-image',
                    environment: [
                        { name: 'GIT_REPOSITORY__URL', value: project.gitURL },
                        { name: 'PROJECT_ID', value: projectId },
                        { name: 'DEPLOYMENT_ID', value: deployment.id }
                    ]
                }
            ]
        }
    })
    await ecsClient.send(command);

    return res.json({ status: 'queued', data: { deploymentId:deployment.id }})
})

app.get('/logs/:id', async (req, res) => {
    const id = req.params.id;
    const logs = await client.query({
        query: `SELECT event_id, deployment_id, log, timestamp from log_events where deployment_id = {deployment_id:String}`,
        query_params: {
            deployment_id: id
        },
        format: 'JSONEachRow'
    })

    const rawLogs = await logs.json()

    return res.json({ logs: rawLogs })
})    

async function initkafkaConsumer() {
    await consumer.connect()
    await consumer.subscribe({topics: ['container-logs']})

    await consumer.run({
        autoCommit:false,
        eachBatch: async function ({ batch, heartbeat, commitOffsetsIfNecessary, resolveOffset }) {
            const messages = batch.messages;
            console.log(`Recv. ${messages.length} messages..`)
            for (const message of messages){
                const stringMessage=message.value.toString()
                const {PROJECT_ID,DEPLOYMENT_ID,log} = JSON.parse(stringMessage)
                const {query_id}=await client.insert({
                    table:'log_events',
                    value:[{event_id:uuidv4(),deployment_id:DEPLOYMENT_ID,log}],
                    format: 'JSONEachRow'
                })
                await commitOffsetsIfNecessary(message.offset)
                resolveOffset(message.offset)
                await heartbeat()
            }
        }
    })
    
}

initkafkaConsumer()

app.listen(port, () => console.log(`API server listening at http://localhost:${port}`))
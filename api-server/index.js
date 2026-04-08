const express = require('express');
const {generateSlug} = require('random-word-slugs')
const {ECSClient,RunTaskCommand}= require('@aws-sdk/client-ecs')
const {PrismaClient} =  require('@prisma/client')
const {z} = require('zod')

const redis = require('ioredis')
const {Server} = require('socket.io');


//redis setup
const subscriber = new redis(process.env.REDIS_URL)

const io = new Server({cors: '*'})

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

app.post('projects', async (req, res) => {
    const scheme = z.object({
        name: z.string(),
        gitURL: z.string()
    })
    const parsed = scheme.safeParse(req.body)
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error })
    }else {
        return res.json({ status: '404' },{message : 'error'})
    }
    const {name, gitURL} = parsed.data;
    
    const deployment = await prisma.project.create({
        data: {
            name,
            gitURL,
            subDomain: generateSlug()
        }
    })
    return res.json({ status: 'success', data: {project} })
})

app.post('/deploy', async (req, res) => {
    
    const {projectId}= req.body;
    const project = await prisma.project.unique({
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

    return res.json({ status: 'queued', data: { projectSlug, url: `http://${projectSlug}.localhost:8000` } })

    function initRedisSubscriber() 
    {
        console.log('Subscribing to Redis channel logs:*')
        subscriber.psubscriber('logs:*')
        subscriber.on('pmessage', (pattern, channel, message) =>
             {
            io.to(channel).emit('message', message)
        })
    }
    initRedisSubscriber();
})
app.listen(port, () => {console.log(`API server listening at http://localhost:${port}`)})
require('dotenv').config()
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { generateSlug } = require('random-word-slugs')
const { ECSClient, RunTaskCommand } = require('@aws-sdk/client-ecs')
const { PrismaClient } = require('@prisma/client')
const { z } = require('zod')
const { createClient } = require('@clickhouse/client')
const { Server } = require('socket.io');
const http = require('http');
const { Kafka } = require("kafkajs")
const { v4: uuidv4 } = require('uuid')


const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod'

const kafka = new Kafka({
    clientId: `api-server`,
    brokers: [process.env.KAFKA_BROKER],
    ssl: true,
    sasl: {
        mechanism: 'plain',
        username: process.env.KAFKA_USERNAME,
        password: process.env.KAFKA_PASSWORD,
    }
})

const clickhouse = createClient({
    host: process.env.CLICKHOUSE_HOST,
    database: process.env.CLICKHOUSE_DB,
    username: process.env.CLICKHOUSE_USER,
    password: process.env.CLICKHOUSE_PASSWORD
})

const consumer = kafka.consumer({ groupId: 'api-server-logs-consumer' })

const app = express();
const httpServer = http.createServer(app);
const port = process.env.PORT || 9000;

const io = new Server(httpServer, { cors: { origin: process.env.CORS_ORIGIN || '*' } })
io.on('connection', socket => {
    socket.on('Subscribe', channel => {
        socket.join(channel)
        socket.emit('message', `Subscribed to ${channel}`)
    })
})
const prisma = new PrismaClient();

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

app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

// ── Auth middleware ──────────────────────────────────────────────────────────
function authenticateToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'Unauthorized' })
    try {
        req.user = jwt.verify(token, JWT_SECRET)
        next()
    } catch {
        return res.status(401).json({ error: 'Invalid token' })
    }
}

// ── Auth routes ──────────────────────────────────────────────────────────────
app.post('/auth/register', async (req, res) => {
    const schema = z.object({
        email: z.string().email(),
        password: z.string().min(6)
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

    const { email, password } = parsed.data
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(409).json({ error: 'Email already registered' })

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({ data: { email, password: hashed } })

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
    return res.json({ token, user: { id: user.id, email: user.email } })
})

app.post('/auth/login', async (req, res) => {
    const schema = z.object({
        email: z.string().email(),
        password: z.string()
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

    const { email, password } = parsed.data
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
    return res.json({ token, user: { id: user.id, email: user.email } })
})

// ── Project routes (protected) ───────────────────────────────────────────────
app.get('/projects', authenticateToken, async (req, res) => {
    const projects = await prisma.project.findMany({
        where: { userId: req.user.id },
        include: {
            Deployment: { orderBy: { createdAt: 'desc' }, take: 1 }
        },
        orderBy: { createdAt: 'desc' }
    })
    return res.json({ status: 'success', data: { projects } })
})

app.get('/project/:id', authenticateToken, async (req, res) => {
    const project = await prisma.project.findUnique({
        where: { id: req.params.id },
        include: { Deployment: { orderBy: { createdAt: 'desc' } } }
    })
    if (!project || project.userId !== req.user.id)
        return res.status(404).json({ error: 'Not found' })
    return res.json({ status: 'success', data: { project } })
})

app.post('/project', authenticateToken, async (req, res) => {
    const schema = z.object({
        name: z.string(),
        gitURL: z.string()
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

    const { name, gitURL } = parsed.data
    const project = await prisma.project.create({
        data: { name, gitURL, subDomain: generateSlug(), userId: req.user.id }
    })
    return res.json({ status: 'success', data: { project } })
})

app.post('/deploy', authenticateToken, async (req, res) => {
    const { projectId } = req.body;
    const project = await prisma.project.findUnique({ where: { id: projectId } })

    if (!project || project.userId !== req.user.id)
        return res.status(404).json({ status: 'error', message: 'Project not found' })

    const deployment = await prisma.deployment.create({
        data: { project: { connect: { id: projectId } }, status: 'QUEUED' }
    })

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
            containerOverrides: [{
                name: 'builder-image',
                environment: [
                    { name: 'GIT_REPOSITORY__URL', value: project.gitURL },
                    { name: 'PROJECT_ID', value: projectId },
                    { name: 'DEPLOYMENT_ID', value: deployment.id }
                ]
            }]
        }
    })
    await ecsClient.send(command);

    return res.json({ status: 'queued', data: { deploymentId: deployment.id } })
})

app.get('/logs/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;
    const logs = await clickhouse.query({
        query: `SELECT event_id, deployment_id, log, timestamp from log_events where deployment_id = {deployment_id:String}`,
        query_params: { deployment_id: id },
        format: 'JSONEachRow'
    })
    const rawLogs = await logs.json()
    return res.json({ logs: rawLogs })
})

// ── Kafka consumer ───────────────────────────────────────────────────────────
async function initKafkaConsumer() {
    await consumer.connect()
    await consumer.subscribe({ topics: ['container-logs'] })
    await consumer.run({
        autoCommit: false,
        eachBatch: async function ({ batch, heartbeat, commitOffsetsIfNecessary, resolveOffset }) {
            const messages = batch.messages;
            console.log(`Recv. ${messages.length} messages..`)
            for (const message of messages) {
                const stringMessage = message.value.toString()
                const { PROJECT_ID, DEPLOYMENT_ID, log } = JSON.parse(stringMessage)
                await clickhouse.insert({
                    table: 'log_events',
                    values: [{ event_id: uuidv4(), deployment_id: DEPLOYMENT_ID, log }],
                    format: 'JSONEachRow'
                })
                io.to(DEPLOYMENT_ID).emit('message', log)
                resolveOffset(message.offset)
                await commitOffsetsIfNecessary()
                await heartbeat()
            }
        }
    })
}

initKafkaConsumer().catch(err => console.error('Kafka consumer failed to start:', err))

httpServer.listen(port, () => console.log(`API server listening on port ${port}`))

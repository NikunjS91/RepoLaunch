# 🚀 RepoLaunch

> A Vercel-like cloud deployment platform — paste a GitHub URL, get a live site with real-time build logs and automatic subdomain routing.

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![AWS ECS](https://img.shields.io/badge/AWS_ECS-FF9900?style=flat-square&logo=amazonecs&logoColor=white)](https://aws.amazon.com/ecs/)
[![AWS S3](https://img.shields.io/badge/AWS_S3-569A31?style=flat-square&logo=amazons3&logoColor=white)](https://aws.amazon.com/s3/)
[![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=flat-square&logo=railway&logoColor=white)](https://railway.app/)
[![Kafka](https://img.shields.io/badge/Apache_Kafka-231F20?style=flat-square&logo=apachekafka&logoColor=white)](https://kafka.apache.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat-square&logo=socketdotio&logoColor=white)](https://socket.io/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)

**Live Demo:** https://frontend-tan-ten-48.vercel.app

---

## 📸 Screenshots

| Login | Dashboard |
|-------|-----------|
| ![Login](screenshots/01-login.png) | ![Dashboard](screenshots/03-dashboard.png) |

| Project Detail | Deployment Logs |
|----------------|-----------------|
| ![Project Detail](screenshots/05-project-detail.png) | ![Logs](screenshots/06-deployment-logs.png) |

| Register | New Project |
|----------|-------------|
| ![Register](screenshots/02-register.png) | ![New Project](screenshots/04-new-project.png) |

---

## 📖 Overview

**RepoLaunch** is an end-to-end CI/CD platform that automates the deployment of front-end applications directly from a GitHub URL. Drop in a repo, and RepoLaunch clones it, runs the build inside an AWS ECS/Fargate container, uploads the static output to S3, and serves the app through a subdomain-aware reverse proxy — all while streaming real-time build logs to the browser.

Built to understand the internals of production deployment platforms like Vercel and Netlify, exercising microservices architecture, cloud-native orchestration, distributed log streaming with Kafka + ClickHouse, and JWT-based multi-user auth.

---

## ✨ Features

- 🔐 **User authentication** — JWT-based register/login; each user sees only their own projects
- 🔗 **One-click deployments** from any public GitHub repository
- 🐳 **Containerized isolated builds** via Docker + AWS ECS Fargate
- ☁️ **Automatic S3 hosting** of built static assets
- 🌐 **Subdomain-based routing** — every project gets a unique slug URL (e.g. `eager-lion.54.x.x.x.nip.io:8000`)
- 📡 **Real-time build log streaming** through Kafka + Socket.io
- 🗄️ **Queryable log history** stored in ClickHouse
- 💾 **Project & deployment persistence** with Prisma + PostgreSQL
- 🖥️ **React dashboard** — project grid, deployment history, live terminal log view
- 🧩 **Microservices architecture** — each service independently deployable

---

## 🏗️ Architecture

```
User Browser
  │
  ├─── REST/WebSocket ──► API Server (Railway)
  │                         │
  │                         ├─── ECS RunTask ──► build-server (Fargate)
  │                         │                        │
  │                         │                        ├─── git clone ──► GitHub
  │                         │                        ├─── npm build
  │                         │                        ├─── upload dist/ ──► S3 (__outputs/<slug>/)
  │                         │                        └─── publish logs ──► Kafka
  │                         │
  │                         ├─── Kafka consumer ──► ClickHouse (log storage)
  │                         └─── Socket.io ──────► Browser (live logs)
  │
  └─── Visit site ──► s3-reverse-proxy (ECS)
                         └─── S3 (__outputs/<slug>/index.html)
```

### Services

| Service | Hosting | Role |
|---------|---------|------|
| **`api-server`** | Railway (port 8080) | Express REST API + Socket.io on single port — auth, project CRUD, ECS orchestration, Kafka consumer → ClickHouse |
| **`build-server`** | AWS ECS Fargate (ephemeral) | Clones repo, builds, uploads `dist/` to S3 under `__outputs/<subdomain>/`, publishes logs to Kafka |
| **`s3-reverse-proxy`** | AWS ECS (persistent) | Reads subdomain from `Host` header, maps to S3 path, proxies response |
| **`frontend`** | Vercel | React + Vite dashboard — auth pages, project management, live log terminal |

---

## 🔧 Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router, Socket.io client |
| **Backend** | Node.js, Express, Prisma 6 ORM, JWT, bcrypt |
| **Database** | PostgreSQL (Railway plugin) |
| **Log Pipeline** | Confluent Cloud Kafka → ClickHouse Cloud |
| **Realtime** | Socket.io (merged onto API server port) |
| **Cloud** | AWS ECS Fargate, AWS S3, AWS ECR, AWS IAM |
| **Containerization** | Docker (linux/amd64) |
| **Proxy** | `http-proxy` (subdomain → S3) using nip.io for wildcard DNS |
| **Hosting** | Railway (API), Vercel (frontend), ECS (proxy + builds) |

---

## 🚀 Cloud Deployment

All services run fully in the cloud — no local server required.

### Infrastructure Overview

```
GitHub repo URL
      │
      ▼
Vercel (frontend) ──────► Railway (api-server :8080)
                                │
                    ┌───────────┼────────────────┐
                    ▼           ▼                ▼
              ECS Fargate   Confluent       ClickHouse
              (build-server) Kafka Cloud    Cloud
                    │
                    ▼
                 AWS S3
            (__outputs/<slug>/)
                    │
                    ▼
              ECS s3-reverse-proxy
           (<slug>.IP.nip.io:8000)
```

### Deployment Steps

#### 1. API Server → Railway

```bash
# Push api-server to a GitHub repo connected to Railway
# Set these environment variables in Railway:
DATABASE_URL=${{Postgres.DATABASE_URL}}   # Railway Postgres plugin
JWT_SECRET=<random-string>
KAFKA_BROKER=<confluent-cloud-host>:9092
KAFKA_USERNAME=<key>
KAFKA_PASSWORD=<secret>
CLICKHOUSE_HOST=https://<instance>.clickhouse.cloud:8443
CLICKHOUSE_DB=default
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=<password>
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
ECS_CLUSTER=<cluster-arn>
ECS_TASK_DEFINITION=<task-def-arn>
AWS_SUBNETS=subnet-xxx,subnet-yyy
AWS_SECURITY_GROUPS=sg-xxx
S3_BUCKET_NAME=<your-bucket>
CORS_ORIGIN=https://<your-vercel-app>.vercel.app

# Run DB migration once via Railway Console:
npx prisma db push
```

#### 2. Build Server → AWS ECR + ECS

```bash
cd build-server
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

docker build --platform linux/amd64 -t <account>.dkr.ecr.us-east-1.amazonaws.com/build-server:latest .
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/build-server:latest

# Register ECS task definition with env vars:
# GIT_REPOSITORY__URL, PROJECT_ID, DEPLOYMENT_ID, SUBDOMAIN (injected at runtime by api-server)
# Plus: S3_BUCKET_NAME, AWS_*, KAFKA_*, CLICKHOUSE_*
```

#### 3. S3 Reverse Proxy → AWS ECR + ECS

```bash
cd s3-reverse-proxy
docker build --platform linux/amd64 -t <account>.dkr.ecr.us-east-1.amazonaws.com/s3-reverse-proxy:latest .
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/s3-reverse-proxy:latest

# ECS task env var:
BASE_PATH=https://<bucket>.s3.amazonaws.com/__outputs

# Run as an ECS Service (not ephemeral task) so it stays up
aws ecs update-service --cluster <cluster> --service s3-reverse-proxy --force-new-deployment
```

#### 4. Frontend → Vercel

```bash
cd frontend
npx vercel env add VITE_API_URL production     # = https://<railway-url>.up.railway.app
npx vercel env add VITE_PROXY_HOST production  # = <proxy-ip>.nip.io:8000
npx vercel deploy --prod
```

---

## 💻 Local Development

### Prerequisites

- Node.js 18+, Docker, AWS CLI
- Kafka + ClickHouse instances (or cloud accounts)
- PostgreSQL (or use Railway free tier)

### Setup

```bash
git clone https://github.com/NikunjS91/RepoLaunch.git
cd RepoLaunch

cd api-server       && npm install && cd ..
cd build-server     && npm install && cd ..
cd s3-reverse-proxy && npm install && cd ..
cd frontend         && npm install && cd ..
```

**`api-server/.env`**

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/repolaunch
JWT_SECRET=your-secret-key

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
ECS_CLUSTER=arn:aws:ecs:...
ECS_TASK_DEFINITION=arn:aws:ecs:...
AWS_SUBNETS=subnet-xxx,subnet-yyy
AWS_SECURITY_GROUPS=sg-xxx
S3_BUCKET_NAME=your-bucket

KAFKA_BROKER=your-broker:9092
KAFKA_USERNAME=your-username
KAFKA_PASSWORD=your-password

CLICKHOUSE_HOST=https://your-instance
CLICKHOUSE_DB=default
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=your-password

CORS_ORIGIN=http://localhost:5173
```

**`frontend/.env`**

```env
VITE_API_URL=http://localhost:9000
VITE_PROXY_HOST=localhost:8000
```

### Run locally

```bash
# Terminal 1 — API server + Socket.io (single port)
cd api-server && npx prisma db push && node index.js

# Terminal 2 — Reverse proxy
cd s3-reverse-proxy && BASE_PATH=https://<bucket>.s3.amazonaws.com/__outputs node index.js

# Terminal 3 — Frontend
cd frontend && npm run dev
```

---

## 📂 Project Structure

```
RepoLaunch/
├── api-server/
│   ├── prisma/
│   │   └── schema.prisma        # User, Project, Deployment models (PostgreSQL)
│   ├── index.js                 # Express + Socket.io (single port), Kafka consumer, ECS runner
│   └── package.json
├── build-server/
│   ├── Dockerfile               # linux/amd64 ECS task image (Node 20)
│   ├── script.js                # Clone → build → S3 upload (keyed by SUBDOMAIN) + Kafka logs
│   ├── main.sh                  # Container entrypoint
│   └── package.json
├── s3-reverse-proxy/
│   ├── index.js                 # Reads subdomain from Host header → proxies S3 response
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── context/AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx / Register.jsx
│   │   │   ├── Dashboard.jsx         # Project grid
│   │   │   ├── NewProject.jsx
│   │   │   ├── ProjectDetail.jsx     # Live site link uses VITE_PROXY_HOST
│   │   │   └── DeploymentLogs.jsx    # Live terminal + historical logs
│   │   ├── hooks/
│   │   ├── lib/api.js                # Axios + JWT interceptor
│   │   └── lib/socket.js             # Socket.io (falls back to VITE_API_URL)
│   ├── vercel.json                   # SPA rewrite rule
│   └── package.json
└── screenshots/                      # Playwright-generated UI screenshots
    ├── 01-login.png
    ├── 02-register.png
    ├── 03-dashboard.png
    ├── 04-new-project.png
    ├── 05-project-detail.png
    └── 06-deployment-logs.png
```

---

## 🧠 How It Works (End-to-End)

1. **User registers / logs in** → API returns a signed JWT stored in the browser.
2. **User submits a Git URL** → `POST /project` creates a project with a random slug (`eager-lion-sunset`) → `POST /deploy` queues a deployment.
3. **API server** calls `AWS ECS RunTask`, launching an ephemeral Fargate container with `GIT_REPOSITORY__URL`, `PROJECT_ID`, `DEPLOYMENT_ID`, and `SUBDOMAIN` (the slug) as environment variables.
4. **build-server container** boots, clones the repo, runs `npm install && npm run build`, walks `dist/`, and uploads each file to S3 under `__outputs/<subdomain>/`.
5. Throughout the build, stdout is published line-by-line to **Kafka** (`container-logs` topic).
6. The **API server's Kafka consumer** reads each batch, inserts rows into **ClickHouse** (`log_events` table), and forwards live log lines to Socket.io clients subscribed to that deployment's channel.
7. The **frontend terminal** shows historical logs (from `GET /logs/:id`) and streams live lines via Socket.io.
8. The user clicks **Visit Live Site** → opens `http://<slug>.<proxy-ip>.nip.io:8000` → the **s3-reverse-proxy** extracts the slug from the `Host` header, fetches `__outputs/<slug>/index.html` from S3, and proxies it back.

---

## 🔐 Authentication Flow

```
POST /auth/register  →  create user (bcrypt-hashed password)  →  return JWT
POST /auth/login     →  verify password                        →  return JWT

All protected routes:
  Authorization: Bearer <token>  →  authenticateToken middleware
  →  req.user = { id, email }
  →  resources filtered by req.user.id
```

Users can only access projects they created — attempting to access another user's project returns `404 Not Found`.

---

## 🖥️ Dashboard Pages

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | Email + password sign-in |
| `/register` | Register | Create a new account |
| `/` | Dashboard | Grid of all your projects with last deployment status |
| `/new` | New Project | Import a Git repo — creates project + triggers first deploy |
| `/project/:id` | Project Detail | Info, live site link, deployment history table |
| `/project/:id/deploy/:deploymentId` | Deployment Logs | Live terminal streaming build output |

---

## ⚠️ Known Issues

### Dynamic proxy IP update not automated

When the `s3-reverse-proxy` ECS task restarts (on redeploy or task failure), it gets a new public IP. The `VITE_PROXY_HOST` environment variable in Vercel must be updated manually to the new IP:

```bash
npx vercel env rm VITE_PROXY_HOST production
npx vercel env add VITE_PROXY_HOST production   # enter new <ip>.nip.io:8000
npx vercel deploy --prod
```

**Long-term fix:** Assign an AWS Application Load Balancer (ALB) or Elastic IP in front of the ECS service so the hostname never changes. This is the standard production pattern.

---

## 🛣️ Roadmap

- [ ] **ALB/Elastic IP for proxy** — eliminate manual IP updates when ECS task restarts
- [ ] GitHub webhook integration for auto-deploy on `git push`
- [ ] Deployment status updates via Kafka (build-server → DB via message queue)
- [ ] Custom domain support with ACM + CloudFront
- [ ] Preview deployments per pull request
- [ ] Deployment rollback from the UI
- [ ] Framework auto-detection (Next.js, Vite, CRA, Astro)
- [ ] Build caching layer to speed up repeat deployments
- [ ] Terraform module for one-command infrastructure provisioning

---

## 🎯 What I Learned

- How production deployment platforms (Vercel, Netlify) orchestrate ephemeral builds at scale
- Running **short-lived isolated containerized jobs** on AWS Fargate triggered from a REST API
- **Kafka → ClickHouse** log pipeline for durable, queryable build output
- **Real-time log streaming** combining a message queue with Socket.io on a single port
- **JWT authentication** with per-resource ownership in a REST API
- Subdomain-based routing and **reverse-proxy patterns** for multi-tenant static hosting
- Merging Socket.io onto a single Express HTTP server (no separate port needed)
- Using **nip.io** for wildcard DNS without owning a domain
- Deploying Node.js microservices to Railway with Prisma + PostgreSQL
- Building `linux/amd64` Docker images from an Apple Silicon Mac for ECS

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome.

## 📄 License

MIT

## 👤 Author

**Nikunj Shetye**

- GitHub: [@NikunjS91](https://github.com/NikunjS91)
- LinkedIn: [nikunj-shetye](https://www.linkedin.com/in/nikunj-shetye)
- Email: nikunjrajendra.shetye@pace.edu

---

> ⭐ If this project helped you understand modern deployment platforms, consider starring the repo!

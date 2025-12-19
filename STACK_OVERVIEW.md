# XXXChatNow - Technology Stack Overview

## Architecture Type

**Multi-Component Monorepo Architecture**

This repository contains three separate applications that work together to form the complete XXXChatNow platform:

## Technology Stack by Component

### 1. Backend API (`/api`)

**Primary Framework:** NestJS (Node.js framework built on Express)

**Core Technologies:**
- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** NestJS v9.2.1 (built on Express v4.18.2)
- **Databases:**
  - PostgreSQL (primary relational database)
  - MongoDB (via Mongoose v8.2.1)
  - Redis v3.0.2 (caching and session management)
- **Real-time Communication:** Socket.IO v4.5.2 with WebSockets
- **API Documentation:** Swagger UI Express

**Key Dependencies:**
- Express v4.18.2 (underlying HTTP server)
- Mongoose (MongoDB ODM)
- ioredis v5.2.4 (Redis client)
- JWT (authentication)
- Agenda (job scheduling)
- Bee-queue (background jobs)

**Package Manager:** Yarn

---

### 2. Admin Panel (`/admin`)

**Primary Framework:** Next.js v12.2.5 (React framework with SSR)

**Core Technologies:**
- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Next.js v12.2.5
- **UI Library:** React v17.0.2
- **UI Framework:** Ant Design v4.23.6
- **State Management:** Redux Toolkit + Redux Saga
- **Server:** Express v4.18.1 (custom server)

**Key Dependencies:**
- React Redux v8.0.4
- Redux Saga v1.2.1
- Next Redux Wrapper v8.0.0
- Ant Design components
- SunEditor (rich text editor)

**Package Manager:** Yarn

---

### 3. User Website (`/user`)

**Primary Framework:** Next.js v12.3.1 (React framework with SSR)

**Core Technologies:**
- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Next.js v12.3.1
- **UI Library:** React v18.2.0
- **UI Framework:** Ant Design v4.21.6
- **State Management:** Redux Toolkit + Redux Saga
- **Real-time Communication:** Socket.IO Client v4.5.2
- **Server:** Express v4.18.2 (custom server)

**Key Dependencies:**
- React Redux v8.0.4
- Redux Saga v1.2.1
- Next Redux Wrapper v8.1.0
- Socket.IO Client (WebSocket connection to API)
- Video.js v7.20.3 (video streaming)
- HLS.js v1.5.8 (HTTP Live Streaming)
- Firebase v10.1.0 (push notifications)
- reCAPTCHA (security)

**Package Manager:** Yarn

---

## Summary: Stack Type

**Answer: Next.js + NestJS (Node.js/Express) + PostgreSQL + MongoDB + Redis**

This is **NOT** a "Next.js only" application. It's a **full-stack microservices architecture** consisting of:

1. **Backend API:** NestJS (which uses Express under the hood) serving RESTful APIs and WebSocket connections
2. **Two Frontend Applications:** Both built with Next.js (with custom Express servers)
3. **Multiple Databases:** PostgreSQL (primary), MongoDB (secondary), and Redis (caching/sessions)
4. **Real-time Features:** Socket.IO for bidirectional communication between clients and server

### Key Characteristics:

- **Monorepo Structure:** Three separate applications in one repository
- **Microservices Pattern:** Each component can be deployed independently
- **Full TypeScript:** All components use TypeScript
- **Server-Side Rendering:** Next.js provides SSR for both frontend applications
- **WebSocket Support:** Real-time features via Socket.IO
- **Multi-Database:** Relational (PostgreSQL), Document (MongoDB), and Cache (Redis)

### Development Workflow:

Each component runs independently during development:
- API: `cd api && yarn dev` (port 8080 - configured via HTTP_PORT in .env)
- Admin: `cd admin && yarn dev` (port 8082)
- User: `cd user && yarn dev` (port 8081)

### Production Stack:

In production, this platform requires:
- Node.js runtime (v14+ as documented in README.md)
- PostgreSQL database server (v12+ as documented in README.md)
- MongoDB database server
- Redis server
- Nginx or similar reverse proxy (configuration examples in `/config-example/nginx`)

---

## Related Documentation

- [README.md](README.md) - General project overview
- [CONTRIBUTING.md](CONTRIBUTING.md) - Development guidelines
- [api/README.md](api/README.md) - API-specific documentation
- [SECURITY_AUDIT_POLICY_AND_CHECKLIST.md](SECURITY_AUDIT_POLICY_AND_CHECKLIST.md) - Security requirements

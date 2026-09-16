<div align="center">

# 🎟️ SmartQ — Digital Queue Management System

**Eliminate physical waiting. Give customers visibility. Give staff control.**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb)](https://mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--time-010101?style=flat-square&logo=socket.io)](https://socket.io/)
[![JWT](https://img.shields.io/badge/Auth-JWT-FB015B?style=flat-square&logo=jsonwebtokens)](https://jwt.io/)

### 🌐 Live Demo

| Service | URL |
|---|---|
| **Frontend** (Netlify) | 🔗 [smartq1.netlify.app](https://smartq1.netlify.app/) |
| **Backend API** (Render) | 🔗 [smartq-b90m.onrender.com](https://smartq-b90m.onrender.com/) |



</div>

---

## 📌 Project Overview

**SmartQ** is a full-stack digital queue management system that replaces physical waiting lines with a structured, real-time digital queue experience.

Instead of standing in a line with no idea how long the wait will be, customers **register online, select a service, join a queue digitally, and receive a token**. They can then track their position and estimated wait time live — without ever needing to stand in place.

Administrators and counter operators get a **centralized dashboard** to manage counters, call tickets, and monitor the queue across all services in real time.

**Applicable to:** Hospitals, clinics, banks, government service centers, salons, telecom stores, service departments — anywhere physical queues create frustration.

---

## ❗ The Problem

Traditional queue management is broken in multiple ways:

| Problem | Impact |
|---|---|
| Customers physically stand in long lines | Wasted time, fatigue, frustration |
| No visibility into queue position | Customers don't know when they'll be called |
| No wait time estimate | Uncertainty leads to people leaving and returning repeatedly |
| Multiple services share one reception | Confusion about which line is for what |
| Manual token calling by staff | Prone to errors, favouritism, no record |
| No analytics on service performance | Management cannot improve throughput |

---

## ✅ The Solution

SmartQ solves these problems through a structured digital flow:

- **Customers** join a specific service queue from their phone or computer, receive a numbered token, and see live queue position and estimated wait time.
- **Counter operators (Admins)** work from a dedicated dashboard — they call the next ticket, start service, put tickets on hold, and complete or cancel them.
- **Super Admins** have full control — they manage counters, services, users, and can see analytics and feedback reports.
- **Socket.IO** keeps everyone in sync — when an admin calls a ticket, the customer's dashboard updates instantly without any refresh.

---

## 👥 Roles

SmartQ has three distinct user roles, each with their own interface and permissions:

| Role | Access |
|---|---|
| **Customer** | Dashboard, Join Queue, Queue History, Feedback, Profile |
| **Admin (Counter Operator)** | Counter Dashboard — call, start, hold, complete, cancel tickets |
| **Super Admin** | Everything above + manage users, counters, services, view reports & feedbacks |

---

## 🔄 Complete User Flows

### Customer Flow

```
Register / Login
      │
      ▼
Select a Service (e.g., "General Consultation")
      │
      ▼
Join Queue → Token Generated (e.g., GC-007)
      │       Counter automatically assigned (shortest queue)
      ▼
Customer Dashboard
  ├── Ticket Number
  ├── Assigned Counter
  ├── People Ahead (live)
  ├── Estimated Wait Time (live)
  └── Currently Serving Ticker
      │
      ▼
Counter Operator calls GC-007
  → Customer gets real-time notification: "Your ticket is called at Counter 2"
      │
      ▼
Customer goes to Counter 2 → Service Starts → Service Completes
      │
      ▼
Customer submits Feedback (rating + comment) → Visible to admins
      │
      ▼
Ticket moves to Queue History (viewable anytime)
```

---

### Counter Operator (Admin) Flow

```
Login → Counter Dashboard
      │
      ▼
View today's queue (all tickets for assigned counter)
      │
      ▼
Click "Call Next"
  → Oldest waiting ticket is called (FIFO)
  → Customer gets notification
  → All dashboards update in real time
      │
      ▼
Click "Start Service" → Ticket moves to SERVING
      │
      ▼
Actions available:
  ├── "Complete" → Ticket marked COMPLETED, counter becomes free
  ├── "On Hold"  → Ticket paused, counter becomes free to call next
  └── "Cancel"   → Ticket marked CANCELLED, removed from queue
```

---

### Super Admin Flow

```
Login → Admin Dashboard
  ├── Overview stats (total tickets, completed, avg wait time)
  ├── Manage Services (create, edit, delete, set average service time)
  ├── Manage Counters (create, assign services, toggle open/closed)
  ├── Manage Users (view all users, change roles, delete users)
  ├── Queue Control (view and cancel any waiting/active ticket)
  ├── Reports (today's stats, service breakdown, peak hours)
  └── Feedbacks (view all feedback, reply to customers, mark as read)
```

---

## ⚙️ How the Queue Logic Works

### 1. Ticket Generation
When a customer joins a queue:
- The backend finds all **active (open) counters** that handle the selected service.
- It picks the counter with the **shortest queue** (load balancing).
- A sequential ticket number is generated using the service prefix: `GC-001`, `GC-002`, etc. (the counter is stored on the `Service` model as `lastTicketNumber`).
- The ticket is saved and added to the chosen counter's queue array.

### 2. Queue Position & Wait Time (Live)
On the customer dashboard:
- Queue position = **index of the ticket in the counter's queue array** (0 = next to be called).
- Estimated wait time = `peopleAhead × service.averageServiceTime` (in minutes).
- This recalculates on every `queue_updated` socket event.

### 3. Call Next (FIFO)
When an admin clicks "Call Next":
- The backend reads the **first ticket in the counter's queue array** (oldest = first-in-first-out).
- Stale/cancelled tickets are cleaned from the front of the queue automatically.
- If the counter's queue is somehow empty, it falls back to finding any globally waiting ticket for that service.
- The ticket status changes: `waiting` → `calling` → `serving`.

### 4. Ticket Lifecycle
```
waiting → calling → serving → completed
                 ↘ on-hold  (can be re-called)
                 ↘ cancelled
```

### 5. Counter Guard (Concurrency)
If an admin tries to call a new ticket while the counter already has an active `calling` or `serving` ticket, the backend **rejects the request with a 409 conflict** — preventing duplicate active tickets even if two operators click simultaneously.

---

## ⚡ Real-Time Architecture (Socket.IO)

The system uses **Socket.IO** for bidirectional real-time updates. The Vite dev proxy forwards WebSocket connections to the backend in development. In production, the frontend connects directly to the backend via `VITE_SOCKET_URL`.

### Socket Rooms
| Room | Who joins | Purpose |
|---|---|---|
| `user_{userId}` | Each logged-in customer | Receive personal notifications (ticket called, service started, completed) |
| `counter_{counterId}` | Counter dashboard | Receive updates about their counter's queue |
| `serviceId` | Customer dashboard | Receive queue length updates for their service |

### Events Emitted by Backend
| Event | Trigger | Receivers |
|---|---|---|
| `queue_updated` | Any ticket state change | All clients + counter/service rooms |
| `ticket_called` | Admin clicks Call Next | All clients (global announcement) |
| `counter_status_changed` | Counter becomes busy/idle | All admin dashboards |
| `new_notification` | Personal ticket event | Specific user's room |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **React 18** | Frontend SPA — all customer and admin UIs |
| **React Router v6** | Client-side routing with role-based protected routes |
| **Vite** | Frontend build tool and dev server |
| **Vanilla CSS** | Custom styling — no CSS framework used |
| **Axios** | HTTP client for API requests |
| **Node.js + Express** | Backend REST API server |
| **Socket.IO** | Real-time bidirectional WebSocket communication |
| **MongoDB + Mongoose** | NoSQL database and ODM |
| **JSON Web Tokens (JWT)** | Stateless authentication |
| **bcryptjs** | Password hashing |
| **dotenv** | Environment variable management |
| **react-qr-code** | QR code generation on ticket preview |

---

## ✨ Key Features

### Customer
- ✅ Register and login with JWT-based auth
- ✅ Select from available services with live queue counts
- ✅ Join a queue — token generated automatically with service prefix
- ✅ Live customer dashboard: queue position, people ahead, estimated wait, currently serving number
- ✅ Real-time push notifications when ticket is called / service started / completed
- ✅ Cancel ticket from dashboard
- ✅ Submit star-rating feedback with comments after service
- ✅ View full ticket history
- ✅ Profile management
- ✅ Multi-language support (language context)
- ✅ QR code preview on Join Queue page

### Admin (Counter Operator)
- ✅ Dedicated Counter Dashboard
- ✅ View full queue for their counter (today's tickets)
- ✅ Call Next ticket (FIFO with automatic stale-ticket cleanup)
- ✅ Start Service / Put On Hold / Complete / Cancel tickets
- ✅ Real-time counter status broadcast to all connected dashboards

### Super Admin
- ✅ Analytics dashboard (total tickets, completed, average wait time)
- ✅ Service Management: create, edit, delete services; set average service time and prefix
- ✅ Counter Management: create counters, assign services, open/close counters
- ✅ User Management: view all users, change roles, delete users
- ✅ Queue Control: view all live tickets; cancel any ticket
- ✅ Reports page: service breakdown stats
- ✅ Feedback Management: view all customer feedback, reply to feedback, mark as read

---

## 🗄️ Database Models

### `User`
```
name, email, password (hashed), role (customer | admin | super_admin), createdAt
```

### `Service`
```
name, description, prefix (e.g. "GC"), averageServiceTime (minutes),
isActive, lastTicketNumber, serviceHours
```

### `Counter`
```
number, isActive, assignedStaff → User,
servicesHandled → [Service],
currentTicket → Ticket,
queue → [Ticket]   // Ordered array — position = queue priority
```

### `Ticket`
```
ticketNumber (e.g. "GC-007"), user → User, service → Service, counter → Counter,
status (waiting | calling | serving | on-hold | completed | cancelled),
estimatedWaitTime, initialPeopleAhead,
checkInTime, startTime, endTime
```

### `Feedback`
```
user → User, ticket → Ticket, rating (1–5), comments,
reply (admin response), readByAdmin, createdAt
```

### `Notification`
```
user → User, title, message, type, createdAt
```

### Relationships
```
Service ──< Ticket >── Counter
User ──< Ticket
User ──< Feedback >── Ticket
Counter >── [Ticket] (queue array — ordered list)
```

---

## 🏗️ Architecture Diagram

```mermaid
graph TD
    subgraph Frontend ["Frontend (React + Vite) — Netlify"]
        LP[Landing Page]
        Auth[Login / Register]
        CD[Customer Dashboard]
        JQ[Join Queue]
        AD[Admin Dashboard]
        CntD[Counter Dashboard]
    end

    subgraph Backend ["Backend (Node.js + Express) — Render"]
        API[REST API]
        SIO[Socket.IO Server]
        Auth_MW[JWT Middleware]
        QC[Queue Controller]
        AC[Admin Controller]
    end

    subgraph DB ["Database (MongoDB Atlas)"]
        Users[(Users)]
        Services[(Services)]
        Counters[(Counters)]
        Tickets[(Tickets)]
        Feedback[(Feedback)]
    end

    Frontend -- "HTTP (Axios)" --> API
    Frontend -- "WebSocket" --> SIO
    API --> Auth_MW --> QC & AC
    QC & AC --> DB
    SIO -- "queue_updated / ticket_called / new_notification" --> Frontend
```

---

## 🚀 Local Setup — Step by Step

### Prerequisites
- **Node.js** ≥ 18 — [Download here](https://nodejs.org/)
- **MongoDB** — either [local install](https://www.mongodb.com/try/download/community) or a free [MongoDB Atlas](https://cloud.mongodb.com/) cluster
- **Git** — [Download here](https://git-scm.com/)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/SmartQ.git
cd SmartQ
```

---

### Step 2: Setup the Backend

```bash
cd backend
```

Create a `.env` file (copy from the example):
```bash
cp .env.example .env
```

Open `.env` and fill in your values:
```env
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/smartq
JWT_SECRET=any_long_random_secret_string_here
```

> **Using MongoDB Atlas instead of local?** Replace `MONGO_URI` with your Atlas connection string:
> `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/smartq?retryWrites=true&w=majority`

Install dependencies and start:
```bash
npm install
npm run dev
```

✅ You should see:
```
Server running on port 5001
MongoDB Connected: 127.0.0.1
```

---

### Step 3: Setup the Frontend

Open a **new terminal window**:

```bash
cd frontend
npm install
npm run dev
```

✅ You should see:
```
  VITE ready in Xs
  ➜  Local:   http://localhost:5173/
```

> The frontend Vite dev server automatically proxies `/api` and `/socket.io` requests to `localhost:5001` — no additional frontend `.env` configuration is needed for local development.

---

### Step 4: Seed Initial Data (Optional)

To populate the database with sample services and a super admin account:
```bash
cd backend
npm run seed
```

---

### Step 5: Create Your First Super Admin

After registering a new account via the app, you can manually promote it to `super_admin`:

1. Open [MongoDB Compass](https://www.mongodb.com/products/compass) or Atlas > Browse Collections
2. Navigate to the `users` collection
3. Find your user document and change `role` from `"customer"` to `"super_admin"`
4. Save → You can now log in and access `/admin`


```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:5001`.

### Environment Variables

**Backend `.env`**
```env
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/smartq
JWT_SECRET=your_secret_key_here
```

**Frontend `.env`** *(only needed for production pointing to a live backend)*
```env
VITE_API_URL=https://your-backend.onrender.com/api
VITE_SOCKET_URL=https://your-backend.onrender.com
```

> In local development, leave the frontend `.env` empty — Vite proxies `/api` and `/socket.io` to `localhost:5001` automatically.

---

## ☁️ Deployment

| Service | Platform | Notes |
|---|---|---|
| **Frontend** | [Netlify](https://netlify.com) | Build command: `npm run build`, Publish dir: `dist`, Add `VITE_API_URL` and `VITE_SOCKET_URL` env vars |
| **Backend** | [Render](https://render.com) | Root dir: `backend`, Start command: `npm start`, Add `MONGO_URI` and `JWT_SECRET` env vars |
| **Database** | [MongoDB Atlas](https://cloud.mongodb.com) | Free tier M0, allow `0.0.0.0/0` in Network Access |

> ⚠️ Render free tier services spin down after 15 minutes of inactivity. The first request after inactivity may take 30–60 seconds.

---

## 🔮 Future Improvements

> The following are planned enhancements — **not currently implemented**.

- [ ] **SMS / Email notifications** when ticket is called (Twilio / SendGrid)
- [ ] **QR code scanning** at the counter to pull up customer ticket instantly
- [ ] **Kiosk mode** — a wall display showing currently serving ticket numbers per counter
- [ ] **Appointment scheduling** — book a specific time slot in advance
- [ ] **Multi-branch support** — separate queues and counters per physical location
- [ ] **PWA (Progressive Web App)** — installable on mobile, works offline for ticket viewing
- [ ] **Auto-advance** — automatically move a completed ticket and call the next one
- [ ] **Dedicated Notifications page** — currently routed but not yet implemented

---

## 💡 Why SmartQ is a Practical Solution

Traditional queuing wastes enormous amounts of human time. SmartQ addresses this by:

1. **Eliminating physical waiting** — customers can wait anywhere (their seat, outside, a café) while tracking their position on their phone.
2. **Reducing uncertainty** — real-time queue position and wait time estimates eliminate the anxiety of not knowing.
3. **Centralizing staff control** — counter operators have a single dashboard view of their queue. No paper, no shouting, no confusion.
4. **Balancing load automatically** — new customers are directed to the counter with the shortest queue, preventing pile-ups on specific counters.
5. **Creating an audit trail** — every ticket carries timestamps (check-in, service start, service end), enabling management to analyse throughput and identify bottlenecks.
6. **Closing the feedback loop** — customers can rate their experience, and admins can respond — creating accountability and helping improve service quality over time.

---

<div align="center">
  <sub>Built with ❤️ · SmartQ – Making Waiting Smarter</sub>
</div>

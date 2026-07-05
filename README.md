# TaskFlow - Employee & Task Management System

## Project Overview

TaskFlow is a modern, responsive full-stack application designed to manage employees and their daily tasks efficiently. The platform features robust role-based access control, real-time notifications, dynamic file uploads, report generation, and interactive data visualizations. 

Built with **React (Vite), TypeScript, Tailwind CSS, and Shadcn UI** on the frontend, and a highly scalable **Node.js, Express, and MySQL** backend, TaskFlow guarantees a premium, lightning-fast user experience.

---

## Application Architecture & Flow

The diagram below illustrates the high-level flow of data and requests through the TaskFlow system.

![Application Architecture](./public/flow.png "TaskFlow Architecture Flow")

The architecture follows a strict 4-tier model:
- **Client Layer:** Users (Admins and Employees) interact with the system via their web browsers.
- **Presentation Layer:** The Vite/React frontend serves as the UI, rendering Shadcn components and making JSON & Multipart API calls to the backend.
- **Application Layer:** The Node.js and Express backend receives these API calls. Requests first pass through an Auth Middleware for JWT validation. If authorized, the router forwards the request to the appropriate Controller (Auth, Task, Employee, or Report) to process business logic.
- **Data Layer:** The Controllers execute optimized SQL queries against the MySQL Database to fetch or mutate data, which is then sent back up the chain to the client.

---

## Installation Process

There are multiple ways to run TaskFlow locally. You can use the automated startup script, spin everything up with Docker, or run it manually.

### Option 1: Automated Script (Recommended for Local Dev)
We have provided an automated bash script that will install all dependencies for both the frontend and backend, and start both development servers concurrently.

```bash
# Ensure the script is executable
chmod +x bash.sh

# Run the setup script
./bash.sh
```
*Note: Make sure your MySQL database is running and the `.env` file is properly configured with your DB credentials before running.*

### Option 2: Docker Containerization
If you prefer not to manage local Node versions and databases, you can spin up the entire isolated environment (Frontend Nginx Server, Backend API, and MySQL Database) using Docker Compose.

```bash
# Build and start all services in detached mode
docker compose up -d --build
```
The application will automatically initialize the database schema and be available at `http://localhost`.

### Option 3: Manual Installation
```bash
# 1. Install and Start Backend
cd backend
npm install
npm run dev

# 2. Install and Start Frontend (In a new terminal window)
cd ..
npm install
npm run dev
```

---

## Features & Role-Based Access Control (RBAC)

TaskFlow features strict segregation of duties between **Admins** and standard **Employees**.

| Feature / Capability | Admin | Employee |
| :--- | :---: | :---: |
| **Authentication** | Register / Login | Register / Login |
| **Dashboard** | Full system overview & company stats | Personal overview & assigned task stats |
| **Employee Management** | Create, View, Update, Delete Employees | View colleague profiles only |
| **Task Management** | Create, Assign, Edit, Delete all tasks | Update status and attach files to assigned tasks |
| **Notifications** | Receives alerts when tasks are completed | Receives alerts when assigned a new task |
| **Report Generation** | Export CSV/Excel for ALL company tasks | Export CSV/Excel for assigned tasks only |
| **API Documentation** | Access to `/api-docs` Swagger UI | Access to `/api-docs` Swagger UI |

---

## Database Schema Structure

The application's relational data is structured to optimize fast querying and maintain strict referential integrity.

![Database Schema](./public/DB-schema.png "TaskFlow Database Schema")

---

## Testing and API Documentation

- **Interactive API Docs (Swagger):** With the backend running, visit `http://localhost:5001/api-docs` to interactively explore and test all API routes.
- **Backend Unit Tests:** Run `npm test` inside the `/backend` directory (Uses Jest + Supertest).
- **Frontend Unit Tests:** Run `npm test` in the root directory (Uses Vitest + React Testing Library).

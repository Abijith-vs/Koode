<div align="center">

# KOODE

**Real-Time Healthcare Management & Administration System**

[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-API-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![Vite](https://img.shields.io/badge/Vite-Build_Tool-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Security](https://img.shields.io/badge/Security-JWT-D22128?style=flat)](https://jwt.io/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat)](https://opensource.org/licenses/MIT)

Manage. Diagnose. Care.

[Overview](#%EF%B8%8F-project-overview) • [Key Features](#-key-features) • [Tech Stack](#-tech-stack) • [Structure](#-directory-structure) • [Installation](#-setup--installation-guide) • [Usage Roles](#-usage--roles)

<hr>

</div>

## 🛡️ Project Overview

Koode is a comprehensive, web-based solution designed to solve modern hospital administration challenges. It provides a seamless interface for patients, doctors, and administrators to interact, manage appointments, handle clinical workflows, and oversee organ donation processes.

## ✨ Key Features

- **Role-Based Access Control:** Secure dashboards tailored for Patients, Doctors, and Administrators.
- **Appointment Management:** Complete lifecycle management for appointments, from patient booking to doctor acceptance/rejection.
- **Clinical Diagnoses:** Doctors can record diagnoses and generate downloadable PDF reports for patients.
- **OrganEase:** A specialized module for managing organ donation records and requests.
- **Doctor Directory:** Browse and search for available doctors and hospitals within the network.
- **Secure Authentication:** JWT-based authentication with password hashing for enhanced security.

## 💻 Tech Stack

**Frontend:**
- React 19 (via Vite)
- React Router DOM
- Vanilla CSS (`App.css`, `index.css`)

**Backend:**
- Node.js & Express.js
- JSON File-Based Database (`/backend/data`)
- JWT & bcryptjs (Authentication & Security)
- Morgan & CORS

## 📁 Directory Structure

```text
Koode/
├── backend/                  # Express server & API backend
│   ├── data/                 # JSON database files
│   │   ├── appointments.json
│   │   ├── auth.json
│   │   ├── hospitals.json
│   │   └── organease.json
│   ├── src/
│   │   ├── lib/              # Database storage logic and middleware
│   │   │   ├── appointmentsStore.js
│   │   │   ├── authMiddleware.js
│   │   │   ├── authStore.js
│   │   │   ├── hospitalStore.js
│   │   │   ├── seedAdmin.js
│   │   │   └── store.js
│   │   ├── routes/           # API Endpoints
│   │   │   ├── appointments.js
│   │   │   ├── auth.js
│   │   │   ├── doctors.js
│   │   │   ├── hospitals.js
│   │   │   └── organease.js
│   │   └── index.js          # Express app entry point
│   └── package.json          # Backend dependencies
├── src/                      # React frontend source code
│   ├── assets/               # Static assets (images, icons)
│   ├── lib/                  # Frontend utilities/services (e.g., auth.js)
│   ├── pages/                # React components for pages
│   │   ├── AdminLogin.jsx
│   │   ├── AdminOrgans.jsx
│   │   ├── DoctorDashboard.jsx
│   │   ├── DoctorDirectory.jsx
│   │   ├── Login.jsx
│   │   ├── OrganEase.jsx
│   │   ├── PatientDashboard.jsx
│   │   └── Register.jsx
│   ├── App.jsx               # Main application component & routing
│   ├── App.css               # Component-specific styles
│   ├── index.css             # Global styles
│   └── main.jsx              # React DOM mounting
├── api/                      # Serverless function handlers (e.g., Vercel)
│   └── index.js
├── public/                   # Public static files
├── index.html                # Main HTML template
├── package.json              # Root/Frontend dependencies and workspace scripts
├── vercel.json               # Vercel deployment configuration
└── vite.config.js            # Vite configuration
```

## 🚀 Setup & Installation Guide

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18+ recommended) and npm installed on your machine.

### 1. Clone the repository
```bash
git clone <repository-url>
cd Koode
```

### 2. Install Dependencies
The project uses a monolithic setup with concurrently to run both frontend and backend simultaneously in dev mode. You need to install dependencies in both the root folder and the backend folder.

```bash
# Install root (frontend) dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Environment Variables
Copy the example environment files and update them accordingly:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Ensure your `.env` files contain the necessary secrets (like `JWT_SECRET` for authentication).

### 4. Running the Application locally
You can start both the frontend and backend servers simultaneously from the root directory using:

```bash
npm run dev
```

This will run:
- Frontend Vite server (usually on `http://localhost:5173`)
- Backend Express server

Alternatively, you can run them separately:
```bash
# Terminal 1 - Frontend
npm run dev:frontend

# Terminal 2 - Backend
npm run dev:backend
```

## 🛠 Usage & Roles

1. **Patient:** Register a new account to book appointments, view past medical history, and access downloadable diagnosis PDFs.
2. **Doctor:** Login to manage incoming appointment requests, view patient details, and add clinical diagnosis records.
3. **Admin:** Access administrative features like `OrganEase` to manage system-wide healthcare data.

## 🤝 Contributing
Contributions are welcome. Please ensure that you follow the established directory structure and use the JSON store helpers provided in `/backend/src/lib` when interacting with data.

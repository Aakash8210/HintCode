# HintCode 🧠

> **"Don't just solve problems. Learn to think through them."**

HintCode is an intelligent, AI-powered Data Structures and Algorithms (DSA) learning platform engineered for Computer Science students and developers. Instead of dumping full solutions when you get stuck on a coding problem, HintCode provides **progressive Socratic hints**—guiding your problem-solving mindset step-by-step from conceptual nudges to pseudocode.

---

## 🌟 Why HintCode?

### The Problem
When practicing on platforms like LeetCode, getting stuck is natural. However, asking traditional AI tools like ChatGPT often results in immediate code dumps. This deprives learners of critical problem-solving practice and active recall.

### The Solution
HintCode bridges the gap between getting stuck and mastering DSA. It connects directly to LeetCode, parses problem specifications, and delivers progressive guidance tailored to your current progress:
- **Level 1–2**: High-level conceptual nudges & pattern recognition.
- **Level 3–4**: Algorithmic intuition & pseudocode walkthroughs.
- **Level 5**: Targeted code snippets & solution reveals (only when you explicitly ask).

---

## ✨ Features

- 🔍 **LeetCode Problem Integration**: Instantly fetch problems by problem number or URL slug.
- 💡 **Progressive Socratic Hints**: 5 dynamic hint levels to keep you thinking without spoiling the answer.
- 🧩 **AI Problem Breakdown**: Simplifies complex constraints and problem statements into plain English.
- 🐛 **Intelligent Debug Assist**: Analyzes code errors and test case failures to point out logic bugs.
- ▶️ **In-Browser Code Execution**: Write, run, and test Python, Java, or C++ solutions against standard and custom test cases.
- 📊 **Submission History & Progress Tracking**: Keep track of previous attempts and solution progress.
- 🔐 **User Authentication**: Secure sign-in and profile management via Clerk.

---

## 📁 Repository Structure

```text
HintCode/
├── frontend/                 # Next.js 16 (App Router) Frontend Application
│   ├── app/                  # Pages, layouts, and API routes (/api/hint, /api/run-code, etc.)
│   ├── components/           # UI components (CodeEditor, HintPanel, ProblemPanel, etc.)
│   ├── lib/                  # Services & API integrations (Gemini, Claude, JDoodle, Piston, LeetCode)
│   ├── scripts/              # Utility scripts
│   ├── package.json          # Frontend dependencies & scripts
│   └── .env.example          # Environment variable template for frontend
│
└── backend/                  # Node.js + Express + TypeScript API Service
    ├── src/
    │   ├── routes/           # Express API endpoints & router logic
    │   └── index.ts          # Express server entry point
    ├── tsconfig.json         # TypeScript compiler configuration
    ├── package.json          # Backend dependencies & scripts
    └── .env.example          # Environment variable template for backend
```

---

## 🛠️ Prerequisites

Before getting started, make sure you have the following installed on your system:
- **Git**: [Download Git](https://git-scm.com/)
- **Node.js**: v18.0.0 or higher [Download Node.js](https://nodejs.org/)
- **npm**: v9.0.0 or higher (comes bundled with Node.js)

---

## 🚀 Quick Start Guide (Run Locally)

Follow these step-by-step instructions to clone, configure, and run HintCode on your local machine.

### Step 1: Clone the Repository

Open your terminal or command prompt and run:

```bash
git clone https://github.com/Aakash8210/HintCode.git
cd HintCode
```

---

### Step 2: Configure & Run Frontend

1. **Navigate to the frontend folder**:
   ```bash
   cd frontend
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Create the local environment file**:
   ```bash
   cp .env.example .env.local
   ```

4. **Add your API Keys to `.env.local`**:
   Open `.env.local` in your editor and add your key credentials:
   ```env
   # AI Models
   GEMINI_API_KEY=your_gemini_api_key_here

   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key

   # Code Execution (JDoodle or Judge0)
   JDOODLE_CLIENT_ID=your_jdoodle_client_id
   JDOODLE_CLIENT_SECRET=your_jdoodle_client_secret
   ```

5. **Start the Next.js development server**:
   ```bash
   npm run dev
   ```

6. Open your browser and go to: **`http://localhost:3000`**

---

### Step 3: Configure & Run Backend Service

Open a **new terminal tab/window** and run:

1. **Navigate to the backend folder**:
   ```bash
   cd HintCode/backend
   ```

2. **Install backend dependencies**:
   ```bash
   npm install
   ```

3. **Create the environment file**:
   ```bash
   cp .env.example .env
   ```

4. **Start the Express backend development server**:
   ```bash
   npm run dev
   ```

5. The backend service will run on: **`http://localhost:5001`** (Health check at `http://localhost:5001/api/health`).

---

## 🔑 Environment Variables Reference

| Variable Name | Description | Required / Optional |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key for progressive hints and AI breakdowns | **Required** |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Authentication publishable key | **Required** for Auth |
| `CLERK_SECRET_KEY` | Clerk Authentication secret key | **Required** for Auth |
| `JDOODLE_CLIENT_ID` | JDoodle API client ID for running code snippets | Optional (or Piston/Judge0) |
| `JDOODLE_CLIENT_SECRET` | JDoodle API secret key for code execution | Optional |
| `DATABASE_URL` | PostgreSQL / Neon Database connection string | Optional (for persistent history) |
| `PORT` | Backend server port (Default: `5001`) | Optional |

---

## 💻 NPM Command Cheat Sheet

### Frontend (`cd frontend`)
- `npm run dev`: Starts local Next.js server at `localhost:3000`
- `npm run build`: Compiles optimized production bundle
- `npm start`: Runs production server
- `npm run lint`: Checks TypeScript & code styling

### Backend (`cd backend`)
- `npm run dev`: Starts Express server with hot-reloading using `tsx`
- `npm run build`: Compiles TypeScript source to `dist/`
- `npm start`: Runs compiled production backend server (`node dist/index.js`)

---

## 🧰 Tech Stack Overview

- **Frontend**: Next.js 16 (React 18), TypeScript, Tailwind CSS, Framer Motion, Monaco Editor, Zustand, Shadcn UI
- **Backend**: Node.js, Express, TypeScript
- **AI Integrations**: Google Gemini API (`@google/genai`), Anthropic Claude API
- **Code Execution Engines**: JDoodle API, Judge0 API, Piston API
- **Data & Auth**: Clerk Auth, Neon PostgreSQL (`@neondatabase/serverless`)

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.

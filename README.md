# AI-Assessment-Creator

It's is a full-stack assessment creation platform that enables teachers to create assignments, automatically generate structured exam-ready question papers using AI, customize questions, and download them as print-ready PDF files.

---

## 🚀 Key Features

- **Dynamic Assignment Creator Form:** Standard parameters (Due date, instructions, optional files) combined with custom question type row allocators (reactive count and mark summaries).
- **AI Question Generation:** Powered by the Google Gemini API (with a customized local mock question generator fallback when no API key is present).
- **Background Job Queue:** Processes resource-heavy operations (AI calls, PDF compilation) asynchronously. Powered by **BullMQ & Redis** (with an automatic **MemoryQueue** fallback).
- **Hybrid Data Layer:** Connects to **MongoDB** (with an automatic local **JSON file database** fallback).
- **WebSocket Streaming:** Provides real-time generation progress updates (e.g., *Queueing*, *AI generating*, *PDF compiling*) from background workers to the client.
- **Structured Assessment Canvas:** Displays generated papers inside a sheet layout featuring school headers, student identification blocks, colored difficulty badges, and a collapsible answer key.
- **In-line Editor:** Allows teachers to manually edit generated question text before exporting, automatically re-compiling the PDF.
- **Aesthetic PDF Export:** High-quality downloadable PDFs created natively with PDFKit matching school layouts.
- **Browser Print Configured:** Hide dashboards/menus dynamically via `@media print` CSS configurations to print directly from the browser window.

---

## 🛠️ Architecture & Tech Stack

### Frontend
- **Framework:** Next.js (App Router, TypeScript)
- **Styling:** Tailwind CSS (Custom Outfit typography and animations)
- **State Management:** Zustand
- **WebSockets:** Native browser WebSocket API client-side subscription model

### Backend
- **Framework:** Node.js + Express (TypeScript, ts-node-dev)
- **Database:** MongoDB / Mongoose (Fallback: local JSON File DB `db.json`)
- **Queue System:** BullMQ / IORedis (Fallback: Async Promise-based queue `MemoryQueue`)
- **AI Integration:** Google Generative AI (`gemini-1.5-flash`)
- **PDF Generation:** PDFKit

```
                   ┌────────────────────────────────────────┐
                   │            Next.js Frontend            │
                   └───────┬─────────▲──────────────────────┘
                           │         │ (WebSockets)
                           │ HTTP    │ Real-time Updates
                           ▼         │
                   ┌─────────────────┴──────────────────────┐
                   │             Express Server             │
                   └───────┬─────────▲──────────────────────┘
                           │         │ Job Updates
                   (Adds   │         │
                    Job)   ▼         │
                   ┌─────────────────┴──────────────────────┐
                   │         BullMQ / Memory Queue          │
                   └─────────────────┬──────────────────────┘
                                     │ (Executes)
                                     ▼
                   ┌────────────────────────────────────────┐
                   │             Worker Process             │
                   │  1. Call Gemini AI / Mock AI           │
                   │  2. Format sections & questions        │
                   │  3. Compile PDF via PDFKit             │
                   │  4. Save results to DB (Mongo / JSON)  │
                   └────────────────────────────────────────┘
```

---

## ⚙️ Fallback Mechanism (Zero-Configuration Run)

To make review and grading seamless, the backend implements **automatic fallback engines**:
1. **No Redis?** If local Redis is down or disconnected, the system switches to an in-memory queue that mimics BullMQ. Background generation and WebSocket progress notifications still run.
2. **No MongoDB?** If MongoDB is unreachable, it logs a warning and stores records in `backend/db.json`. CRUD and retrieval functions work seamlessly.
3. **No Gemini API Key?** If no `GEMINI_API_KEY` is in `.env`, the server uses a mock AI generator that generates realistic, topic-relevant school questions based on your assignment titles.

---

## 📦 Project Directory Structure

```
ai-assessment-creator/
├── package.json             # Root monorepo runner
├── README.md                # Project documentation
├── backend/
│   ├── src/
│   │   ├── config/db.ts      # Hybrid DB (Mongoose / JSON file)
│   │   ├── services/
│   │   │   ├── ai.service.ts # Gemini API and mock question generator
│   │   │   ├── pdf.service.ts # PDFKit generator
│   │   │   ├── queue.service.ts # Queue abstraction (BullMQ / Memory)
│   │   │   ├── websocket.service.ts # WebSocket broadcast server
│   │   │   └── worker.ts     # Generation worker
│   │   └── server.ts         # Express server router
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── create/       # Assignment Form Component
    │   │   ├── assignment/   # Structured Output Canvas
    │   │   ├── layout.tsx    # VedaAI navigation sidebar
    │   │   └── page.tsx      # Dashboard Empty/List page
    │   ├── store/            # Zustand state manager
    │   └── services/         # WS client connection
    ├── tailwind.config.ts
    └── package.json
```

---

## 🚀 Installation & Running

### Prerequisites
- **Node.js** (v18.x or higher)
- **npm** (v9.x or higher)

### Setup Instructions

1. **Clone & Install Dependencies**
   Navigate to the root directory and install all node modules for both the root runner, backend, and frontend:
   ```bash
   npm run install:all
   ```

2. **Configure Environment Variables**
   Create a `.env` file in the `backend/` directory (an example `.env` is already configured for out-of-the-box local testing):
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/veda-ai
   REDIS_URL=redis://127.0.0.1:6379
   GEMINI_API_KEY=your_gemini_api_key_here
   FRONTEND_URL=http://localhost:3000
   ```

3. **Run the Application**
   Run both the Next.js frontend and Express backend concurrently from the root directory:
   ```bash
   npm run dev
   ```
   - **Frontend:** http://localhost:3000
   - **Backend API:** http://localhost:5000

---

## 🧪 Verification Tasks

1. **Dashboard Empty State:** Run the app and visit `http://localhost:3000`. You will be welcomed by VedaAI's empty state dashboard (Figma Design 1).
2. **AI Question Generation:** Click "+ Create Assignment" and fill out the details. Input dynamic question rows. When you click **Next**, the real-time WebSocket progress overlay tracks AI questions generation and PDF compilation.
3. **Structured Canvas & Print PDF:** You will be routed to the finished canvas. Tweak questions in-line, toggle the answer key, download the compiled PDF, or hit **Print Paper** (or standard `Ctrl + P`) to inspect print configurations.

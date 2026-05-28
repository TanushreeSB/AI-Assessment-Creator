import dotenv from 'dotenv';
// Load environment variables first
dotenv.config();

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { dbService } from './config/db';
import { wsService } from './services/websocket.service';
import { queueService } from './services/queue.service';
import { processAssignmentGeneration } from './services/worker';

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/veda-ai';
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// --- Middlewares ---
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

// Ensure public directories exist
const publicDir = path.join(__dirname, '../public');
const uploadsDir = path.join(__dirname, '../public/uploads');
const pdfsDir = path.join(__dirname, '../public/pdfs');
[publicDir, uploadsDir, pdfsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Serve static files
app.use(express.static(publicDir));
app.use('/pdfs', express.static(pdfsDir));
app.use('/uploads', express.static(uploadsDir));

// --- Multer File Upload Setup ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.txt', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, TXT, and image files are allowed.'));
    }
  }
});

// --- API Routes ---

// Get all assignments
app.get('/api/assignments', async (req, res) => {
  try {
    const list = await dbService.getAssignments();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single assignment
app.get('/api/assignments/:id', async (req, res) => {
  try {
    const assignment = await dbService.getAssignmentById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }
    res.json(assignment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create new assignment and queue generation
app.post('/api/assignments', upload.single('file'), async (req, res) => {
  try {
    const { title, dueDate, questionTypes, additionalInstructions } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Assignment Title is required.' });
    }

    let parsedQuestionTypes = [];
    try {
      parsedQuestionTypes = typeof questionTypes === 'string' 
        ? JSON.parse(questionTypes) 
        : questionTypes;
    } catch (e) {
      return res.status(400).json({ error: 'Invalid questionTypes format.' });
    }

    if (!parsedQuestionTypes || parsedQuestionTypes.length === 0) {
      return res.status(400).json({ error: 'At least one Question Type allocation is required.' });
    }

    const fileUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    // Create record in database (State: pending)
    const newAssignment = await dbService.createAssignment({
      title,
      dueDate,
      status: 'pending',
      progress: 0,
      questionTypes: parsedQuestionTypes,
      additionalInstructions,
      fileUrl
    });

    // Add background generation job
    await queueService.addJob(newAssignment._id);

    res.status(201).json(newAssignment);
  } catch (err: any) {
    console.error('Create assignment error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Regenerate question paper
app.post('/api/assignments/:id/regenerate', async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await dbService.getAssignmentById(id);
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    // Reset status and progress
    await dbService.updateAssignment(id, {
      status: 'pending',
      progress: 0,
      sections: [],
      answerKey: [],
      pdfPath: undefined
    });

    // Queue new generation job
    await queueService.addJob(id);

    res.json({ message: 'Regeneration job queued successfully.', id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update assignment details manually (e.g. editing generated questions)
app.put('/api/assignments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await dbService.getAssignmentById(id);
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    const updated = await dbService.updateAssignment(id, req.body);
    
    // If the sections or questions are updated, we should recompile the PDF
    if (updated && req.body.sections) {
      const { pdfService } = require('./services/pdf.service');
      const newPdfPath = await pdfService.generateAssignmentPDF(updated);
      await dbService.updateAssignment(id, { pdfPath: newPdfPath });
      updated.pdfPath = newPdfPath;
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete assignment
app.delete('/api/assignments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await dbService.getAssignmentById(id);
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    // Delete PDF file if exists
    if (assignment.pdfPath) {
      const fullPdfPath = path.join(__dirname, '../public', assignment.pdfPath);
      if (fs.existsSync(fullPdfPath)) {
        fs.unlinkSync(fullPdfPath);
      }
    }

    // Delete upload file if exists
    if (assignment.fileUrl) {
      const fullUploadPath = path.join(__dirname, '../public', assignment.fileUrl);
      if (fs.existsSync(fullUploadPath)) {
        fs.unlinkSync(fullUploadPath);
      }
    }

    const success = await dbService.deleteAssignment(id);
    res.json({ success, message: 'Assignment deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Server Startup ---
async function startServer() {
  // Connect to DB (with JSON DB fallback)
  await dbService.connect(MONGODB_URI);

  // Initialize Queue service (with BullMQ/Redis -> MemoryQueue fallback)
  await queueService.init(REDIS_URL, processAssignmentGeneration);

  // Initialize WebSockets bound to HTTP
  wsService.init(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log(`WebSocket server is active at ws://localhost:${PORT}/ws`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});

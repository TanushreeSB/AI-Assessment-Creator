import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

export interface IAssignment {
  _id: string;
  title: string;
  dueDate?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress: number;
  questionTypes: Array<{ type: string; count: number; marks: number }>;
  additionalInstructions?: string;
  fileUrl?: string;
  sections?: Array<{
    title: string;
    instruction: string;
    questions: Array<{
      questionText: string;
      difficulty: 'easy' | 'medium' | 'hard';
      marks: number;
    }>;
  }>;
  answerKey?: Array<{ questionNumber: string; answerText: string }>;
  pdfPath?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose Schema in case MongoDB is running
const AssignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  dueDate: String,
  status: { type: String, enum: ['pending', 'generating', 'completed', 'failed'], default: 'pending' },
  progress: { type: Number, default: 0 },
  questionTypes: [{
    type: { type: String, required: true },
    count: { type: Number, required: true },
    marks: { type: Number, required: true }
  }],
  additionalInstructions: String,
  fileUrl: String,
  sections: [{
    title: String,
    instruction: String,
    questions: [{
      questionText: String,
      difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
      marks: Number
    }]
  }],
  answerKey: [{
    questionNumber: String,
    answerText: String
  }],
  pdfPath: String
}, { timestamps: true });

const AssignmentModel = mongoose.model('Assignment', AssignmentSchema);

class DatabaseService {
  private isMongooseConnected: boolean = false;
  private jsonDbPath = path.join(__dirname, '../../db.json');

  constructor() {
    this.ensureJsonDbExists();
  }

  private ensureJsonDbExists() {
    if (!fs.existsSync(this.jsonDbPath)) {
      fs.writeFileSync(this.jsonDbPath, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  async connect(mongoUri: string): Promise<boolean> {
    try {
      console.log(`Connecting to MongoDB at: ${mongoUri}...`);
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 3000, // 3 seconds timeout
      });
      this.isMongooseConnected = true;
      console.log('Successfully connected to MongoDB.');
      return true;
    } catch (error) {
      console.warn('MongoDB connection failed. Falling back to local JSON database (db.json).');
      this.isMongooseConnected = false;
      return false;
    }
  }

  // --- JSON File DB Fallback Methods ---
  private readJsonDb(): IAssignment[] {
    this.ensureJsonDbExists();
    try {
      const data = fs.readFileSync(this.jsonDbPath, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }

  private writeJsonDb(data: IAssignment[]) {
    fs.writeFileSync(this.jsonDbPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  // --- Unified DB CRUD Methods ---
  async getAssignments(): Promise<IAssignment[]> {
    if (this.isMongooseConnected) {
      const docs = await AssignmentModel.find().sort({ createdAt: -1 });
      return docs.map(doc => doc.toObject() as IAssignment);
    } else {
      const data = this.readJsonDb();
      return data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }

  async getAssignmentById(id: string): Promise<IAssignment | null> {
    if (this.isMongooseConnected) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const doc = await AssignmentModel.findById(id);
      return doc ? (doc.toObject() as IAssignment) : null;
    } else {
      const data = this.readJsonDb();
      return data.find(item => item._id === id) || null;
    }
  }

  async createAssignment(assignmentData: Partial<IAssignment>): Promise<IAssignment> {
    if (this.isMongooseConnected) {
      const doc = await AssignmentModel.create(assignmentData);
      return doc.toObject() as IAssignment;
    } else {
      const db = this.readJsonDb();
      const newAssignment: IAssignment = {
        _id: new mongoose.Types.ObjectId().toString(),
        title: assignmentData.title || 'Untitled Assignment',
        dueDate: assignmentData.dueDate,
        status: assignmentData.status || 'pending',
        progress: assignmentData.progress || 0,
        questionTypes: assignmentData.questionTypes || [],
        additionalInstructions: assignmentData.additionalInstructions,
        fileUrl: assignmentData.fileUrl,
        sections: assignmentData.sections || [],
        answerKey: assignmentData.answerKey || [],
        pdfPath: assignmentData.pdfPath,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      db.push(newAssignment);
      this.writeJsonDb(db);
      return newAssignment;
    }
  }

  async updateAssignment(id: string, updateData: Partial<IAssignment>): Promise<IAssignment | null> {
    if (this.isMongooseConnected) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const doc = await AssignmentModel.findByIdAndUpdate(id, updateData, { new: true });
      return doc ? (doc.toObject() as IAssignment) : null;
    } else {
      const db = this.readJsonDb();
      const index = db.findIndex(item => item._id === id);
      if (index === -1) return null;

      const updated = {
        ...db[index],
        ...updateData,
        updatedAt: new Date()
      } as IAssignment;

      db[index] = updated;
      this.writeJsonDb(db);
      return updated;
    }
  }

  async deleteAssignment(id: string): Promise<boolean> {
    if (this.isMongooseConnected) {
      if (!mongoose.Types.ObjectId.isValid(id)) return false;
      const result = await AssignmentModel.findByIdAndDelete(id);
      return result !== null;
    } else {
      const db = this.readJsonDb();
      const initialLength = db.length;
      const filtered = db.filter(item => item._id !== id);
      this.writeJsonDb(filtered);
      return filtered.length < initialLength;
    }
  }
}

export const dbService = new DatabaseService();

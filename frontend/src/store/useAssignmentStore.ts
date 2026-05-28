import { create } from 'zustand';

export interface Question {
  questionText: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
}

export interface Section {
  title: string;
  instruction: string;
  questions: Question[];
}

export interface AnswerKeyItem {
  questionNumber: string;
  answerText: string;
}

export interface QuestionTypeConfig {
  type: string;
  count: number;
  marks: number;
}

export interface Assignment {
  _id: string;
  title: string;
  dueDate?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress: number;
  questionTypes: QuestionTypeConfig[];
  additionalInstructions?: string;
  fileUrl?: string;
  sections?: Section[];
  answerKey?: AnswerKeyItem[];
  pdfPath?: string;
  createdAt: string;
  updatedAt: string;
}

interface AssignmentState {
  assignments: Assignment[];
  isLoading: boolean;
  activeAssignment: Assignment | null;
  generationProgress: number;
  generationStatus: string;
  error: string | null;

  fetchAssignments: () => Promise<void>;
  fetchAssignment: (id: string) => Promise<Assignment | null>;
  createAssignment: (formData: FormData) => Promise<Assignment | null>;
  regenerateAssignment: (id: string) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  updateAssignmentInStore: (id: string, updatedData: Partial<Assignment>) => Promise<void>;
  updateLocalProgress: (assignmentId: string, status: string, progress: number, data?: any) => void;
  clearActiveAssignment: () => void;
}

const API_BASE_URL = 'http://localhost:5000/api';

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  assignments: [],
  isLoading: false,
  activeAssignment: null,
  generationProgress: 0,
  generationStatus: '',
  error: null,

  fetchAssignments: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/assignments`);
      if (!response.ok) throw new Error('Failed to fetch assignments');
      const data = await response.json();
      set({ assignments: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchAssignment: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/${id}`);
      if (!response.ok) throw new Error('Failed to fetch assignment details');
      const data = await response.json();
      set({ isLoading: false });
      return data as Assignment;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return null;
    }
  },

  createAssignment: async (formData: FormData) => {
    set({ isLoading: true, error: null, generationProgress: 0, generationStatus: 'Initiating...' });
    try {
      const response = await fetch(`${API_BASE_URL}/assignments`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create assignment');
      }

      const newAssignment = await response.json();
      
      set((state) => ({
        assignments: [newAssignment, ...state.assignments],
        activeAssignment: newAssignment,
        generationProgress: 0,
        generationStatus: 'Queued',
        isLoading: false,
      }));

      return newAssignment;
    } catch (err: any) {
      set({ error: err.message, isLoading: false, activeAssignment: null });
      return null;
    }
  },

  regenerateAssignment: async (id: string) => {
    set({ isLoading: true, error: null, generationProgress: 0, generationStatus: 'Queued for regeneration...' });
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/${id}/regenerate`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to trigger regeneration');

      // Update state for active monitoring
      set((state) => {
        const updatedList = state.assignments.map(item => 
          item._id === id 
            ? { ...item, status: 'pending', progress: 0, sections: [], answerKey: [], pdfPath: undefined } as Assignment
            : item
        );
        const target = updatedList.find(item => item._id === id) || null;
        return {
          assignments: updatedList,
          activeAssignment: target,
          generationProgress: 0,
          generationStatus: 'Re-queueing job...',
          isLoading: false
        };
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  deleteAssignment: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete assignment');
      
      set((state) => ({
        assignments: state.assignments.filter(item => item._id !== id),
        activeAssignment: state.activeAssignment?._id === id ? null : state.activeAssignment,
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  updateAssignmentInStore: async (id: string, updatedData: Partial<Assignment>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) throw new Error('Failed to update assignment');
      const updated = await response.json();

      set((state) => ({
        assignments: state.assignments.map(item => item._id === id ? updated : item),
        activeAssignment: state.activeAssignment?._id === id ? updated : state.activeAssignment,
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  updateLocalProgress: (assignmentId: string, status: string, progress: number, data?: any) => {
    set((state) => {
      // Update in assignments array
      const updatedAssignments = state.assignments.map((item) => {
        if (item._id === assignmentId) {
          const updatedItem = {
            ...item,
            status: progress === 100 ? 'completed' : progress === 0 ? 'failed' : 'generating',
            progress,
            ...(data?.pdfPath ? { pdfPath: data.pdfPath } : {})
          } as Assignment;
          return updatedItem;
        }
        return item;
      });

      // Update active assignment if currently being monitored
      let updatedActive = state.activeAssignment;
      if (state.activeAssignment && state.activeAssignment._id === assignmentId) {
        updatedActive = {
          ...state.activeAssignment,
          status: progress === 100 ? 'completed' : progress === 0 ? 'failed' : 'generating',
          progress,
          ...(data?.pdfPath ? { pdfPath: data.pdfPath } : {})
        } as Assignment;
      }

      return {
        assignments: updatedAssignments,
        activeAssignment: updatedActive,
        generationProgress: progress,
        generationStatus: status,
      };
    });
  },

  clearActiveAssignment: () => {
    set({ activeAssignment: null, generationProgress: 0, generationStatus: '' });
  }
}));

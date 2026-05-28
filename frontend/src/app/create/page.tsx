'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAssignmentStore, QuestionTypeConfig } from '../../store/useAssignmentStore';
import { subscribeToAssignment } from '../../services/websocket';
import { Upload, X, Calendar, Plus, Minus, File, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const AVAILABLE_QUESTION_TYPES = [
  'Multiple Choice Questions',
  'Short Questions',
  'Long Answer Questions',
  'Numerical Problems',
  'Diagram/Graph-Based Questions',
  'Fill in the Blanks',
  'True/False Statements'
];

export default function CreateAssignment() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createAssignment, activeAssignment, generationProgress, generationStatus, error, clearActiveAssignment } = useAssignmentStore();

  // Form State
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [questionTypes, setQuestionTypes] = useState<QuestionTypeConfig[]>([
    { type: 'Multiple Choice Questions', count: 4, marks: 1 },
    { type: 'Short Questions', count: 3, marks: 2 },
    { type: 'Diagram/Graph-Based Questions', count: 5, marks: 5 }
  ]);

  // UI Control
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Monitor URL params for re-entrant progress (e.g. if page refreshed during generation)
  const paramAssignmentId = searchParams.get('assignmentId');

  useEffect(() => {
    if (paramAssignmentId) {
      subscribeToAssignment(paramAssignmentId);
      setShowProgressModal(true);
    }
  }, [paramAssignmentId]);

  // Monitor generation completion to trigger routing
  useEffect(() => {
    if (activeAssignment && activeAssignment.status === 'completed') {
      const timer = setTimeout(() => {
        setShowProgressModal(false);
        clearActiveAssignment();
        router.push(`/assignment/${activeAssignment._id}`);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [activeAssignment, router, clearActiveAssignment]);

  // Calculated properties
  const totalQuestions = useMemo(() => {
    return questionTypes.reduce((sum, item) => sum + item.count, 0);
  }, [questionTypes]);

  const totalMarks = useMemo(() => {
    return questionTypes.reduce((sum, item) => sum + (item.count * item.marks), 0);
  }, [questionTypes]);

  // Form Handlers
  const handleAddQuestionType = () => {
    // Find first unused question type
    const usedTypes = questionTypes.map(q => q.type);
    const unusedType = AVAILABLE_QUESTION_TYPES.find(t => !usedTypes.includes(t)) || AVAILABLE_QUESTION_TYPES[0];

    setQuestionTypes([
      ...questionTypes,
      { type: unusedType, count: 5, marks: 5 }
    ]);
  };

  const handleRemoveQuestionType = (index: number) => {
    if (questionTypes.length <= 1) return;
    setQuestionTypes(questionTypes.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: keyof QuestionTypeConfig, value: any) => {
    const updated = [...questionTypes];
    if (field === 'count' || field === 'marks') {
      const numVal = parseInt(value) || 0;
      updated[index][field] = numVal < 0 ? 0 : numVal;
    } else {
      updated[index][field] = value;
    }
    setQuestionTypes(updated);
  };

  const handleIncrement = (index: number, field: 'count' | 'marks') => {
    const updated = [...questionTypes];
    updated[index][field]++;
    setQuestionTypes(updated);
  };

  const handleDecrement = (index: number, field: 'count' | 'marks') => {
    const updated = [...questionTypes];
    if (updated[index][field] > 1) {
      updated[index][field]--;
      setQuestionTypes(updated);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  // Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = 'Assessment Title is required.';
    if (!dueDate) errors.dueDate = 'Due Date is required.';
    
    questionTypes.forEach((qt, idx) => {
      if (qt.count <= 0) {
        errors[`qt-count-${idx}`] = 'Count must be greater than 0.';
      }
      if (qt.marks <= 0) {
        errors[`qt-marks-${idx}`] = 'Marks must be greater than 0.';
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const formData = new FormData();
    formData.append('title', title);
    formData.append('dueDate', dueDate);
    formData.append('additionalInstructions', additionalInstructions);
    formData.append('questionTypes', JSON.stringify(questionTypes));
    if (file) {
      formData.append('file', file);
    }

    setShowProgressModal(true);
    const result = await createAssignment(formData);
    
    if (result) {
      subscribeToAssignment(result._id);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-[calc(100vh-4rem)] flex flex-col justify-between bg-slate-50 relative">
      <div className="space-y-6 pb-20">
        {/* Navigation Breadcrumb */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Create Assignment</h1>
          <p className="text-sm text-slate-500">Set up a new assignment for your students using artificial intelligence.</p>
        </div>

        {/* Progress Timeline Tracker */}
        <div className="w-full flex items-center space-x-4 py-2 border-b border-slate-200">
          <div className="flex items-center space-x-2 text-sm font-bold text-orange-600">
            <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs">1</span>
            <span>Assignment Details</span>
          </div>
          <div className="h-[2px] w-12 bg-slate-200"></div>
          <div className="flex items-center space-x-2 text-sm font-medium text-slate-400">
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs">2</span>
            <span>Generate Output</span>
          </div>
        </div>

        {/* Main Form Box */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-sm">
          {/* Assessment Title */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-800" htmlFor="title">Assignment Title / Main Topic</label>
            <input
              id="title"
              type="text"
              placeholder="e.g. Quiz on Electricity or Photosynthesis Basics"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${formErrors.title ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-orange-200'} focus:outline-none focus:ring-4 transition-all text-sm`}
            />
            {formErrors.title && <p className="text-xs text-red-500 font-medium">{formErrors.title}</p>}
          </div>

          {/* Upload Block (Figma) */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-800">Assignment Details</h4>
            <p className="text-xs text-slate-400">Basic information about your assignment</p>
            
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-200 hover:border-orange-500/50 rounded-2xl p-6 text-center bg-slate-50/50 cursor-pointer transition-all hover:bg-slate-50 flex flex-col items-center justify-center space-y-3 relative group"
            >
              <input
                type="file"
                id="file-upload"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileChange}
                accept=".pdf,.txt,.png,.jpg,.jpeg"
              />
              {file ? (
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                    <File className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-semibold text-slate-800 truncate max-w-xs">{file.name}</div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="text-xs text-red-500 font-bold hover:underline"
                  >
                    Remove File
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 group-hover:text-orange-500 transition-colors">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Choose a file or drag & drop it here
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      JPEG, PNG, PDF, TXT upto 10MB
                    </p>
                  </div>
                  <span className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm group-hover:border-slate-300">
                    Browse Files
                  </span>
                </>
              )}
            </div>
            <p className="text-[10px] text-slate-400 text-center">Upload images or documents of your preferred reference content (Optional)</p>
          </div>

          {/* Due Date Calendar */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-800 flex items-center space-x-1">
              <span>Due Date</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${formErrors.dueDate ? 'border-red-500' : 'border-slate-200 focus:ring-orange-200'} focus:outline-none focus:ring-4 transition-all text-sm text-slate-700`}
              />
            </div>
            {formErrors.dueDate && <p className="text-xs text-red-500 font-medium">{formErrors.dueDate}</p>}
          </div>

          {/* Question Type Table (Figma) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-800">Question Types & Allocation</label>
              <button
                type="button"
                onClick={handleAddQuestionType}
                className="flex items-center space-x-1.5 text-xs text-orange-600 hover:text-orange-700 font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question Type</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-slate-50/50">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Question Type</th>
                    <th className="py-3 px-4 text-center">No. of Questions</th>
                    <th className="py-3 px-4 text-center">Marks per Q.</th>
                    <th className="py-3 px-4 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {questionTypes.map((qt, index) => (
                    <tr key={index} className="bg-white">
                      <td className="py-2.5 px-4">
                        <select
                          value={qt.type}
                          onChange={(e) => handleRowChange(index, 'type', e.target.value)}
                          className="w-full text-sm font-medium text-slate-800 bg-transparent border-0 focus:outline-none cursor-pointer"
                        >
                          {AVAILABLE_QUESTION_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <div className="inline-flex items-center justify-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                          <button
                            type="button"
                            onClick={() => handleDecrement(index, 'count')}
                            className="p-1 rounded text-slate-500 hover:bg-white transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            value={qt.count}
                            onChange={(e) => handleRowChange(index, 'count', e.target.value)}
                            className="w-10 text-center text-sm font-bold bg-transparent border-0 focus:ring-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleIncrement(index, 'count')}
                            className="p-1 rounded text-slate-500 hover:bg-white transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <div className="inline-flex items-center justify-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                          <button
                            type="button"
                            onClick={() => handleDecrement(index, 'marks')}
                            className="p-1 rounded text-slate-500 hover:bg-white transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            value={qt.marks}
                            onChange={(e) => handleRowChange(index, 'marks', e.target.value)}
                            className="w-10 text-center text-sm font-bold bg-transparent border-0 focus:ring-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleIncrement(index, 'marks')}
                            className="p-1 rounded text-slate-500 hover:bg-white transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          type="button"
                          disabled={questionTypes.length <= 1}
                          onClick={() => handleRemoveQuestionType(index)}
                          className="p-1 text-slate-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Dynamic Totals Panel */}
            <div className="flex flex-col items-end space-y-1 text-xs text-slate-500 font-medium">
              <div>Total Questions: <span className="font-extrabold text-slate-900 text-sm">{totalQuestions}</span></div>
              <div>Total Marks: <span className="font-extrabold text-orange-600 text-sm">{totalMarks}</span></div>
            </div>
          </div>

          {/* Additional Instructions */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-800" htmlFor="instructions">Additional Information (For better output)</label>
            <div className="relative">
              <textarea
                id="instructions"
                rows={3}
                placeholder="e.g. Generate a question paper for 1 hour duration. Focus on electrostatics and simple circuits. Distribute marks across easy to challenging questions."
                value={additionalInstructions}
                onChange={(e) => setAdditionalInstructions(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-orange-200 transition-all text-sm pr-10"
              />
              <button
                type="button"
                className="absolute right-3 bottom-4 text-slate-400 hover:text-slate-600 transition-colors"
                title="Voice input (Mock)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-slate-200 p-4 px-8 flex justify-between items-center z-10">
        <Link
          href="/"
          className="px-6 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-full text-slate-600 text-sm font-bold transition-all"
        >
          &larr; Previous
        </Link>
        <button
          onClick={handleSubmit}
          className="px-6 py-2.5 bg-slate-950 hover:bg-slate-900 hover:shadow-orange-500/10 hover:border-orange-500/30 text-white rounded-full text-sm font-bold flex items-center space-x-1.5 shadow-md shadow-slate-950/15"
        >
          <span>Next</span>
          <span>&rarr;</span>
        </button>
      </div>

      {/* Real-time WS progress loader overlay */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-100 shadow-2xl p-8 text-center space-y-6 flex flex-col items-center">
            
            {generationProgress < 100 ? (
              <div className="w-16 h-16 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shadow-inner relative">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shadow-inner relative">
                <CheckCircle className="w-8 h-8" />
              </div>
            )}

            <div className="space-y-2 w-full">
              <h3 className="font-extrabold text-slate-900 text-lg">
                {generationProgress < 100 ? 'Generating Assessment' : 'Question Paper Ready!'}
              </h3>
              <p className="text-xs font-semibold text-orange-600 animate-pulse tracking-wide uppercase">
                {generationStatus || 'Queueing background process...'}
              </p>
              <p className="text-xs text-slate-400">
                {generationProgress < 100 
                  ? 'Our AI engine is structuring questions and preparing the print PDF layout.' 
                  : 'Successfully generated. Redirecting to your classroom dashboard.'
                }
              </p>
            </div>

            {/* Progress Bar Container */}
            <div className="w-full space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>PROGRESS</span>
                <span>{generationProgress}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${generationProgress}%` }}
                ></div>
              </div>
            </div>

            {/* Error Message if failed */}
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-100 rounded-xl text-left w-full">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div>
                  <h6 className="text-xs font-bold text-red-800">Job Error</h6>
                  <p className="text-[10px] text-red-600 line-clamp-2">{error}</p>
                </div>
              </div>
            )}

            {/* Close button if error exists to let them tweak parameters */}
            {error && (
              <button
                onClick={() => { setShowProgressModal(false); clearActiveAssignment(); }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-bold transition-all"
              >
                Close and edit parameters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

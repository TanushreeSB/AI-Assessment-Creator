'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAssignmentStore, Assignment, Question } from '../../../store/useAssignmentStore';
import { Download, RefreshCw, Printer, Edit2, Check, X, Eye, EyeOff, Plus, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AssignmentOutput() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { fetchAssignment, updateAssignmentInStore, regenerateAssignment } = useAssignmentStore();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Custom states
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<{ sIdx: number; qIdx: number } | null>(null);
  const [editBuffer, setEditBuffer] = useState('');
  const [studentInfo, setStudentInfo] = useState({ name: '', rollNo: '', section: '' });

  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchAssignment(id);
    if (data) {
      setAssignment(data);
    } else {
      setError('Assignment could not be loaded.');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleRegenerate = async () => {
    if (confirm('Are you sure you want to regenerate all questions using AI? Any manual edits will be overwritten.')) {
      await regenerateAssignment(id);
      router.push(`/create?assignmentId=${id}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Manual Question Edit Handlers
  const startEditQuestion = (sIdx: number, qIdx: number, currentText: string) => {
    setEditingQuestionIndex({ sIdx, qIdx });
    setEditBuffer(currentText);
  };

  const cancelEditQuestion = () => {
    setEditingQuestionIndex(null);
    setEditBuffer('');
  };

  const saveEditQuestion = async (sIdx: number, qIdx: number) => {
    if (!assignment || !assignment.sections) return;

    const updatedSections = [...assignment.sections];
    updatedSections[sIdx].questions[qIdx].questionText = editBuffer;

    const updatedAssignment = {
      ...assignment,
      sections: updatedSections
    };

    // Update locally first for fast response
    setAssignment(updatedAssignment);
    setEditingQuestionIndex(null);

    // Persist to database (triggers backend PDF recompilation)
    await updateAssignmentInStore(id, { sections: updatedSections });
  };

  // Computed total marks
  const totalMarks = assignment?.sections?.reduce((sum, s) => {
    return sum + s.questions.reduce((mSum, q) => mSum + q.marks, 0);
  }, 0) || 0;

  const getDifficultyColor = (diff: Question['difficulty']) => {
    switch (diff) {
      case 'easy':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border border-amber-100';
      case 'hard':
        return 'bg-rose-50 text-rose-700 border border-rose-100';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-100';
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <RefreshCw className="w-10 h-10 animate-spin text-orange-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-500">Loading exam paper...</p>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Failed to load assignment</h2>
          <p className="text-sm text-slate-500">{error || 'Please check your connection and try again.'}</p>
          <Link href="/" className="inline-block px-6 py-2 bg-slate-950 text-white rounded-full text-xs font-bold">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const pdfDownloadUrl = `http://localhost:5000${assignment.pdfPath}`;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 min-h-[calc(100vh-4rem)] bg-slate-50">
      
      {/* Top Banner & Action Panel (Figma) */}
      <div className="no-print bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <h2 className="text-md font-bold text-orange-400">Assigned Successfully!</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Certainly, Lakshya! Here is the customized Question Paper for your CBSE Grade 8 Science classes on the NCERT chapters:
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Print directly from browser */}
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 py-2 px-4 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Paper</span>
          </button>

          {/* Regenerate AI */}
          <button
            onClick={handleRegenerate}
            className="flex items-center space-x-1.5 py-2 px-4 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerate</span>
          </button>

          {/* PDF Download link */}
          {assignment.pdfPath ? (
            <a
              href={pdfDownloadUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 py-2 px-5 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow shadow-orange-600/10"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </a>
          ) : (
            <button
              disabled
              className="flex items-center space-x-1.5 py-2 px-5 rounded-full bg-slate-800 text-slate-500 text-xs font-bold cursor-not-allowed"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Compiling PDF...</span>
            </button>
          )}
        </div>
      </div>

      {/* --- EXAM PAPER CANVAS CONTAINER --- */}
      <div className="exam-paper-container rounded-3xl p-8 md:p-12 relative overflow-hidden bg-white">
        
        {/* Exam Paper Border Graphic decoration */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-red-500"></div>

        {/* Paper Header */}
        <div className="text-center space-y-2">
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight uppercase">
            Delhi Public School, Bokaro Steel City
          </h1>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            Subject Assessment: {assignment.title}
          </h3>
          <p className="text-xs font-semibold text-slate-400">Class: 5th Grade | Term Examination</p>
        </div>

        {/* Allowed Time and Max Marks banner */}
        <div className="flex justify-between items-center text-xs md:text-sm font-extrabold text-slate-800 border-b border-slate-200 pb-3 mt-6">
          <span>Time Allowed: 60 minutes</span>
          <span className="text-orange-600">Maximum Marks: {totalMarks} Marks</span>
        </div>

        {/* Fillable Student Information Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-200 pb-6 pt-6 text-sm text-slate-700">
          <div className="flex items-center space-x-2">
            <span className="font-bold flex-shrink-0">Student Name:</span>
            <input
              type="text"
              placeholder="Enter name"
              value={studentInfo.name}
              onChange={(e) => setStudentInfo({ ...studentInfo, name: e.target.value })}
              className="flex-1 border-b border-slate-300 focus:border-orange-500 focus:outline-none bg-transparent py-0.5 text-slate-800 font-medium placeholder-slate-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <span className="font-bold flex-shrink-0">Roll No:</span>
              <input
                type="text"
                placeholder="Roll No"
                value={studentInfo.rollNo}
                onChange={(e) => setStudentInfo({ ...studentInfo, rollNo: e.target.value })}
                className="flex-1 border-b border-slate-300 focus:border-orange-500 focus:outline-none bg-transparent py-0.5 text-slate-800 font-medium placeholder-slate-300"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold flex-shrink-0">Section:</span>
              <input
                type="text"
                placeholder="A / B / C"
                value={studentInfo.section}
                onChange={(e) => setStudentInfo({ ...studentInfo, section: e.target.value })}
                className="flex-1 border-b border-slate-300 focus:border-orange-500 focus:outline-none bg-transparent py-0.5 text-slate-800 font-medium placeholder-slate-300"
              />
            </div>
          </div>
        </div>

        {/* General Instructions Block */}
        <div className="mt-6 space-y-1.5 text-xs text-slate-500">
          <p className="font-bold text-slate-700 text-sm">General Instructions:</p>
          <p>1. All questions are compulsory. Ensure you attempt all sections.</p>
          <p>2. Keep your answers brief, clear, and relevant to the marks allocated.</p>
          <p>3. Additional info: {assignment.additionalInstructions || 'Draft answers cleanly inside your test answer sheets.'}</p>
        </div>

        {/* Sections and Questions List */}
        <div className="mt-8 space-y-8">
          {assignment.sections && assignment.sections.length > 0 ? (
            assignment.sections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-4">
                
                {/* Section Title */}
                <div className="border-l-4 border-orange-500 pl-3">
                  <h4 className="text-md font-extrabold text-slate-900 tracking-wide uppercase">
                    {section.title}
                  </h4>
                  <p className="text-xs text-slate-400 italic font-medium">{section.instruction}</p>
                </div>

                {/* Questions Grid */}
                <div className="space-y-4">
                  {section.questions.map((q, qIdx) => {
                    const isEditing = editingQuestionIndex?.sIdx === sIdx && editingQuestionIndex?.qIdx === qIdx;
                    
                    return (
                      <div
                        key={qIdx}
                        className="group flex items-start justify-between p-3.5 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                      >
                        <div className="flex-1 pr-6 space-y-2">
                          {isEditing ? (
                            <div className="flex items-center space-x-2 w-full">
                              <textarea
                                value={editBuffer}
                                onChange={(e) => setEditBuffer(e.target.value)}
                                className="flex-1 text-sm font-medium text-slate-800 border border-slate-300 rounded-xl p-2 focus:ring-4 focus:ring-orange-200 focus:border-orange-500 focus:outline-none"
                                rows={2}
                              />
                              <div className="flex flex-col space-y-1">
                                <button
                                  onClick={() => saveEditQuestion(sIdx, qIdx)}
                                  className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                                  title="Save changes"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={cancelEditQuestion}
                                  className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start space-x-2 text-sm text-slate-800 leading-relaxed">
                              <span className="font-extrabold text-slate-900 min-w-[20px]">{qIdx + 1}.</span>
                              <span>{q.questionText}</span>
                            </div>
                          )}

                          {/* Meta Information Tags */}
                          {!isEditing && (
                            <div className="flex items-center space-x-3 text-xs pl-7">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getDifficultyColor(q.difficulty)}`}>
                                {q.difficulty}
                              </span>
                              <span className="text-slate-400 font-semibold">{q.marks} Mark(s)</span>
                            </div>
                          )}
                        </div>

                        {/* Interactive Edit Action trigger */}
                        {!isEditing && (
                          <button
                            onClick={() => startEditQuestion(sIdx, qIdx, q.questionText)}
                            className="no-print opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-all"
                            title="Edit question text"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-sm text-slate-500 py-6">No questions found in this assessment.</p>
          )}
        </div>

        {/* Collapsible Answer Key Block */}
        {assignment.answerKey && assignment.answerKey.length > 0 && (
          <div className="mt-12 pt-8 border-t-2 border-dashed border-slate-200 no-print">
            <button
              onClick={() => setShowAnswerKey(!showAnswerKey)}
              className="flex items-center justify-between py-3 px-6 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-800 w-full text-left font-bold transition-all shadow-sm"
            >
              <div className="flex items-center space-x-2">
                {showAnswerKey ? <EyeOff className="w-4.5 h-4.5 text-slate-500" /> : <Eye className="w-4.5 h-4.5 text-slate-500" />}
                <span>{showAnswerKey ? 'Hide' : 'Reveal'} Answer Key & marking scheme</span>
              </div>
              <span className="text-xs text-orange-600 bg-orange-100 px-3 py-0.5 rounded-full font-bold">Answer Key</span>
            </button>

            {showAnswerKey && (
              <div className="mt-4 p-6 bg-slate-50 border border-slate-100 rounded-2xl space-y-4 animate-fade-in">
                {assignment.answerKey.map((ans, idx) => (
                  <div key={idx} className="text-sm text-slate-800 leading-relaxed border-b border-slate-200 pb-3 last:border-b-0 last:pb-0">
                    <p className="font-extrabold text-slate-950 mb-1">Question {ans.questionNumber}:</p>
                    <p className="text-slate-600 font-medium">{ans.answerText}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

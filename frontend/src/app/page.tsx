'use client';

import { useEffect, useState } from 'react';
import { useAssignmentStore, Assignment } from '../store/useAssignmentStore';
import Link from 'next/link';
import { FileText, Calendar, MoreVertical, Trash2, Eye, RefreshCw, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { assignments, isLoading, fetchAssignments, deleteAssignment } = useAssignmentStore();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm('Are you sure you want to delete this assignment?')) {
      await deleteAssignment(id);
      setActiveMenuId(null);
    }
  };

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  // Close menus on click outside
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not set';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: Assignment['status']) => {
    switch (status) {
      case 'completed':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">Ready</span>;
      case 'generating':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center space-x-1 animate-pulse"><RefreshCw className="w-3 h-3 animate-spin" /><span>Generating</span></span>;
      case 'failed':
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center space-x-1"><AlertCircle className="w-3 h-3" /><span>Failed</span></span>;
      default:
        return <span className="bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">Pending</span>;
    }
  };

  if (isLoading && assignments.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg"></div>
          <div className="h-10 w-36 bg-slate-200 animate-pulse rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-slate-200 rounded-2xl bg-white p-6 h-48 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-6 w-3/4 bg-slate-200 animate-pulse rounded"></div>
                <div className="h-4 w-1/2 bg-slate-200 animate-pulse rounded"></div>
              </div>
              <div className="h-8 w-1/3 bg-slate-200 animate-pulse rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty State (Figma - Image 0)
  if (assignments.length === 0) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-100/55 flex flex-col items-center">
          {/* Centered Graphic Icon */}
          <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner relative">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400">
              <FileText className="w-8 h-8" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-rose-500 border-4 border-white flex items-center justify-center shadow">
              <span className="text-white font-extrabold text-xs">✕</span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900">No assignments yet</h2>
            <p className="text-sm text-slate-500 leading-relaxed px-4">
              Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.
            </p>
          </div>

          <Link
            href="/create"
            className="flex items-center justify-center space-x-2 py-3 px-6 rounded-full bg-slate-950 hover:bg-slate-900 text-white font-semibold text-sm transition-all duration-200 shadow-md shadow-slate-950/10 hover:shadow-orange-500/15"
          >
            <span>+</span>
            <span>Create Your First Assignment</span>
          </Link>
        </div>
      </div>
    );
  }

  // Populated Grid State (Figma - Image 1)
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-[calc(100vh-4rem)] bg-slate-50">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950">Assignments</h1>
          <p className="text-sm text-slate-500">Manage and create assessments for your classes.</p>
        </div>
        <Link
          href="/create"
          className="flex items-center justify-center space-x-2 py-2.5 px-6 rounded-full bg-slate-950 hover:bg-slate-900 text-white font-semibold text-sm transition-all duration-200 shadow-md w-full md:w-auto"
        >
          <span>+ Create Assignment</span>
        </Link>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.map((assignment) => (
          <Link
            key={assignment._id}
            href={assignment.status === 'completed' ? `/assignment/${assignment._id}` : `/create?assignmentId=${assignment._id}`}
            className="group block border border-slate-200/80 bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 relative hover:border-orange-200/50"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1 pr-6 overflow-hidden">
                <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-orange-600 transition-colors truncate">
                  {assignment.title}
                </h3>
                <div className="flex items-center space-x-4 text-xs text-slate-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Assigned: {formatDate(assignment.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Three dots menu */}
              <div className="relative">
                <button
                  onClick={(e) => toggleMenu(assignment._id, e)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {activeMenuId === assignment._id && (
                  <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                    <Link
                      href={assignment.status === 'completed' ? `/assignment/${assignment._id}` : `/create?assignmentId=${assignment._id}`}
                      className="flex items-center space-x-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 w-full text-left"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>View Assignment</span>
                    </Link>
                    <button
                      onClick={(e) => handleDelete(assignment._id, e)}
                      className="flex items-center space-x-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 w-full text-left font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Status / Questions counts */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-6">
              <div className="text-xs text-slate-400 font-medium">
                {assignment.status === 'completed' ? (
                  <span>
                    {assignment.sections?.reduce((sum, s) => sum + s.questions.length, 0)} Questions
                  </span>
                ) : assignment.status === 'generating' ? (
                  <span className="text-amber-600 font-semibold">{assignment.progress}% complete</span>
                ) : (
                  <span>Pending AI</span>
                )}
              </div>
              <div>
                {getStatusBadge(assignment.status)}
              </div>
            </div>

            {/* Progress loading strip */}
            {assignment.status === 'generating' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-100 rounded-b-2xl overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300"
                  style={{ width: `${assignment.progress}%` }}
                ></div>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

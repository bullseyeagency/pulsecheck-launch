'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Loader2, Trash2, Eye, Plus, AlertCircle,
} from 'lucide-react';

interface AuditSummary {
  id: string;
  domain: string;
  industry: string;
  location: string;
  created_at: string;
  status: 'complete' | 'running' | 'failed';
}

function statusBadge(status: string) {
  switch (status) {
    case 'complete':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'running':
      return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    case 'failed':
      return 'bg-red-500/15 text-red-400 border-red-500/30';
    default:
      return 'bg-[#2a2a2a] text-[#8b8b93] border-[#2a2a2a]';
  }
}

export default function AuditsPage() {
  const [audits, setAudits] = useState<AuditSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchAudits();
  }, []);

  const fetchAudits = async () => {
    try {
      const res = await fetch('/api/audits');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load audits');
      setAudits(data.audits || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/audit/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }
      setAudits((prev) => prev.filter((a) => a.id !== id));
      setDeleteId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="ml-64 min-h-screen bg-[#0a0a0a] p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Search className="h-7 w-7 text-[#EF5744]" />
              <div>
                <h1 className="text-2xl font-bold text-white">All Audits</h1>
                <p className="text-[#8b8b93] text-sm mt-1">
                  View and manage your SEO audit reports.
                </p>
              </div>
            </div>
            <Link
              href="/audit"
              className="px-4 py-2 bg-[#EF5744] hover:bg-[#c93a2a] text-white font-semibold rounded transition-colors text-sm flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Audit
            </Link>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-red-500/10 border border-red-500/30 rounded p-4 mb-6"
              >
                <p className="text-red-400 text-sm">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 text-[#EF5744] animate-spin" />
            </div>
          )}

          {/* Empty state */}
          {!loading && audits.length === 0 && !error && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#141414] border border-[#2a2a2a] rounded p-12 text-center"
            >
              <Search className="h-10 w-10 text-[#8b8b93] mx-auto mb-4" />
              <p className="text-white text-lg font-semibold mb-2">No audits yet</p>
              <p className="text-[#8b8b93] text-sm mb-6">
                Run your first audit to get a full SEO analysis with actionable recommendations.
              </p>
              <Link
                href="/audit"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#EF5744] hover:bg-[#c93a2a] text-white font-semibold rounded transition-colors text-sm"
              >
                <Plus className="h-4 w-4" />
                Run Your First Audit
              </Link>
            </motion.div>
          )}

          {/* Table */}
          {!loading && audits.length > 0 && (
            <div className="bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2a2a2a]">
                    <th className="text-left px-4 py-3 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Domain</th>
                    <th className="text-left px-4 py-3 text-[#8b8b93] text-xs uppercase tracking-wider font-medium hidden md:table-cell">Industry</th>
                    <th className="text-left px-4 py-3 text-[#8b8b93] text-xs uppercase tracking-wider font-medium hidden lg:table-cell">Location</th>
                    <th className="text-left px-4 py-3 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Date</th>
                    <th className="text-left px-4 py-3 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Status</th>
                    <th className="text-right px-4 py-3 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {audits.map((audit, i) => (
                    <tr
                      key={audit.id}
                      className={`border-b border-[#1f1f1f] hover:bg-[rgba(255,255,255,0.02)] transition-colors ${
                        i % 2 === 0 ? 'bg-[#141414]' : 'bg-[#111]'
                      }`}
                    >
                      <td className="px-4 py-3 text-white font-medium">{audit.domain}</td>
                      <td className="px-4 py-3 text-[#a1a1aa] hidden md:table-cell">{audit.industry}</td>
                      <td className="px-4 py-3 text-[#a1a1aa] hidden lg:table-cell">{audit.location}</td>
                      <td className="px-4 py-3 text-[#8b8b93] text-xs font-mono">
                        {new Date(audit.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${statusBadge(audit.status)}`}>
                          {audit.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/audit/${audit.id}`}
                            className="p-1.5 text-[#8b8b93] hover:text-white hover:bg-[rgba(255,255,255,0.05)] rounded transition-colors"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteId(audit.id)}
                            className="p-1.5 text-[#8b8b93] hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Delete confirmation modal */}
          <AnimatePresence>
            {deleteId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
                onClick={() => !deleting && setDeleteId(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-[#141414] border border-[#2a2a2a] rounded p-6 max-w-sm w-full mx-4"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <p className="text-white font-semibold">Delete Audit</p>
                  </div>
                  <p className="text-[#a1a1aa] text-sm mb-6">
                    Are you sure you want to delete this audit? This action cannot be undone.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setDeleteId(null)}
                      disabled={deleting}
                      className="px-4 py-2 text-sm text-[#a1a1aa] border border-[#2a2a2a] rounded hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(deleteId)}
                      disabled={deleting}
                      className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      Delete
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </>
  );
}

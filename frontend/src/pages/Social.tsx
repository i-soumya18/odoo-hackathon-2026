import React, { useState, useEffect, useContext } from 'react';
import { Users, FileText, CheckCircle, XCircle, Clock, X } from 'lucide-react';
import api from '../lib/api';
import { ToastContext } from '../components/Layout';

/* ─── Status pill helper ─────────────────────────────────────── */
const statusClass = (s) => {
  const map = {
    Completed: 'status-pill-completed',
    Active: 'status-pill-active',
    Planned: 'status-pill-planned',
    Approved: 'status-pill-completed',
    Pending: 'status-pill-in-review',
    Rejected: 'status-pill-open',
  };
  return `status-pill ${map[s] || 'status-pill-draft'}`;
};

/* ─── Social Page ────────────────────────────────────────────── */
export default function Social() {
  const { show: showToast } = useContext(ToastContext);
  const [activeTab, setActiveTab] = useState('activities');
  const [activities, setActivities] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  // Join modal
  const [joinActivity, setJoinActivity] = useState(null);
  const [proofUrl, setProofUrl] = useState('');
  const [joining, setJoining] = useState(false);

  const tabs = [
    { id: 'activities',     label: 'CSR Activities' },
    { id: 'participation',  label: 'Employee Participation' },
  ];

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [aRes, pRes] = await Promise.all([
        api.get('/social/csr-activities'),
        api.get('/social/csr-participations/pending'),
      ]);
      setActivities(aRes.data);
      setPending(pRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setJoining(true);
    try {
      await api.post(`/social/csr-activities/${joinActivity.id}/join`, {
        proof_file_url: proofUrl || null,
      });
      showToast(`Joined "${joinActivity.title}"! Pending manager approval.`, 'success');
      setJoinActivity(null);
      setProofUrl('');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to join activity.', 'error');
    } finally {
      setJoining(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/gamification/csr-participations/${id}/approve`);
      showToast('Participation approved! XP/points awarded.', 'success');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Approval failed.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="skeleton h-10 w-48 rounded-xl" />
        <div className="grid grid-cols-3 gap-5">
          {[1,2,3].map(i => <div key={i} className="skeleton h-40 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Social & CSR</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">Manage corporate social responsibility activities and participation</p>
      </div>

      {/* Sub-tabs */}
      <div className="subtab-bar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`subtab-btn ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── CSR Activities Tab ── */}
      {activeTab === 'activities' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">{activities.length} activities</p>
          </div>
          {activities.length === 0 ? (
            <div className="card p-16 text-center">
              <Users size={40} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--accent-social)' }} />
              <h3 className="font-semibold text-[var(--text-primary)] text-lg">No CSR Activities Yet</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Create your first CSR campaign to start tracking employee participation.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {activities.map(act => (
                <div
                  key={act.id}
                  className="card card-hover p-5 flex flex-col gap-3 relative overflow-hidden"
                  style={{ borderLeft: '4px solid var(--accent-social)' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-[var(--text-primary)] text-base leading-tight">{act.title}</h3>
                    <span className={statusClass(act.status)}>{act.status}</span>
                  </div>

                  {act.description && (
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2">{act.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="flex items-center gap-1 text-[var(--text-secondary)] bg-[var(--surface-alt)] px-2 py-0.5 rounded-full">
                      <Clock size={10} /> {new Date(act.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {act.evidence_required && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-amber-700 bg-amber-50 border border-amber-200">
                        📎 Evidence Required
                      </span>
                    )}
                  </div>

                  <div className="mt-auto pt-3 border-t border-[var(--border)]">
                    <button
                      onClick={() => setJoinActivity(act)}
                      className="text-sm font-semibold hover:underline flex items-center gap-1 transition-colors"
                      style={{ color: 'var(--accent-social)' }}
                    >
                      Join Campaign →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Employee Participation Tab ── */}
      {activeTab === 'participation' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-alt)]">
            <h3 className="font-semibold text-[var(--text-primary)]">Pending Approvals</h3>
            <span className="text-xs font-semibold bg-white border border-[var(--border)] px-2 py-0.5 rounded-full text-[var(--text-secondary)]">
              {pending.length} pending
            </span>
          </div>

          {pending.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle size={36} className="mx-auto mb-3 text-green-400" />
              <p className="font-semibold text-[var(--text-primary)]">All caught up!</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">No pending participations to review.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Activity</th>
                    <th>Proof</th>
                    <th>Points</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map(p => (
                    <tr key={p.id}>
                      <td className="font-medium">{p.employee_name || p.employee_id?.slice(0, 8) + '…'}</td>
                      <td className="text-[var(--text-secondary)]">{p.csr_activity_title || p.csr_activity_id?.slice(0, 8) + '…'}</td>
                      <td>
                        {p.proof_file_url ? (
                          <a
                            href={p.proof_file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full hover:underline"
                          >
                            <FileText size={11} /> View Proof
                          </a>
                        ) : (
                          <span className="text-[var(--text-secondary)] text-xs">—</span>
                        )}
                      </td>
                      <td className="font-semibold">{p.points_earned ?? '—'}</td>
                      <td><span className={statusClass(p.approval_status)}>{p.approval_status}</span></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleApprove(p.id)} className="btn-success text-xs py-1 px-3">
                            Approve
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Join Modal ── */}
      {joinActivity && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setJoinActivity(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-[var(--text-primary)]">Join: {joinActivity.title}</h3>
              <button onClick={() => setJoinActivity(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-full hover:bg-[var(--surface-alt)]">
                <X size={18} />
              </button>
            </div>
            {joinActivity.evidence_required && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 font-medium">
                📎 This activity requires proof of participation.
              </div>
            )}
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="form-label">Proof Document URL {!joinActivity.evidence_required && '(Optional)'}</label>
                <input
                  type="url"
                  value={proofUrl}
                  onChange={e => setProofUrl(e.target.value)}
                  required={joinActivity.evidence_required}
                  className="form-input"
                  placeholder="https://docs.example.com/proof.pdf"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setJoinActivity(null)} className="btn-secondary">Cancel</button>
                <button
                  type="submit"
                  disabled={joining}
                  className="btn-primary disabled:opacity-60"
                  style={{ background: 'var(--accent-social)', borderColor: 'var(--accent-social)' }}
                >
                  {joining ? 'Joining…' : 'Confirm Participation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

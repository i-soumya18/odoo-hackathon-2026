import React, { useState, useEffect, useContext } from 'react';
import { Shield, FileText, AlertTriangle, CheckCircle, Clock, ChevronDown } from 'lucide-react';
import api from '../lib/api';
import { ToastContext } from '../components/Layout';

/* ─── Helpers ────────────────────────────────────────────────── */
const auditStatusClass = (s) => {
  if (s === 'Completed')    return 'status-pill status-pill-completed';
  if (s === 'Under Review') return 'status-pill status-pill-in-review';
  if (s === 'Planned')      return 'status-pill status-pill-planned';
  return 'status-pill status-pill-draft';
};

const sevClass = (s) => {
  if (!s) return 'status-pill status-pill-draft';
  const l = s.toLowerCase();
  if (l === 'critical') return 'status-pill sev-critical';
  if (l === 'high')     return 'status-pill sev-high';
  if (l === 'medium')   return 'status-pill sev-medium';
  return 'status-pill sev-low';
};

const issueStatusClass = (s) => {
  if (s === 'Resolved')    return 'status-pill status-pill-resolved';
  if (s === 'In Progress') return 'status-pill status-pill-progress';
  return 'status-pill status-pill-open';
};

/* ─── Governance Page ─────────────────────────────────────────── */
export default function Governance() {
  const { show: showToast } = useContext(ToastContext);
  const [activeTab, setActiveTab] = useState('policies');
  const [policies, setPolicies] = useState([]);
  const [audits, setAudits] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'policies',  label: 'Policies' },
    { id: 'audits',    label: 'Audits' },
    { id: 'issues',    label: 'Compliance Issues' },
  ];

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, aRes, iRes] = await Promise.all([
        api.get('/governance/policies'),
        api.get('/governance/audits'),
        api.get('/governance/compliance-issues'),
      ]);
      setPolicies(pRes.data);
      setAudits(aRes.data);
      setIssues(iRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/governance/compliance-issues/${id}/status`, { status: newStatus });
      showToast(`Issue status updated to "${newStatus}"`, 'success');
      fetchData();
    } catch {
      showToast('Failed to update issue status.', 'error');
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await api.post(`/governance/policies/${id}/acknowledge`);
      showToast('Policy acknowledged successfully', 'success');
      fetchData();
    } catch {
      showToast('Failed to acknowledge policy.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="skeleton h-10 w-56 rounded-xl" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );
  }

  const overdueCount = issues.filter(i => i.is_overdue && i.status !== 'Resolved').length;

  return (
    <div className="space-y-5 max-w-6xl animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Governance & Compliance</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">Manage policies, audits, and compliance issues</p>
        </div>
        {overdueCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm font-semibold text-red-700">
            <AlertTriangle size={15} />
            {overdueCount} overdue issue{overdueCount > 1 ? 's' : ''}
          </div>
        )}
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
            {tab.id === 'issues' && overdueCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold bg-red-500 text-white rounded-full">
                {overdueCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Policies Tab ── */}
      {activeTab === 'policies' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2 bg-[var(--surface-alt)]">
            <Shield size={16} style={{ color: 'var(--accent-governance)' }} />
            <h3 className="font-semibold text-[var(--text-primary)]">Corporate Policies</h3>
          </div>
          {policies.length === 0 ? (
            <div className="p-12 text-center">
              <Shield size={36} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--accent-governance)' }} />
              <h3 className="font-semibold text-[var(--text-primary)]">No Policies Defined</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Contact your administrator to add ESG policies.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Created Date</th>
                    <th>Requires Acknowledgement</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map(p => (
                    <tr key={p.id}>
                      <td className="font-medium">{p.title}</td>
                      <td className="text-[var(--text-secondary)]">{p.category || '—'}</td>
                      <td className="text-[var(--text-secondary)]">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        {p.requires_acknowledgement ? (
                          p.is_acknowledged ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                              ✓ Acknowledged
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAcknowledge(p.id)}
                              className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-semibold rounded-md border border-amber-300 transition-colors"
                            >
                              Acknowledge
                            </button>
                          )
                        ) : (
                          <span className="text-xs text-[var(--text-secondary)]">Not required</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-pill ${p.status === 'Active' ? 'status-pill-active' : 'status-pill-draft'}`}>
                          {p.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Audits Tab ── */}
      {activeTab === 'audits' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2 bg-[var(--surface-alt)]">
            <FileText size={16} style={{ color: 'var(--accent-governance)' }} />
            <h3 className="font-semibold text-[var(--text-primary)]">Audit Records</h3>
          </div>
          {audits.length === 0 ? (
            <div className="p-12 text-center">
              <FileText size={36} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--accent-governance)' }} />
              <h3 className="font-semibold text-[var(--text-primary)]">No Audits Found</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">No audit records are available yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Department</th>
                    <th>Auditor</th>
                    <th>Date</th>
                    <th>Findings</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {audits.map(a => (
                    <tr key={a.id}>
                      <td className="font-medium">{a.title}</td>
                      <td className="text-[var(--text-secondary)]">{a.department_name || '—'}</td>
                      <td className="text-[var(--text-secondary)]">{a.auditor_name || '—'}</td>
                      <td className="text-[var(--text-secondary)]">
                        {a.date ? new Date(a.date).toLocaleDateString() : '—'}
                      </td>
                      <td className="text-[var(--text-secondary)] max-w-xs truncate">{a.findings_summary || '—'}</td>
                      <td><span className={auditStatusClass(a.status)}>{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Compliance Issues Tab ── */}
      {activeTab === 'issues' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">
              {issues.length} total · {overdueCount} overdue
            </p>
          </div>

          {issues.length === 0 ? (
            <div className="card p-12 text-center">
              <CheckCircle size={36} className="mx-auto mb-3 text-green-400" />
              <h3 className="font-semibold text-[var(--text-primary)]">No Open Issues</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Great work — all compliance issues are resolved.</p>
            </div>
          ) : (
            issues.map(issue => (
              <div key={issue.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  {/* Left: description + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-[var(--text-primary)]">{issue.description}</p>
                      {issue.is_overdue && issue.status !== 'Resolved' && (
                        <span className="overdue-badge">
                          <Clock size={9} /> OVERDUE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Owner: <span className="font-medium text-[var(--text-primary)]">{issue.owner_name || 'Unassigned'}</span>
                      {issue.due_date && (
                        <> · Due: <span className={issue.is_overdue ? 'text-red-600 font-semibold' : ''}>
                          {new Date(issue.due_date).toLocaleDateString()}
                        </span></>
                      )}
                    </p>
                  </div>

                  {/* Right: severity + current status */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={sevClass(issue.severity)}>{issue.severity}</span>
                    <span className={issueStatusClass(issue.status)}>{issue.status}</span>
                  </div>
                </div>

                {/* Status change control */}
                <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center gap-3">
                  <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide shrink-0">Update Status:</label>
                  <div className="relative inline-block">
                    <select
                      value={issue.status}
                      onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                      className="form-input text-xs pr-7 py-1.5 appearance-none cursor-pointer"
                      style={{ minWidth: 140 }}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

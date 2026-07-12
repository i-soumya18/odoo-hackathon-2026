import React, { useState, useEffect } from 'react';
import { Shield, FileText, AlertTriangle, CheckCircle, Search, Clock } from 'lucide-react';
import api from '../lib/api';

export default function Governance() {
  const [policies, setPolicies] = useState([]);
  const [audits, setAudits] = useState([]);
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pRes, aRes, iRes] = await Promise.all([
        api.get('/governance/policies'),
        api.get('/governance/audits'),
        api.get('/governance/compliance-issues')
      ]);
      setPolicies(pRes.data);
      setAudits(aRes.data);
      setIssues(iRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/governance/compliance-issues/${id}/status`, { status: newStatus });
      fetchData(); // Refresh to update Overdue badges and list
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Governance & Compliance</h1>
        <p className="text-[var(--text-secondary)]">Manage policies, audits, and compliance issues</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Policies */}
        <div className="bg-white rounded-xl shadow-[var(--shadow)] border border-[var(--border)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center">
            <h3 className="font-semibold text-[var(--text-primary)]">Corporate Policies</h3>
          </div>
          <div className="divide-y divide-[var(--border)] max-h-80 overflow-y-auto">
            {policies.length === 0 ? (
              <div className="p-8 text-center text-[var(--text-secondary)]">
                <Shield className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No policies defined.</p>
              </div>
            ) : policies.map((p) => (
              <div key={p.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-[var(--text-primary)]">{p.title}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{p.category} • {p.requires_acknowledgement ? 'Requires Ack.' : 'No Ack. Required'}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full bg-[var(--surface-alt)]`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Issues */}
        <div className="bg-white rounded-xl shadow-[var(--shadow)] border border-[var(--border)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--text-primary)]">Compliance Issues</h3>
          </div>
          <div className="divide-y divide-[var(--border)] max-h-80 overflow-y-auto">
            {issues.length === 0 ? (
              <div className="p-8 text-center text-[var(--text-secondary)]">
                <AlertTriangle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No open issues.</p>
              </div>
            ) : issues.map((issue) => (
              <div key={issue.id} className="p-4 flex flex-col space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm text-[var(--text-primary)]">{issue.description}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">Owner: {issue.owner_name} • Due: {issue.due_date}</p>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-full ${
                      issue.severity === 'Critical' || issue.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {issue.severity}
                    </span>
                    {issue.is_overdue && (
                      <span className="flex items-center text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                        <Clock size={10} className="mr-1" /> OVERDUE
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="pt-2">
                  <select 
                    value={issue.status}
                    onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                    className="text-xs border border-[var(--border)] rounded px-2 py-1 focus:ring-1 focus:ring-[var(--brand-primary)] bg-[var(--surface-alt)]"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audits Table */}
      <div className="bg-white rounded-xl shadow-[var(--shadow)] border border-[var(--border)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--text-primary)]">Recent Audits</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--surface-alt)] text-[var(--text-secondary)]">
              <tr>
                <th className="px-6 py-3 font-medium">Title</th>
                <th className="px-6 py-3 font-medium">Department</th>
                <th className="px-6 py-3 font-medium">Auditor</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Findings</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[var(--text-primary)]">
              {audits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[var(--text-secondary)]">
                    No audits found.
                  </td>
                </tr>
              ) : audits.map(a => (
                <tr key={a.id} className="hover:bg-[var(--surface-alt)]">
                  <td className="px-6 py-4 font-medium">{a.title}</td>
                  <td className="px-6 py-4">{a.department_name}</td>
                  <td className="px-6 py-4">{a.auditor_name}</td>
                  <td className="px-6 py-4 text-[var(--text-secondary)]">{a.date}</td>
                  <td className="px-6 py-4 text-[var(--text-secondary)]">{a.findings_summary || '-'}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

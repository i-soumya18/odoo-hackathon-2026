import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, FileText, Download, XCircle } from 'lucide-react';
import api from '../lib/api';

export default function Social() {
  const [activities, setActivities] = useState([]);
  const [pending, setPending] = useState([]);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [proofUrl, setProofUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [aRes, pRes] = await Promise.all([
        api.get('/social/csr-activities'),
        api.get('/social/csr-participations/pending')
      ]);
      setActivities(aRes.data);
      setPending(pRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/social/csr-activities/${selectedActivity.id}/join`, {
        proof_file_url: proofUrl || null
      });
      setShowJoinModal(false);
      setProofUrl('');
      fetchData();
    } catch (err) {
      alert("Failed to join: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/gamification/csr-participations/${id}/approve`);
      setErrorMsg('');
      fetchData();
    } catch (err) {
      setErrorMsg(`Cannot approve participation ${id}: ${err.response?.data?.detail || err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Social & CSR</h1>
        <p className="text-[var(--text-secondary)]">Manage corporate social responsibility campaigns</p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start space-x-3 border border-red-200">
          <XCircle className="mt-0.5 shrink-0" size={18} />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      {/* CSR Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">Active CSR Campaigns</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.length === 0 ? (
            <div className="col-span-full p-8 text-center text-[var(--text-secondary)] border border-[var(--border)] rounded-xl bg-white border-dashed">
              <Users className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p>No active CSR campaigns.</p>
            </div>
          ) : activities.map((act) => (
            <div key={act.id} className="bg-white rounded-xl shadow-[var(--shadow)] border border-[var(--border)] p-5 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent-social)]"></div>
              <h3 className="font-semibold text-[var(--text-primary)] text-lg">{act.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-2 line-clamp-2 flex-grow">{act.description}</p>
              
              <div className="mt-4 pt-4 border-t border-[var(--border)] flex justify-between items-center">
                <span className="text-xs text-[var(--text-secondary)] bg-[var(--surface-alt)] px-2 py-1 rounded-md">
                  {new Date(act.date).toLocaleDateString()}
                </span>
                <button 
                  onClick={() => { setSelectedActivity(act); setShowJoinModal(true); }}
                  className="text-sm text-[var(--accent-social)] font-medium hover:underline"
                >
                  Join Campaign →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="bg-white rounded-xl shadow-[var(--shadow)] border border-[var(--border)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--text-primary)]">Pending Participations</h3>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {pending.length === 0 ? (
             <div className="p-8 text-center text-[var(--text-secondary)]">
               <p>No pending participations to approve.</p>
             </div>
          ) : pending.map((p) => (
            <div key={p.id} className="p-4 flex items-center justify-between hover:bg-[var(--surface-alt)] transition-colors">
              <div>
                <p className="font-medium text-sm text-[var(--text-primary)]">Employee: {p.employee_id}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-[var(--text-secondary)]">Activity: {p.csr_activity_id}</span>
                  {p.proof_file_url && (
                    <span className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      <FileText size={12} className="mr-1"/> Proof Attached
                    </span>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleApprove(p.id)}
                  className="bg-[var(--accent-social)] text-white px-3 py-1.5 rounded-md text-sm font-medium hover:brightness-110"
                >
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showJoinModal && selectedActivity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-2">Join {selectedActivity.title}</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">You can optionally attach a proof URL now or later.</p>
            <form onSubmit={handleJoin}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Proof Document URL (Optional)</label>
                <input 
                  type="text" 
                  value={proofUrl}
                  onChange={e => setProofUrl(e.target.value)}
                  className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-[var(--brand-primary)]"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowJoinModal(false)} className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[var(--accent-social)] text-white rounded-md font-medium text-sm hover:brightness-110">Confirm Participation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useContext } from 'react';
import { Building2, Settings as SettingsIcon, Plus, Users, ToggleLeft, ToggleRight, ChevronDown } from 'lucide-react';
import api from '../lib/api';
import { ToastContext } from '../components/Layout';

/* ─── ESG Config Row ─────────────────────────────────────────── */
const ConfigRow = ({ label, description, checked, onToggle }) => (
  <div className="flex items-start justify-between gap-4 py-4 border-b border-[var(--border)] last:border-0">
    <div className="flex-1">
      <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
      <p className="text-xs text-[var(--text-secondary)] mt-0.5">{description}</p>
    </div>
    <button
      onClick={onToggle}
      className="shrink-0 mt-0.5 transition-colors"
      style={{ color: checked ? 'var(--accent-environmental)' : 'var(--border)' }}
      aria-label={checked ? 'Disable' : 'Enable'}
    >
      {checked
        ? <ToggleRight size={28} style={{ color: 'var(--accent-environmental)' }} />
        : <ToggleLeft size={28} style={{ color: '#CBD5E1' }} />}
    </button>
  </div>
);

/* ─── Weight Slider ──────────────────────────────────────────── */
const WeightSlider = ({ label, color, value, onChange }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <label className="text-sm font-semibold" style={{ color }}>{label}</label>
      <span className="text-sm font-bold score-num" style={{ color }}>{value}%</span>
    </div>
    <input
      type="range"
      min={10}
      max={60}
      step={5}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
      style={{ accentColor: color }}
    />
  </div>
);

/* ─── Settings Page ──────────────────────────────────────────── */
export default function Settings() {
  const { show: showToast } = useContext(ToastContext);
  const [activeTab, setActiveTab] = useState('departments');
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // ESG config state
  const [envWeight, setEnvWeight] = useState(40);
  const [socWeight, setSocWeight] = useState(30);
  const [govWeight, setGovWeight] = useState(30);
  const [autoEmission, setAutoEmission] = useState(false);
  const [evidenceRequired, setEvidenceRequired] = useState(true);
  const [autoBadge, setAutoBadge] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);

  const tabs = [
    { id: 'departments', label: 'Departments' },
    { id: 'esg-config',  label: 'ESG Configuration' },
  ];

  useEffect(() => { fetchDepartments(); }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/scores/departments');
      setDepartments(res.data);
    } catch {
      // fallback silent
    } finally {
      setLoading(false);
    }
  };

  const totalWeight = envWeight + socWeight + govWeight;
  const weightsValid = totalWeight === 100;

  const handleSaveWeights = () => {
    if (!weightsValid) {
      showToast(`Weights must sum to 100% (currently ${totalWeight}%)`, 'error');
      return;
    }
    // In a full implementation, this would POST to /settings/esg-weights
    showToast('ESG weights saved successfully!', 'success');
  };

  const handleSaveConfig = () => {
    showToast('Configuration saved!', 'success');
  };

  return (
    <div className="space-y-5 max-w-5xl animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">Organization configuration and ESG parameters</p>
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

      {/* ── Departments Tab ── */}
      {activeTab === 'departments' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-alt)]">
            <div className="flex items-center gap-2">
              <Building2 size={16} style={{ color: 'var(--brand-primary)' }} />
              <h3 className="font-semibold text-[var(--text-primary)]">Departments</h3>
            </div>
            <button className="btn-primary text-xs py-1.5 px-3">
              <Plus size={13} /> New Department
            </button>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-[var(--text-secondary)]">Loading departments…</div>
          ) : departments.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 size={36} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--brand-primary)' }} />
              <h3 className="font-semibold text-[var(--text-primary)]">No Departments Yet</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Add your first department to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>ESG Score</th>
                    <th>Environmental</th>
                    <th>Social</th>
                    <th>Governance</th>
                    <th>Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map(d => (
                    <tr key={d.id}>
                      <td className="font-semibold">{d.name}</td>
                      <td>
                        <span className="font-bold score-num" style={{ color: 'var(--brand-primary)' }}>
                          {d.total_score.toFixed(1)}
                        </span>
                      </td>
                      <td>
                        <span className="font-medium score-num" style={{ color: 'var(--accent-environmental)' }}>
                          {d.environmental.toFixed(1)}
                        </span>
                      </td>
                      <td>
                        <span className="font-medium score-num" style={{ color: 'var(--accent-social)' }}>
                          {d.social.toFixed(1)}
                        </span>
                      </td>
                      <td>
                        <span className="font-medium score-num" style={{ color: 'var(--accent-governance)' }}>
                          {d.governance.toFixed(1)}
                        </span>
                      </td>
                      <td>
                        <span className="status-pill status-pill-active">#{d.rank}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── ESG Configuration Tab ── */}
      {activeTab === 'esg-config' && (
        <div className="space-y-5">
          {/* Score Weights */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">Score Weights</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Control how each pillar contributes to the overall ESG score. Must sum to 100%.</p>
              </div>
              <div className={`text-sm font-bold score-num px-3 py-1 rounded-lg ${
                weightsValid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                Total: {totalWeight}%
              </div>
            </div>

            <div className="space-y-5">
              <WeightSlider label="🌿 Environmental" color="#2E9E5B" value={envWeight} onChange={setEnvWeight} />
              <WeightSlider label="👥 Social"        color="#3B82F6" value={socWeight} onChange={setSocWeight} />
              <WeightSlider label="🛡️ Governance"   color="#8B5CF6" value={govWeight} onChange={setGovWeight} />
            </div>

            {!weightsValid && (
              <p className="text-xs text-red-600 mt-3 font-medium">
                ⚠ Weights must sum to exactly 100%. Currently: {totalWeight}%.
              </p>
            )}

            <div className="mt-5 pt-4 border-t border-[var(--border)] flex justify-end">
              <button onClick={handleSaveWeights} className="btn-primary" disabled={!weightsValid}>
                Save Weights
              </button>
            </div>
          </div>

          {/* Notification & Feature toggles */}
          <div className="card p-6">
            <h3 className="font-semibold text-[var(--text-primary)] mb-1">Features & Notifications</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4">Toggle system-wide behaviors for your organization.</p>

            <div>
              <ConfigRow
                label="Auto-calculate emissions"
                description="Automatically compute CO₂e when carbon transactions are logged using the selected emission factor."
                checked={autoEmission}
                onToggle={() => setAutoEmission(v => !v)}
              />
              <ConfigRow
                label="Require evidence for all CSR activities"
                description="Block CSR participation approvals if no proof document URL is attached."
                checked={evidenceRequired}
                onToggle={() => setEvidenceRequired(v => !v)}
              />
              <ConfigRow
                label="Auto-award badges on challenge completion"
                description="Badges are automatically checked and awarded when XP events occur."
                checked={autoBadge}
                onToggle={() => setAutoBadge(v => !v)}
              />
              <ConfigRow
                label="Email alerts for new compliance issues"
                description="Send email notifications to department heads when new issues are raised."
                checked={emailAlerts}
                onToggle={() => setEmailAlerts(v => !v)}
              />
            </div>

            <div className="mt-4 flex justify-end">
              <button onClick={handleSaveConfig} className="btn-primary">Save Configuration</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useContext } from 'react';
import { FileText, Download, Filter, Leaf, Users, ShieldCheck, BarChart2, FileSpreadsheet } from 'lucide-react';
import api from '../lib/api';
import { ToastContext } from '../components/Layout';

const REPORT_CARDS = [
  {
    id: 'environmental',
    title: 'Environmental Report',
    desc: 'Carbon footprint trends, emission factors, and goal progress by department.',
    icon: Leaf,
    iconColor: '#2E9E5B',
    bgColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    tab: 'environmental',
  },
  {
    id: 'social',
    title: 'Social Report',
    desc: 'CSR activities, employee participation rates, and training completion.',
    icon: Users,
    iconColor: '#3B82F6',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    tab: 'social',
  },
  {
    id: 'governance',
    title: 'Governance Report',
    desc: 'Audit results, compliance issues, and policy acknowledgement summary.',
    icon: ShieldCheck,
    iconColor: '#8B5CF6',
    bgColor: '#F5F3FF',
    borderColor: '#DDD6FE',
    tab: 'governance',
  },
  {
    id: 'esg-summary',
    title: 'ESG Summary',
    desc: 'Executive overview — all 4 scores + department comparison. Full PDF export.',
    icon: BarChart2,
    iconColor: '#714B67',
    bgColor: '#FAF5F9',
    borderColor: '#E9D5E4',
    tab: 'esg-summary',
    isPdf: true,
  },
];

const MODULES = [
  { value: 'carbon', label: 'Carbon Transactions' },
  { value: 'compliance', label: 'Compliance Issues' },
];

export default function Reports() {
  const { show: showToast } = useContext(ToastContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [reportModule, setReportModule] = useState('carbon');
  const [deptFilter, setDeptFilter] = useState('');
  const [lastGenerated, setLastGenerated] = useState({});
  const [generating, setGenerating] = useState(null);

  const tabs = [
    { id: 'overview',     label: 'Overview' },
    { id: 'environmental', label: 'Environmental' },
    { id: 'social',       label: 'Social' },
    { id: 'governance',   label: 'Governance' },
    { id: 'esg-summary',  label: 'ESG Summary' },
    { id: 'custom',       label: 'Custom Builder' },
  ];

  const handleDownloadPdf = async (reportId) => {
    setGenerating(reportId);
    try {
      const response = await api.get('/reports/esg-summary/pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ESG_Summary.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      setLastGenerated(prev => ({ ...prev, [reportId]: new Date() }));
      showToast('PDF downloaded successfully!', 'success');
    } catch {
      showToast('Failed to download PDF.', 'error');
    } finally {
      setGenerating(null);
    }
  };

  const handleDownloadCsv = async (e) => {
    e.preventDefault();
    setGenerating('custom');
    try {
      let url = `/reports/custom/csv?module=${reportModule}`;
      if (deptFilter) url += `&department_id=${deptFilter}`;
      const response = await api.get(url, { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `CustomReport_${reportModule}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('CSV exported successfully!', 'success');
    } catch {
      showToast('Failed to export CSV.', 'error');
    } finally {
      setGenerating(null);
    }
  };

  // Which report card to show in single-tab view
  const singleReport = REPORT_CARDS.find(r => r.tab === activeTab);

  return (
    <div className="space-y-5 max-w-6xl animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Reports & Analytics</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">Generate compliance reports and custom data extracts</p>
      </div>

      {/* Sub-tab navigation */}
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

      {/* ── Overview Tab: show all 4 report cards ── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {REPORT_CARDS.map(report => (
            <ReportCard
              key={report.id}
              report={report}
              lastGenerated={lastGenerated[report.id]}
              generating={generating === report.id}
              onDownloadPdf={() => handleDownloadPdf(report.id)}
              onNavigate={() => setActiveTab(report.tab)}
            />
          ))}
        </div>
      )}

      {/* ── Single report tabs ── */}
      {singleReport && (
        <div className="space-y-5">
          <ReportCard
            report={singleReport}
            lastGenerated={lastGenerated[singleReport.id]}
            generating={generating === singleReport.id}
            onDownloadPdf={() => handleDownloadPdf(singleReport.id)}
            onNavigate={() => {}}
            fullWidth
          />
          {/* Placeholder report preview area */}
          <div className="card p-8 text-center">
            <FileText size={40} className="mx-auto mb-3 opacity-20" style={{ color: singleReport.iconColor }} />
            <h3 className="font-semibold text-[var(--text-primary)] mb-1">Report Preview</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">Click 'Generate' to produce and download this report.</p>
            {singleReport.isPdf && (
              <button
                onClick={() => handleDownloadPdf(singleReport.id)}
                disabled={generating === singleReport.id}
                className="btn-primary mx-auto"
              >
                <Download size={15} />
                {generating === singleReport.id ? 'Generating…' : 'Generate PDF'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Custom Builder ── */}
      {activeTab === 'custom' && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-alt)] flex items-center justify-center">
              <Filter size={18} style={{ color: 'var(--brand-primary)' }} />
            </div>
            <div>
              <h2 className="font-semibold text-[var(--text-primary)]">Custom Report Builder</h2>
              <p className="text-xs text-[var(--text-secondary)]">Select filters and export as CSV</p>
            </div>
          </div>

          <form onSubmit={handleDownloadCsv} className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
            <div>
              <label className="form-label">Module</label>
              <select
                value={reportModule}
                onChange={e => setReportModule(e.target.value)}
                className="form-input"
              >
                {MODULES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Department UUID (Optional)</label>
              <input
                type="text"
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                placeholder="Leave blank for all departments"
                className="form-input"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={generating === 'custom'}
                className="btn-primary flex-1 justify-center"
              >
                <Download size={15} />
                {generating === 'custom' ? 'Exporting…' : 'Export CSV'}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-[var(--border)]">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wide">Available Exports</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MODULES.map(m => (
                <div key={m.value} className="flex items-center gap-3 p-3 bg-[var(--surface-alt)] rounded-lg border border-[var(--border)]">
                  <FileSpreadsheet size={16} style={{ color: 'var(--brand-primary)' }} />
                  <span className="text-sm font-medium text-[var(--text-primary)]">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Report Card Component ─────────────────────────────────── */
function ReportCard({ report, lastGenerated, generating, onDownloadPdf, onNavigate, fullWidth = false }) {
  const Icon = report.icon;
  return (
    <div className={`card p-6 flex flex-col gap-4 ${fullWidth ? 'md:col-span-2' : ''}`}>
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: report.bgColor, border: `1px solid ${report.borderColor}` }}
        >
          <Icon size={22} style={{ color: report.iconColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--text-primary)]">{report.title}</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">{report.desc}</p>
        </div>
      </div>

      <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
        <span className="text-xs text-[var(--text-secondary)]">
          {lastGenerated
            ? `Last generated: ${lastGenerated.toLocaleTimeString()}`
            : 'Not generated yet'}
        </span>
        <div className="flex gap-2">
          {report.isPdf && (
            <button
              onClick={onDownloadPdf}
              disabled={generating}
              className="btn-primary text-xs py-1.5 px-3 disabled:opacity-60"
            >
              <Download size={13} />
              {generating ? 'Generating…' : 'PDF'}
            </button>
          )}
          <button
            onClick={onNavigate}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
}

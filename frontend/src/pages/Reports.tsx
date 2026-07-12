import React, { useState } from 'react';
import { FileText, Download, Filter, FileSpreadsheet } from 'lucide-react';
import api from '../lib/api';

export default function Reports() {
  const [reportModule, setReportModule] = useState('carbon');
  const [deptFilter, setDeptFilter] = useState('');
  
  const REPORTS = [
    { title: "Environmental Status", desc: "Carbon footprint trends and goal progress" },
    { title: "Social Impact", desc: "CSR activities and employee participation" },
    { title: "Governance & Compliance", desc: "Audit results and open compliance issues" },
    { title: "ESG Summary", desc: "Executive overview — all 4 scores + department comparison", isPdf: true }
  ];

  const handleDownloadPdf = async () => {
    try {
      const response = await api.get('/reports/esg-summary/pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ESG_Summary.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Failed to download PDF.");
    }
  };

  const handleDownloadCsv = async (e) => {
    e.preventDefault();
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
    } catch (err) {
      alert("Failed to download CSV.");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Reports & Analytics</h1>
        <p className="text-[var(--text-secondary)]">Generate compliance reports and custom data extracts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {REPORTS.map((report, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-[var(--shadow)] border border-[var(--border)] p-6 flex flex-col">
            <div className="flex items-start space-x-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--surface-alt)] flex items-center justify-center text-[var(--brand-primary)] shrink-0">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--text-primary)] text-lg">{report.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{report.desc}</p>
              </div>
            </div>
            <div className="mt-auto pt-4 border-t border-[var(--border)] flex justify-between items-center">
              <span className="text-xs text-[var(--text-secondary)]">Ready to generate</span>
              <div className="flex space-x-2">
                {report.isPdf ? (
                  <button 
                    onClick={handleDownloadPdf}
                    className="flex items-center space-x-1 bg-[var(--brand-primary)] text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-[var(--brand-primary-hover)] transition-colors"
                  >
                    <Download size={14} />
                    <span>PDF</span>
                  </button>
                ) : (
                  <button 
                    disabled
                    className="flex items-center space-x-1 bg-[var(--surface-alt)] text-[var(--text-secondary)] px-3 py-1.5 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed"
                  >
                    <FileSpreadsheet size={14} />
                    <span>Excel</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-[var(--shadow)] border border-[var(--border)] p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Filter className="text-[var(--text-secondary)]" size={20} />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Custom Report Builder</h2>
        </div>
        
        <form onSubmit={handleDownloadCsv} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Module</label>
            <select 
              value={reportModule}
              onChange={e => setReportModule(e.target.value)}
              className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-[var(--brand-primary)] bg-[var(--surface-alt)]"
            >
              <option value="carbon">Carbon Transactions</option>
              <option value="compliance">Compliance Issues</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Department UUID (Optional)</label>
            <input 
              type="text" 
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              placeholder="e.g. 123e4567-e89b-12d3-a456..."
              className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-[var(--brand-primary)]"
            />
          </div>
          <div className="flex justify-end">
            <button 
              type="submit"
              className="flex items-center space-x-2 bg-[var(--text-primary)] text-white px-4 py-2 rounded-md font-medium hover:bg-black w-full justify-center"
            >
              <Download size={18} />
              <span>Export CSV</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

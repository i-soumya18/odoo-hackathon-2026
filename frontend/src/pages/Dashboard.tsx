import React, { useState, useEffect } from 'react';
import { Target, Users, Shield, TrendingUp, Activity, Award, Briefcase } from 'lucide-react';
import api from '../lib/api';
import { CountUp } from '../components/CountUp';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function Dashboard() {
  const [org, setOrg] = useState(null);
  const [depts, setDepts] = useState([]);
  const [kpis, setKpis] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [scoresRes, kpisRes, deptsRes] = await Promise.all([
        api.get('/scores/organization'),
        api.get('/scores/kpis'),
        api.get('/scores/departments')
      ]);
      setOrg(scoresRes.data);
      setKpis(kpisRes.data);
      setDepts(deptsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!org || !kpis) return <div className="p-8">Loading Dashboard...</div>;

  // Mock historical data for the chart based on current score to simulate a live chart
  const historyData = Array.from({length: 6}).map((_, i) => ({
    name: `Month ${i+1}`,
    score: Math.max(0, org.total_score - (5 - i) * 2 + (Math.random() * 4 - 2))
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Organization Dashboard</h1>
          <p className="text-[var(--text-secondary)]">Live ESG Overview</p>
        </div>
        <div className="bg-[var(--surface-alt)] px-4 py-2 rounded-lg border border-[var(--border)]">
          <span className="text-xs text-[var(--text-secondary)] block">Overall Score</span>
          <span className="text-2xl font-bold text-[var(--brand-primary)]">
            <CountUp value={org.total_score} decimals={1} />
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ScoreCard title="Environmental" score={org.environmental_score} icon={Target} color="var(--accent-environmental)" />
        <ScoreCard title="Social" score={org.social_score} icon={Users} color="var(--accent-social)" />
        <ScoreCard title="Governance" score={org.governance_score} icon={Shield} color="var(--accent-governance)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-[var(--shadow)] border border-[var(--border)] p-6">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">ESG Score Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#a0a0a0" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="#a0a0a0" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="var(--brand-primary)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-[var(--shadow)] border border-[var(--border)] p-6">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Activity size={18} /> Operational KPIs
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-[var(--border)] pb-2">
                <span className="text-sm text-[var(--text-secondary)]">Total Carbon (kg CO2e)</span>
                <span className="font-semibold text-[var(--text-primary)]"><CountUp value={kpis.total_carbon} /></span>
              </div>
              <div className="flex justify-between items-center border-b border-[var(--border)] pb-2">
                <span className="text-sm text-[var(--text-secondary)]">CSR Participation Rate</span>
                <span className="font-semibold text-[var(--text-primary)]"><CountUp value={kpis.csr_participation_rate} decimals={1} suffix="%" /></span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-secondary)]">Open Comp. Issues</span>
                <span className="font-semibold text-red-600"><CountUp value={kpis.open_compliance_issues} /></span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-[var(--shadow)] border border-[var(--border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Briefcase size={18} /> Departments
              </h3>
            </div>
            <div className="divide-y divide-[var(--border)] max-h-48 overflow-y-auto">
              {depts.map(d => (
                <div key={d.id} className="px-6 py-3 flex justify-between items-center hover:bg-[var(--surface-alt)] cursor-pointer">
                  <span className="text-sm font-medium">{d.name}</span>
                  <span className="text-sm font-bold text-[var(--brand-primary)]"><CountUp value={d.total_score} decimals={1} /></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ title, score, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-[var(--shadow)] border border-[var(--border)] flex items-center gap-4 transition-transform hover:scale-[1.02]">
      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-opacity-10" style={{ backgroundColor: `${color}20`, color: color }}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm text-[var(--text-secondary)] font-medium">{title}</p>
        <p className="text-2xl font-bold text-[var(--text-primary)]">
          <CountUp value={score} decimals={1} />
        </p>
      </div>
    </div>
  );
}

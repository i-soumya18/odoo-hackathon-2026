import React, { useState, useEffect } from 'react';
import { Leaf, Users, ShieldCheck, Activity, Zap, AlertTriangle, TrendingUp, ChevronRight, BarChart2 } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import api from '../lib/api';
import { CountUp } from '../components/CountUp';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell
} from 'recharts';

/* ── Donut chart for ESG breakdown ─────────────────────────── */
const ESGDonut = ({ env, soc, gov, overall }) => {
  const data = [
    { name: 'Environmental', value: env,  color: '#2E9E5B' },
    { name: 'Social',        value: soc,  color: '#3B82F6' },
    { name: 'Governance',    value: gov,  color: '#8B5CF6' },
  ];
  return (
    <div className="relative">
      <PieChart width={160} height={160}>
        <Pie
          data={data}
          cx={75} cy={75}
          innerRadius={52}
          outerRadius={72}
          paddingAngle={3}
          dataKey="value"
          startAngle={90}
          endAngle={-270}
        >
          {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
        </Pie>
      </PieChart>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold score-num" style={{ color: '#0EA5E9' }}>
          <CountUp value={overall} decimals={1} />
        </span>
        <span className="text-[10px] text-[var(--text-secondary)] font-medium">Overall</span>
      </div>
    </div>
  );
};

/* ── Score Pillar Card ───────────────────────────────────────── */
const PillarCard = ({ title, score, icon: Icon, color, borderClass, trend }) => (
  <div className={`card card-hover p-5 flex items-center gap-4 ${borderClass}`}>
    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}18` }}>
      <Icon size={22} style={{ color }} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">{title}</p>
      <p className="text-2xl font-bold score-num text-[var(--text-primary)]">
        <CountUp value={score} decimals={1} />
      </p>
    </div>
    <div className="shrink-0 text-right">
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700">
        <TrendingUp size={10} /> {trend}
      </span>
    </div>
  </div>
);

/* ── KPI Stat ───────────────────────────────────────────────── */
const KpiStat = ({ label, value, suffix = '', icon: Icon, iconColor, decimals = 0 }) => (
  <div className="card p-5 flex items-center gap-4">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${iconColor}18` }}>
      <Icon size={20} style={{ color: iconColor }} />
    </div>
    <div>
      <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold score-num text-[var(--text-primary)]">
        <CountUp value={value} decimals={decimals} suffix={suffix} />
      </p>
    </div>
  </div>
);

/* ── Dept ranking row ───────────────────────────────────────── */
const DeptRow = ({ dept, rank, maxScore }) => {
  const pct = maxScore > 0 ? (dept.total_score / maxScore) * 100 : 0;
  return (
    <div className="flex items-center gap-3 py-2.5 px-4 hover:bg-[var(--surface-alt)] transition-colors rounded-lg">
      <span className="w-5 text-xs font-bold text-[var(--text-secondary)] text-center shrink-0">#{rank}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{dept.name}</p>
        <div className="progress-bar mt-1">
          <div className="progress-bar-fill" style={{ width: `${pct}%`, background: 'var(--brand-primary)' }} />
        </div>
      </div>
      <span className="text-sm font-bold score-num shrink-0" style={{ color: 'var(--brand-primary)' }}>
        <CountUp value={dept.total_score} decimals={1} />
      </span>
    </div>
  );
};

/* ── Dashboard Page ─────────────────────────────────────────── */
export default function Dashboard() {
  const [org, setOrg] = useState(null);
  const [depts, setDepts] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [scoresRes, kpisRes, deptsRes, notifsRes] = await Promise.all([
        api.get('/scores/organization'),
        api.get('/scores/kpis'),
        api.get('/scores/departments'),
        api.get('/notifications').catch(() => ({ data: [] })),
      ]);
      setOrg(scoresRes.data);
      setKpis(kpisRes.data);
      setDepts(deptsRes.data);
      setNotifications(notifsRes.data.slice(0, 5));
    } catch (err) {
      console.error(err);
    }
  };

  if (!org || !kpis) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="skeleton h-10 w-64 rounded-xl" />
        <div className="grid grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="skeleton h-64 rounded-xl" />
          <div className="skeleton h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  // Simulated 6-month trend from current score
  const historyData = Array.from({ length: 6 }).map((_, i) => ({
    name: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'][i],
    score: Math.max(40, org.total_score - (5 - i) * 3 + (i % 2 === 0 ? 2 : -1))
  }));

  const maxDeptScore = Math.max(...depts.map(d => d.total_score), 1);

  return (
    <div className="space-y-6 max-w-7xl animate-fade-in-up">
      {/* ── Page title ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">ESG Dashboard</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">Live organization overview · {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <NavLink to="/environmental" className="quick-action-pill">
            <Leaf size={14} style={{ color: 'var(--accent-environmental)' }} />
            Log Carbon
          </NavLink>
          <NavLink to="/gamification" className="quick-action-pill">
            <Zap size={14} style={{ color: 'var(--accent-xp)' }} />
            Challenges
          </NavLink>
          <NavLink to="/reports" className="quick-action-pill">
            <BarChart2 size={14} style={{ color: 'var(--brand-primary)' }} />
            Reports
          </NavLink>
        </div>
      </div>

      {/* ── Hero: Donut + Pillar Cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Donut */}
        <div className="card p-6 flex flex-col items-center justify-center gap-2 lg:col-span-1">
          <ESGDonut
            env={org.environmental_score}
            soc={org.social_score}
            gov={org.governance_score}
            overall={org.total_score}
          />
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide text-center">Overall ESG Score</p>
          <div className="flex gap-3 text-[10px] font-semibold text-[var(--text-secondary)]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#2E9E5B] inline-block" />Env</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3B82F6] inline-block" />Soc</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#8B5CF6] inline-block" />Gov</span>
          </div>
        </div>

        {/* 3 Pillar Cards */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-5">
          <PillarCard title="Environmental" score={org.environmental_score} icon={Leaf} color="#2E9E5B" borderClass="pillar-border-env" trend="+2.3%" />
          <PillarCard title="Social"        score={org.social_score}        icon={Users} color="#3B82F6" borderClass="pillar-border-soc" trend="+1.1%" />
          <PillarCard title="Governance"    score={org.governance_score}    icon={ShieldCheck} color="#8B5CF6" borderClass="pillar-border-gov" trend="−0.5%" />
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <KpiStat label="Total Carbon (kg CO₂e)" value={kpis.total_carbon} icon={Leaf} iconColor="#2E9E5B" decimals={0} />
        <KpiStat label="CSR Participation Rate" value={kpis.csr_participation_rate} suffix="%" icon={Users} iconColor="#3B82F6" decimals={1} />
        <KpiStat label="Open Compliance Issues" value={kpis.open_compliance_issues} icon={AlertTriangle} iconColor="#EF4444" />
      </div>

      {/* ── Charts + Rankings ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Line chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Activity size={16} className="text-[var(--brand-primary)]" /> ESG Score Trend (6 Months)
            </h3>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EFF8" />
                <XAxis dataKey="name" stroke="#a0a0a0" fontSize={11} tickLine={false} />
                <YAxis domain={[40, 100]} stroke="#a0a0a0" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [`${Number(v).toFixed(1)}`, 'Score']}
                />
                <Line type="monotone" dataKey="score" stroke="#714B67" strokeWidth={2.5} dot={{ r: 4, fill: '#714B67', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dept Rankings */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <h3 className="font-semibold text-[var(--text-primary)] text-sm flex items-center gap-2">
              <BarChart2 size={15} style={{ color: 'var(--brand-primary)' }} /> Department Rankings
            </h3>
            <NavLink to="/gamification" className="text-xs text-[var(--brand-primary)] font-medium hover:underline flex items-center gap-0.5">
              Leaderboard <ChevronRight size={12} />
            </NavLink>
          </div>
          <div className="p-2">
            {depts.length === 0 ? (
              <p className="text-sm text-center py-8 text-[var(--text-secondary)]">No department data.</p>
            ) : (
              depts.map((d, i) => <DeptRow key={d.id} dept={d} rank={i + 1} maxScore={maxDeptScore} />)
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Activity Feed ── */}
      {notifications.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--text-primary)] text-sm flex items-center gap-2">
              <Activity size={15} style={{ color: 'var(--brand-primary)' }} /> Recent Activity
            </h3>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {notifications.map(n => (
              <div key={n.id} className="px-5 py-3 flex items-center gap-3 hover:bg-[var(--surface-alt)] transition-colors">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: n.read ? 'var(--border)' : 'var(--accent-overall)' }} />
                <p className="text-sm text-[var(--text-primary)] flex-1">{n.message}</p>
                <span className="text-xs text-[var(--text-secondary)] shrink-0">{new Date(n.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

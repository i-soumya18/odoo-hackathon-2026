import React, { useState, useEffect, useContext } from 'react';
import {
  Trophy, Medal, Star, CheckCircle, Gift, Award, Users, Zap, X, Plus, Filter
} from 'lucide-react';
import api from '../lib/api';
import { CountUp } from '../components/CountUp';
import { ToastContext } from '../components/Layout';

/* ─── Filter Pills ───────────────────────────────────────────── */
const STATUSES = ['All', 'Active', 'Draft', 'Under Review', 'Completed', 'Archived'];
const DIFF_COLOR = { Hard: '#EF4444', Medium: '#F59E0B', Easy: '#2E9E5B' };

/* ─── Challenge Card ─────────────────────────────────────────── */
const ChallengeCard = ({ c, onJoin }) => (
  <div className="card card-hover overflow-hidden flex flex-col">
    {/* Difficulty stripe */}
    <div className="h-1.5" style={{ background: DIFF_COLOR[c.difficulty] || '#E4E3EC' }} />
    <div className="p-5 flex flex-col flex-1 gap-3">
      <div className="flex items-start justify-between gap-2">
        <span
          className="status-pill text-[10px]"
          style={{
            background: c.status === 'Active' ? '#DBEAFE' : c.status === 'Completed' ? '#DCFCE7' : '#F3F4F6',
            color:      c.status === 'Active' ? '#1D4ED8' : c.status === 'Completed' ? '#15803D' : '#6B7280'
          }}
        >
          {c.status}
        </span>
        <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700">
          <Star size={11} className="fill-current" /> {c.xp_value} XP
        </span>
      </div>
      <div>
        <h3 className="font-bold text-[var(--text-primary)] text-base leading-tight">{c.title}</h3>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          {c.difficulty} · Due {new Date(c.deadline).toLocaleDateString()}
        </p>
      </div>
      {c.status === 'Active' && (
        <button
          onClick={() => onJoin(c.id)}
          className="btn-primary mt-auto w-full justify-center text-xs py-2"
        >
          Join Challenge
        </button>
      )}
    </div>
  </div>
);

/* ─── Leaderboard Row ─────────────────────────────────────────── */
const MEDALS = ['🥇', '🥈', '🥉'];
const LeaderRow = ({ entry, index, maxXP }) => {
  const pct = maxXP > 0 ? (entry.xp / maxXP) * 100 : 0;
  const initials = entry.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const isDept = entry.type === 'department';
  return (
    <div className="flex items-center gap-4 px-5 py-3 hover:bg-[var(--surface-alt)] transition-colors">
      <div className="w-8 text-center shrink-0">
        {index < 3
          ? <span className="text-xl leading-none">{MEDALS[index]}</span>
          : <span className="text-sm font-bold text-[var(--text-secondary)]">#{index + 1}</span>}
      </div>
      {isDept ? (
        <div className="w-8 h-8 rounded-lg bg-[var(--surface-alt)] flex items-center justify-center shrink-0 border border-[var(--border)]">
          <Users size={14} style={{ color: 'var(--text-secondary)' }} />
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
          style={{ background: 'linear-gradient(135deg, #714B67, #5C3B54)' }}>
          {initials}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1 gap-2">
          <span className="text-sm font-semibold text-[var(--text-primary)] truncate">{entry.name}</span>
          <span className="text-sm font-bold score-num shrink-0" style={{ color: 'var(--accent-xp)' }}>
            <CountUp value={entry.xp} /> XP
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #EAB308, #F59E0B)' }} />
        </div>
      </div>
      {isDept && (
        <span className="shrink-0 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded border border-gray-200">Dept</span>
      )}
    </div>
  );
};

/* ─── Gamification Page ─────────────────────────────────────── */
export default function Gamification() {
  const { show: showToast } = useContext(ToastContext);
  const [activeTab, setActiveTab] = useState('challenges');
  const [statusFilter, setStatusFilter] = useState('All');
  const [challenges, setChallenges] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [badges, setBadges] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [unlockedBadge, setUnlockedBadge] = useState(false);
  const [approving, setApproving] = useState(null);

  const tabs = [
    { id: 'challenges',    label: 'Challenges' },
    { id: 'participation', label: 'Approve Participations' },
    { id: 'badges',        label: 'Badges' },
    { id: 'rewards',       label: 'Rewards' },
    { id: 'leaderboard',  label: 'Leaderboard' },
  ];

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [cRes, pRes, bRes, rRes, lRes] = await Promise.all([
        api.get('/gamification/challenges'),
        api.get('/gamification/participations'),
        api.get('/gamification/my-badges'),
        api.get('/gamification/rewards'),
        api.get('/gamification/leaderboard'),
      ]);
      setChallenges(cRes.data);
      setParticipations(pRes.data);
      setBadges(bRes.data);
      setRewards(rRes.data);
      setLeaderboard(lRes.data);
    } catch (err) {
      console.error('Failed to fetch gamification data:', err);
    }
  };

  const handleJoin = async (challengeId) => {
    try {
      await api.post(`/gamification/challenges/${challengeId}/join`);
      showToast('Joined challenge! Pending approval.', 'success');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to join challenge', 'error');
    }
  };

  const handleApprove = async (id, type) => {
    setApproving(id);
    try {
      const endpoint = type === 'challenge'
        ? `/gamification/challenge-participations/${id}/approve`
        : `/gamification/csr-participations/${id}/approve`;
      const res = await api.post(endpoint);
      if (res.data.new_badges_awarded > 0) {
        setUnlockedBadge(true);
        setTimeout(() => setUnlockedBadge(false), 3500);
      }
      showToast(`Approved! XP awarded: ${res.data.xp_awarded || res.data.points_awarded || 0}`, 'success');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Approval failed', 'error');
    } finally {
      setApproving(null);
    }
  };

  const handleRedeem = async (id) => {
    try {
      await api.post(`/gamification/rewards/${id}/redeem`);
      showToast('Reward redeemed successfully! 🎉', 'success');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to redeem', 'error');
    }
  };

  const filteredChallenges = statusFilter === 'All'
    ? challenges
    : challenges.filter(c => c.status === statusFilter);

  const maxXP = Math.max(...leaderboard.map(l => l.xp), 1);

  return (
    <div className="space-y-5 max-w-6xl animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Gamification Center</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">Earn XP, unlock badges, and climb the leaderboard</p>
      </div>

      {/* Badge unlock toast */}
      {unlockedBadge && (
        <div className="flex items-center gap-3 px-5 py-4 bg-yellow-50 border border-yellow-200 rounded-xl animate-badge-unlock">
          <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center shrink-0">
            <Award size={22} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-yellow-900">🎉 New Badge Unlocked!</p>
            <p className="text-sm text-yellow-800">Check your Badges tab to see what you earned.</p>
          </div>
        </div>
      )}

      {/* Tab nav */}
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

      {/* ── Challenges Tab ── */}
      {activeTab === 'challenges' && (
        <div className="space-y-4">
          {/* Filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1"><Filter size={12} /> Filter:</span>
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                  statusFilter === s
                    ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]'
                    : 'bg-white text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredChallenges.length === 0 ? (
              <div className="col-span-full py-16 text-center card">
                <Trophy className="mx-auto h-12 w-12 mb-3 opacity-30" style={{ color: 'var(--accent-xp)' }} />
                <h3 className="font-semibold text-lg text-[var(--text-primary)]">No {statusFilter !== 'All' ? statusFilter : ''} Challenges</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Check back later for new challenges.</p>
              </div>
            ) : (
              filteredChallenges.map(c => <ChallengeCard key={c.id} c={c} onJoin={handleJoin} />)
            )}
          </div>
        </div>
      )}

      {/* ── Participation Tab ── */}
      {activeTab === 'participation' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <h3 className="font-semibold text-[var(--text-primary)]">Pending Participations</h3>
            <span className="text-xs font-semibold text-[var(--text-secondary)] bg-[var(--surface-alt)] px-2 py-1 rounded-full">
              {participations.length} pending
            </span>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {participations.length === 0 ? (
              <div className="p-10 text-center">
                <CheckCircle className="mx-auto h-10 w-10 mb-3 text-green-400" />
                <p className="font-semibold text-[var(--text-primary)]">All caught up!</p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">No pending participations to review.</p>
              </div>
            ) : participations.map(p => (
              <div key={p.id} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-[var(--surface-alt)] transition-colors">
                <div>
                  <p className="font-semibold text-[var(--text-primary)] text-sm">{p.employee_name || 'Employee'}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">Challenge: {p.challenge_title || p.challenge_id}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    disabled={approving === p.id}
                    onClick={() => handleApprove(p.id, 'challenge')}
                    className="btn-success disabled:opacity-50"
                  >
                    {approving === p.id ? '…' : 'Approve & Award XP'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Badges Tab ── */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {badges.length === 0 ? (
            <div className="col-span-full p-10 text-center card">
              <Award className="mx-auto h-12 w-12 opacity-20 mb-3" style={{ color: 'var(--accent-xp)' }} />
              <h3 className="font-semibold text-lg text-[var(--text-primary)]">No Badges Yet</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Complete challenges and CSR activities to earn badges!</p>
            </div>
          ) : badges.map(b => (
            <div key={b.id} className="card card-hover p-6 flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-2xl bg-yellow-50 border-2 border-yellow-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Award size={32} style={{ color: 'var(--accent-xp)' }} />
              </div>
              <h4 className="font-bold text-sm text-[var(--text-primary)]">{b.name}</h4>
              <p className="text-[10px] text-[var(--text-secondary)] mt-1 uppercase tracking-wider">
                {b.unlock_rule_type.replace(/_/g, ' ')}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Rewards Tab ── */}
      {activeTab === 'rewards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rewards.length === 0 ? (
            <div className="col-span-full p-10 text-center card">
              <Gift className="mx-auto h-12 w-12 opacity-20 mb-3" />
              <p className="text-[var(--text-secondary)]">No rewards available.</p>
            </div>
          ) : rewards.map(r => (
            <div key={r.id} className="card card-hover overflow-hidden flex flex-col">
              <div className="h-28 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #714B67 0%, #5C3B54 100%)' }}>
                <Gift size={44} className="text-white/40" />
              </div>
              <div className="p-5 flex-1 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-[var(--text-primary)]">{r.name}</h4>
                  <span className="text-sm font-bold px-2 py-0.5 rounded-lg bg-[var(--surface-alt)] text-[var(--brand-primary)] shrink-0">{r.points_required} pts</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">{r.stock} in stock</p>
                <button
                  onClick={() => handleRedeem(r.id)}
                  disabled={r.stock <= 0}
                  className={`mt-auto w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    r.stock > 0
                      ? 'bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)]'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {r.stock > 0 ? 'Redeem Reward' : 'Out of Stock'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Leaderboard Tab ── */}
      {activeTab === 'leaderboard' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2 bg-[var(--surface-alt)]">
            <Trophy size={18} style={{ color: 'var(--accent-xp)' }} />
            <h3 className="font-semibold text-[var(--text-primary)]">Top Performers</h3>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {leaderboard.length === 0 ? (
              <div className="p-10 text-center">
                <Medal className="mx-auto h-8 w-8 mb-2 opacity-30" />
                <p className="text-[var(--text-secondary)]">No leaderboard data yet.</p>
              </div>
            ) : leaderboard.map((entry, index) => (
              <LeaderRow key={`${entry.type}-${entry.id}`} entry={entry} index={index} maxXP={maxXP} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

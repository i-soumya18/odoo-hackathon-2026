import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Star, CheckCircle, Package, Gift, Award, Info, AlertTriangle } from 'lucide-react';
import api from '../lib/api';
import { CountUp } from '../components/CountUp';

export default function Gamification() {
  const [activeTab, setActiveTab] = useState('challenges');
  const [challenges, setChallenges] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [badges, setBadges] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  
  // Animation state
  const [unlockedBadge, setUnlockedBadge] = useState(null);
  const [justCompleted, setJustCompleted] = useState(null);

  const tabs = [
    { id: 'challenges', label: 'Challenges' },
    { id: 'participation', label: 'Approve Participations' },
    { id: 'badges', label: 'My Badges' },
    { id: 'rewards', label: 'Rewards' },
    { id: 'leaderboard', label: 'Leaderboard' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cRes, pRes, bRes, rRes, lRes] = await Promise.all([
        api.get('/gamification/challenges'),
        api.get('/gamification/participations'),
        api.get('/gamification/my-badges'),
        api.get('/gamification/rewards'),
        api.get('/gamification/leaderboard')
      ]);
      setChallenges(cRes.data);
      setParticipations(pRes.data);
      setBadges(bRes.data);
      setRewards(rRes.data);
      setLeaderboard(lRes.data);
    } catch (err) {
      console.error("Failed to fetch gamification data:", err);
    }
  };

  const handleApprove = async (id, type) => {
    try {
      const endpoint = type === 'challenge' 
        ? `/gamification/challenge-participations/${id}/approve`
        : `/gamification/csr-participations/${id}/approve`;
        
      const res = await api.post(endpoint);
      setJustCompleted(id);
      if (res.data.new_badges_awarded > 0) {
        setUnlockedBadge(res.data.new_badges_awarded); // Just tracking count to trigger anim
        setTimeout(() => setUnlockedBadge(null), 3000);
      }
      setTimeout(() => setJustCompleted(null), 1000);
      fetchData(); // Refresh list and leaderboard
    } catch (err) {
      alert("Error approving participation");
    }
  };

  const handleRedeem = async (id) => {
    try {
      await api.post(`/gamification/rewards/${id}/redeem`);
      fetchData();
      alert("Reward redeemed successfully!");
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to redeem");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Gamification Center</h1>
        <p className="text-[var(--text-secondary)]">Engage, earn XP, and unlock rewards</p>
      </div>

      <div className="flex space-x-1 border-b border-[var(--border)] overflow-x-auto pb-px">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 whitespace-nowrap text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id 
                ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]' 
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {unlockedBadge && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl flex items-center justify-between animate-badge-unlock shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-white shadow-inner">
              <Award size={24} />
            </div>
            <div>
              <p className="font-bold">New Badge Unlocked!</p>
              <p className="text-sm opacity-90">You just earned a new achievement.</p>
            </div>
          </div>
        </div>
      )}

      {/* Challenges Tab */}
      {activeTab === 'challenges' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.length === 0 ? (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-[var(--border)] rounded-xl">
              <Trophy className="mx-auto h-12 w-12 text-[var(--text-secondary)] opacity-50 mb-3" />
              <h3 className="font-semibold text-lg text-[var(--text-primary)]">No Challenges Available</h3>
              <p className="text-[var(--text-secondary)]">Check back later for new ways to earn XP.</p>
            </div>
          ) : (
            challenges.map(c => (
              <div key={c.id} className="bg-white rounded-xl shadow-[var(--shadow)] border border-[var(--border)] overflow-hidden flex flex-col transition-transform hover:-translate-y-1 hover:shadow-md duration-300">
                <div className={`h-2 ${c.difficulty === 'Hard' ? 'bg-red-500' : c.difficulty === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2 py-1 bg-[var(--surface-alt)] text-[var(--text-secondary)] text-[10px] uppercase font-bold rounded-full">
                      {c.difficulty}
                    </span>
                    <span className="flex items-center text-yellow-600 font-bold bg-yellow-50 px-2 py-0.5 rounded-full text-xs">
                      <Star size={12} className="mr-1 fill-current" /> {c.xp_value} XP
                    </span>
                  </div>
                  <h3 className="font-bold text-[var(--text-primary)] text-lg mb-1">{c.title}</h3>
                  <p className="text-[var(--text-secondary)] text-sm mb-4 line-clamp-2">Complete this challenge to boost your environmental impact and earn XP.</p>
                  <div className="mt-auto">
                    <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-3">
                      <span>Status: <strong className="text-[var(--text-primary)]">{c.status}</strong></span>
                      <span>Due: {new Date(c.deadline).toLocaleDateString()}</span>
                    </div>
                    {c.status === 'Active' && (
                      <button className="w-full py-2 bg-[var(--brand-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--brand-primary-hover)] transition-colors">
                        Join Challenge
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Participations Tab */}
      {activeTab === 'participation' && (
        <div className="bg-white rounded-xl shadow-[var(--shadow)] border border-[var(--border)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--text-primary)]">Pending Participations</h3>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {participations.length === 0 ? (
              <div className="p-8 text-center text-[var(--text-secondary)]">
                <CheckCircle className="mx-auto h-10 w-10 opacity-50 mb-3 text-green-500" />
                <p className="font-medium">All caught up!</p>
                <p className="text-sm">There are no pending participations to approve.</p>
              </div>
            ) : participations.map(p => (
              <div key={p.id} className={`p-5 flex justify-between items-center transition-colors ${justCompleted === p.id ? 'bg-green-50' : 'hover:bg-[var(--surface-alt)]'}`}>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{p.employee_name}</p>
                  <p className="text-sm text-[var(--text-secondary)]">Challenge: {p.challenge_title}</p>
                </div>
                <button 
                  onClick={() => handleApprove(p.id, 'challenge')}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                >
                  Approve & Award XP
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="bg-white rounded-xl shadow-[var(--shadow)] border border-[var(--border)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-alt)] flex justify-between items-center">
            <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Trophy size={18} className="text-yellow-500" /> Top Performers
            </h3>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {leaderboard.length === 0 ? (
              <div className="p-8 text-center text-[var(--text-secondary)]">
                <Medal className="mx-auto h-8 w-8 opacity-50 mb-2" />
                <p>No leaderboard data yet.</p>
              </div>
            ) : leaderboard.map((entry, index) => {
              const maxXP = Math.max(...leaderboard.map(l => l.xp), 1);
              const percentage = (entry.xp / maxXP) * 100;
              
              let medalColor = "text-gray-400";
              if (index === 0) medalColor = "text-yellow-400";
              if (index === 1) medalColor = "text-gray-300";
              if (index === 2) medalColor = "text-amber-600";
              
              return (
                <div key={entry.id + entry.type} className="p-4 hover:bg-[var(--surface-alt)] transition-colors flex items-center gap-4">
                  <div className="w-8 font-bold text-center">
                    {index < 3 ? <Medal size={24} className={`mx-auto ${medalColor} drop-shadow-sm`} /> : <span className="text-[var(--text-secondary)]">#{index + 1}</span>}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-end mb-1">
                      <span className="font-medium text-[var(--text-primary)]">
                        {entry.name} {entry.type === 'department' && <span className="text-[10px] ml-2 px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded-sm uppercase">Dept</span>}
                      </span>
                      <span className="font-bold text-yellow-600 animate-pulse-score inline-block">
                        <CountUp value={entry.xp} /> XP
                      </span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Badges Tab */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {badges.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-white border border-[var(--border)] rounded-xl">
              <Award className="mx-auto h-12 w-12 opacity-30 text-[var(--text-secondary)] mb-3" />
              <h3 className="font-semibold text-lg">No Badges Yet</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Complete challenges and CSR activities to earn badges!</p>
            </div>
          ) : badges.map(b => (
            <div key={b.id} className="bg-white p-6 rounded-xl border border-[var(--border)] shadow-sm flex flex-col items-center text-center group hover:border-[var(--brand-primary)] transition-colors">
              <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 mb-3 group-hover:scale-110 transition-transform">
                <Award size={32} />
              </div>
              <h4 className="font-bold text-sm text-[var(--text-primary)] mb-1">{b.name}</h4>
              <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">{b.unlock_rule_type.replace('_', ' ')}</p>
            </div>
          ))}
        </div>
      )}

      {/* Rewards Tab */}
      {activeTab === 'rewards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.length === 0 ? (
            <div className="col-span-full p-8 text-center border-2 border-dashed border-[var(--border)] rounded-xl">
              <Gift className="mx-auto h-12 w-12 opacity-30 mb-2" />
              <p>No rewards available currently.</p>
            </div>
          ) : rewards.map(r => (
            <div key={r.id} className="bg-white rounded-xl shadow-sm border border-[var(--border)] overflow-hidden flex flex-col">
              <div className="h-32 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-hover)] flex items-center justify-center text-white/50">
                <Gift size={48} />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-lg text-[var(--text-primary)]">{r.name}</h4>
                  <span className="font-bold text-[var(--brand-primary)] bg-[var(--surface-alt)] px-2 py-1 rounded-md text-sm whitespace-nowrap">
                    {r.points_required} pts
                  </span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-4">Stock available: {r.stock}</p>
                <div className="mt-auto">
                  <button 
                    onClick={() => handleRedeem(r.id)}
                    disabled={r.stock <= 0}
                    className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      r.stock > 0 
                        ? 'bg-[var(--text-primary)] text-white hover:bg-black shadow-sm' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {r.stock > 0 ? 'Redeem Reward' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

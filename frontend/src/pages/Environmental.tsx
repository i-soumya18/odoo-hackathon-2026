import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, AlertTriangle, XCircle, ChevronRight, Activity } from 'lucide-react';
import api from '../lib/api';

export default function Environmental() {
  const [goals, setGoals] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [factors, setFactors] = useState([]);
  const [showLogForm, setShowLogForm] = useState(false);
  const [formData, setFormData] = useState({
    department_id: '',
    emission_factor_id: '',
    quantity: '',
    transaction_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [gRes, tRes, fRes] = await Promise.all([
        api.get('/environmental/goals'),
        api.get('/environmental/carbon-transactions'),
        api.get('/environmental/emission-factors')
      ]);
      setGoals(gRes.data);
      setTransactions(tRes.data);
      setFactors(fRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogData = async (e) => {
    e.preventDefault();
    try {
      // Get the current user's department to default to if we don't have a multi-tenant picker in this UI
      // In a real app, this would be a select. Here we just take the first department's ID for hackathon demo
      // if it wasn't selected (or the user profile would have it).
      // Hardcoding for demo if blank to the first available or we should make it a required field.
      
      const payload = {
        ...formData,
        quantity: parseFloat(formData.quantity)
      };
      
      await api.post('/environmental/carbon-transactions', payload);
      setShowLogForm(false);
      fetchData(); // Refresh lists
    } catch (err) {
      alert("Failed to log data: " + JSON.stringify(err.response?.data || err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Environmental</h1>
          <p className="text-[var(--text-secondary)]">Track carbon footprint and sustainability goals</p>
        </div>
        <button 
          onClick={() => setShowLogForm(true)}
          className="bg-[var(--brand-primary)] text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-[var(--brand-primary-hover)] transition-colors"
        >
          <Plus size={20} />
          <span>Log Carbon Data</span>
        </button>
      </div>

      {showLogForm && (
        <div className="bg-white p-6 rounded-xl border border-[var(--border)] shadow-[var(--shadow)] mb-6">
          <h2 className="text-lg font-semibold mb-4">Log Operational Activity</h2>
          <form onSubmit={handleLogData} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Department ID</label>
              <input 
                required
                type="text" 
                value={formData.department_id}
                onChange={e => setFormData({...formData, department_id: e.target.value})}
                className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-[var(--brand-primary)]"
                placeholder="Enter Department UUID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Emission Factor</label>
              <select 
                required
                value={formData.emission_factor_id}
                onChange={e => setFormData({...formData, emission_factor_id: e.target.value})}
                className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-[var(--brand-primary)]"
              >
                <option value="">Select Activity</option>
                {factors.map(f => (
                  <option key={f.id} value={f.id}>{f.activity_type} ({f.co2e_per_unit} CO₂e/{f.unit})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Quantity</label>
              <input 
                required
                type="number"
                step="0.01" 
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: e.target.value})}
                className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-[var(--brand-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Date</label>
              <input 
                required
                type="date" 
                value={formData.transaction_date}
                onChange={e => setFormData({...formData, transaction_date: e.target.value})}
                className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-[var(--brand-primary)]"
              />
            </div>
            <div className="md:col-span-2 flex justify-end space-x-3 mt-4">
              <button type="button" onClick={() => setShowLogForm(false)} className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-[var(--accent-environmental)] text-white rounded-md font-medium shadow-sm hover:brightness-110">Save Record</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goals Table */}
        <div className="bg-white rounded-xl border border-[var(--border)] shadow-[var(--shadow)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--text-primary)]">Environmental Goals</h3>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {goals.length === 0 ? (
              <div className="p-8 text-center text-[var(--text-secondary)]">
                <Activity className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No active goals.</p>
              </div>
            ) : goals.map((goal, i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-[var(--text-primary)]">{goal.title}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{goal.current_value} / {goal.target_value} {goal.target_metric}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    goal.status === 'Achieved' ? 'bg-green-100 text-green-700' :
                    goal.status === 'At Risk' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {goal.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl border border-[var(--border)] shadow-[var(--shadow)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--text-primary)]">Recent Carbon Data</h3>
          </div>
          <div className="divide-y divide-[var(--border)] max-h-96 overflow-y-auto">
            {transactions.length === 0 ? (
               <div className="p-8 text-center text-[var(--text-secondary)]">
                 <p>No transactions logged yet.</p>
               </div>
            ) : transactions.map((tx, i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-[var(--text-primary)]">{tx.activity_source} Activity</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{new Date(tx.transaction_date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm text-[var(--accent-environmental)]">+{tx.co2e_calculated.toFixed(2)} CO₂e</p>
                  <p className="text-xs text-[var(--text-secondary)]">Qty: {tx.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

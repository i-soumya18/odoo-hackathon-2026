import React, { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

// ── Types ────────────────────────────────────────────────────────────────────

interface EmissionFactor {
  id: number;
  activity_type: string;
  unit: string;
  co2e_per_unit: number;
}

interface Department {
  id: number;
  name: string;
}

interface CarbonTransaction {
  id: number;
  transaction_date: string;
  activity_source?: string;
  emission_factor?: EmissionFactor;
  quantity: number;
  co2e_calculated: number;
  department?: Department;
}

interface EnvironmentalGoal {
  id: number;
  name: string;
  department?: Department;
  target_value: number;
  target_metric: string;
  current_value: number;
  deadline: string;
  status: string;
}

type SubTab = 'emission-factors' | 'carbon-transactions' | 'goals';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getProgressPct(current: number, target: number): number {
  if (!target || target === 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

function progressColor(pct: number): string {
  if (pct >= 70) return 'var(--accent-environmental)';
  if (pct >= 40) return '#F59E0B';
  return '#EF4444';
}

function goalStatusClass(status: string): string {
  const s = status?.toLowerCase() ?? '';
  if (s === 'achieved') return 'status-pill status-pill-completed';
  if (s === 'at risk') return 'status-pill status-pill-in-review';
  return 'status-pill status-pill-active';
}

// ── Empty State ───────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ icon: string; headline: string; sub: string }> = ({
  icon,
  headline,
  sub,
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      padding: '64px 24px',
      color: 'var(--text-secondary)',
    }}
  >
    <span style={{ fontSize: '48px', lineHeight: 1 }}>{icon}</span>
    <p style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)', margin: 0 }}>
      {headline}
    </p>
    <p style={{ fontSize: '14px', margin: 0, textAlign: 'center', maxWidth: '320px' }}>{sub}</p>
  </div>
);

// ── Emission Factors Tab ─────────────────────────────────────────────────────

const EmissionFactorsTab: React.FC = () => {
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .get('/environmental/emission-factors')
      .then((res) => setFactors(res.data))
      .catch(() => setError('Failed to load emission factors.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <span style={{ fontSize: '20px' }}>🌿</span>
        <div>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Emission Factors
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
            CO₂ equivalent per activity unit used to calculate carbon footprint
          </p>
        </div>
      </div>

      {error && (
        <div
          style={{
            margin: '16px 24px',
            padding: '12px 16px',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '8px',
            color: '#DC2626',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading emission factors…
        </div>
      ) : factors.length === 0 && !error ? (
        <EmptyState
          icon="🌱"
          headline="No emission factors yet"
          sub="Emission factors will appear here once configured by an administrator."
        />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Activity Type</th>
                <th>Unit</th>
                <th style={{ textAlign: 'right' }}>CO₂e per Unit (kg)</th>
              </tr>
            </thead>
            <tbody>
              {factors.map((f) => (
                <tr key={f.id}>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 500,
                      }}
                    >
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: 'var(--accent-environmental)',
                          flexShrink: 0,
                        }}
                      />
                      {f.activity_type}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{f.unit}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        fontWeight: 600,
                        color: 'var(--accent-environmental)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {f.co2e_per_unit.toFixed(4)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Log Form ─────────────────────────────────────────────────────────────────

interface LogFormProps {
  departments: Department[];
  emissionFactors: EmissionFactor[];
  onSuccess: () => void;
  onClose: () => void;
}

const LogCarbonForm: React.FC<LogFormProps> = ({
  departments,
  emissionFactors,
  onSuccess,
  onClose,
}) => {
  const [departmentId, setDepartmentId] = useState('');
  const [emissionFactorId, setEmissionFactorId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const selectedFactor = emissionFactors.find(
    (f) => f.id === Number(emissionFactorId)
  );
  const estimatedCo2e =
    selectedFactor && quantity
      ? (Number(quantity) * selectedFactor.co2e_per_unit).toFixed(2)
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!departmentId || !emissionFactorId || !quantity || !transactionDate) {
      setFormError('All fields are required.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/environmental/carbon-transactions', {
        department_id: Number(departmentId),
        emission_factor_id: Number(emissionFactorId),
        quantity: Number(quantity),
        transaction_date: transactionDate,
      });
      onSuccess();
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ?? 'Failed to log carbon data. Please try again.';
      setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
        animation: 'slideDown 0.25s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h3
          style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}
        >
          Log Carbon Activity
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '20px',
            color: 'var(--text-secondary)',
            padding: '4px',
            lineHeight: 1,
          }}
          aria-label="Close form"
        >
          ×
        </button>
      </div>

      {formError && (
        <div
          style={{
            padding: '12px 16px',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '8px',
            color: '#DC2626',
            fontSize: '14px',
            marginBottom: '16px',
          }}
        >
          ⚠ {formError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
          }}
        >
          <div>
            <label className="form-label" htmlFor="ct-department">
              Department
            </label>
            <select
              id="ct-department"
              className="form-input"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              required
            >
              <option value="">Select department…</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" htmlFor="ct-factor">
              Emission Factor
            </label>
            <select
              id="ct-factor"
              className="form-input"
              value={emissionFactorId}
              onChange={(e) => setEmissionFactorId(e.target.value)}
              required
            >
              <option value="">Select activity…</option>
              {emissionFactors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.activity_type} ({f.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" htmlFor="ct-quantity">
              Quantity
            </label>
            <input
              id="ct-quantity"
              type="number"
              min="0.001"
              step="any"
              className="form-input"
              placeholder="e.g. 250"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="form-label" htmlFor="ct-date">
              Transaction Date
            </label>
            <input
              id="ct-date"
              type="date"
              className="form-input"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              required
            />
          </div>
        </div>

        {estimatedCo2e && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: 'rgba(46, 158, 91, 0.08)',
              border: '1px solid rgba(46, 158, 91, 0.25)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '18px' }}>🌍</span>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Estimated CO₂e:&nbsp;
              <strong style={{ color: 'var(--accent-environmental)' }}>
                {estimatedCo2e} kg
              </strong>
            </span>
          </div>
        )}

        <div
          style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 18px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '9px 22px',
              background: 'var(--accent-environmental)',
              border: 'none',
              borderRadius: '8px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              color: '#fff',
              fontWeight: 600,
              opacity: submitting ? 0.7 : 1,
              transition: 'opacity 0.15s ease',
            }}
          >
            {submitting ? 'Logging…' : 'Log Carbon Data'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ── ERP Simulator Form ──────────────────────────────────────────────────────

const ERPSimulatorForm: React.FC<{
  departments: Department[];
  onSuccess: () => void;
  onClose: () => void;
}> = ({ departments, onSuccess, onClose }) => {
  const [departmentId, setDepartmentId] = useState('');
  const [activityType, setActivityType] = useState('Purchase');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!departmentId || !activityType || !amount || !description) {
      setFormError('All fields are required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/erp/simulate-transaction', {
        department_id: departmentId,
        activity_type: activityType,
        amount: Number(amount),
        description: description,
      });
      alert(res.data.message);
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? 'Failed to simulate ERP transaction.';
      setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--accent-overall)', borderRadius: '12px', padding: '24px', marginBottom: '20px', animation: 'slideDown 0.25s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--accent-overall)' }}>Simulate ERP Transaction</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--text-secondary)' }}>×</button>
      </div>
      {formError && <div style={{ padding: '12px', background: '#FEF2F2', color: '#DC2626', marginBottom: '16px', borderRadius: '8px' }}>{formError}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label className="form-label">Department</label>
            <select className="form-input" value={departmentId} onChange={e => setDepartmentId(e.target.value)} required>
              <option value="">Select department…</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Activity Type</label>
            <select className="form-input" value={activityType} onChange={e => setActivityType(e.target.value)} required>
              <option value="Purchase">Purchase</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Expense">Expense</option>
              <option value="Fleet">Fleet</option>
            </select>
          </div>
          <div>
            <label className="form-label">Amount</label>
            <input type="number" step="any" min="1" className="form-input" value={amount} onChange={e => setAmount(e.target.value)} required />
          </div>
          <div>
            <label className="form-label">Description</label>
            <input type="text" className="form-input" value={description} onChange={e => setDescription(e.target.value)} required />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{ padding: '9px 18px', border: '1px solid var(--border)', background: 'transparent', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
          <button type="submit" disabled={submitting} style={{ padding: '9px 22px', background: 'var(--accent-overall)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>{submitting ? 'Simulating...' : 'Simulate ERP'}</button>
        </div>
      </form>
    </div>
  );
};

// ── Carbon Transactions Tab ───────────────────────────────────────────────────

const CarbonTransactionsTab: React.FC = () => {
  const [transactions, setTransactions] = useState<CarbonTransaction[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [emissionFactors, setEmissionFactors] = useState<EmissionFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showErpForm, setShowErpForm] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [txRes, deptRes, efRes] = await Promise.all([
        api.get('/environmental/carbon-transactions'),
        api.get('/scores/departments'),
        api.get('/environmental/emission-factors'),
      ]);
      setTransactions(txRes.data);
      setDepartments(deptRes.data);
      setEmissionFactors(efRes.data);
    } catch {
      setError('Failed to load carbon transactions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSuccess = () => {
    setShowForm(false);
    setShowErpForm(false);
    fetchAll();
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <div>
          <h2
            style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}
          >
            Carbon Transactions
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
            Logged operational activities and their CO₂ equivalents
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => { setShowErpForm((v) => !v); setShowForm(false); }}
            style={{
              padding: '9px 18px',
              background: 'var(--accent-overall)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#fff',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(99,102,241,0.3)'
            }}
          >
            Simulate ERP
          </button>
          <button
            onClick={() => { setShowForm((v) => !v); setShowErpForm(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              background: 'var(--accent-environmental)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#fff',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(46,158,91,0.3)',
            }}
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span>
            Log Carbon Data
          </button>
        </div>
      </div>

      {showErpForm && (
        <ERPSimulatorForm
          departments={departments}
          onSuccess={handleSuccess}
          onClose={() => setShowErpForm(false)}
        />
      )}

      {showForm && (
        <LogCarbonForm
          departments={departments}
          emissionFactors={emissionFactors}
          onSuccess={handleSuccess}
          onClose={() => setShowForm(false)}
        />
      )}

      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '8px',
            color: '#DC2626',
            fontSize: '14px',
            marginBottom: '16px',
          }}
        >
          ⚠ {error}
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading transactions…
          </div>
        ) : transactions.length === 0 && !error ? (
          <EmptyState
            icon="📋"
            headline="No carbon transactions yet"
            sub="Click 'Log Carbon Data' to record your first operational activity."
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Activity Source</th>
                  <th>Department</th>
                  <th style={{ textAlign: 'right' }}>Quantity</th>
                  <th style={{ textAlign: 'right' }}>CO₂e (kg)</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {formatDate(tx.transaction_date)}
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      {tx.activity_source ?? tx.emission_factor?.activity_type ?? '—'}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {tx.department?.name ?? '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {tx.quantity.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: 'var(--accent-environmental)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        +{tx.co2e_calculated.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Environmental Goals Tab ──────────────────────────────────────────────────

const GoalsTab: React.FC = () => {
  const [goals, setGoals] = useState<EnvironmentalGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .get('/environmental/goals')
      .then((res) => setGoals(res.data))
      .catch(() => setError('Failed to load environmental goals.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <h2
          style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}
        >
          Environmental Goals
        </h2>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
          Track sustainability targets and departmental progress
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '8px',
            color: '#DC2626',
            fontSize: '14px',
            marginBottom: '16px',
          }}
        >
          ⚠ {error}
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading goals…
          </div>
        ) : goals.length === 0 && !error ? (
          <EmptyState
            icon="🎯"
            headline="No environmental goals set"
            sub="Environmental goals will appear here once configured by an administrator."
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Department</th>
                  <th style={{ textAlign: 'right' }}>Target</th>
                  <th style={{ textAlign: 'right' }}>Current</th>
                  <th style={{ minWidth: '160px' }}>Progress</th>
                  <th>Deadline</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {goals.map((g) => {
                  const pct = getProgressPct(g.current_value, g.target_value);
                  const color = progressColor(pct);
                  return (
                    <tr key={g.id}>
                      <td style={{ fontWeight: 500, maxWidth: '200px' }}>
                        <span
                          style={{
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={g.name}
                        >
                          {g.name}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {g.department?.name ?? '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {g.target_value.toLocaleString()}{' '}
                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                          {g.target_metric}
                        </span>
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontVariantNumeric: 'tabular-nums',
                          fontWeight: 600,
                          color,
                        }}
                      >
                        {g.current_value.toLocaleString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            className="progress-bar"
                            style={{ flex: 1, height: '8px' }}
                            title={`${pct}%`}
                          >
                            <div
                              className="progress-bar-fill"
                              style={{
                                width: `${pct}%`,
                                background: color,
                                height: '100%',
                                borderRadius: 'inherit',
                                transition: 'width 0.5s ease',
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color,
                              minWidth: '32px',
                              textAlign: 'right',
                            }}
                          >
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {formatDate(g.deadline)}
                      </td>
                      <td>
                        <span className={goalStatusClass(g.status)}>{g.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Page Header ───────────────────────────────────────────────────────────────

const PageHeader: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '24px',
    }}
  >
    <div
      style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: 'rgba(46, 158, 91, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        flexShrink: 0,
      }}
    >
      🌍
    </div>
    <div>
      <h1
        style={{
          margin: 0,
          fontSize: '22px',
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}
      >
        Environmental
      </h1>
      <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
        Carbon tracking, emission factors & sustainability goals
      </p>
    </div>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────

const Environmental: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SubTab>('emission-factors');

  return (
    <div>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <PageHeader />

      <div className="subtab-bar" style={{ marginBottom: '24px' }}>
        <button
          className={`subtab-btn${activeTab === 'emission-factors' ? ' active' : ''}`}
          onClick={() => setActiveTab('emission-factors')}
          id="env-tab-emission-factors"
        >
          🌿 Emission Factors
        </button>
        <button
          className={`subtab-btn${activeTab === 'carbon-transactions' ? ' active' : ''}`}
          onClick={() => setActiveTab('carbon-transactions')}
          id="env-tab-carbon-transactions"
        >
          📊 Carbon Transactions
        </button>
        <button
          className={`subtab-btn${activeTab === 'goals' ? ' active' : ''}`}
          onClick={() => setActiveTab('goals')}
          id="env-tab-goals"
        >
          🎯 Environmental Goals
        </button>
      </div>

      {activeTab === 'emission-factors' && <EmissionFactorsTab />}
      {activeTab === 'carbon-transactions' && <CarbonTransactionsTab />}
      {activeTab === 'goals' && <GoalsTab />}
    </div>
  );
};

export default Environmental;

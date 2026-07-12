import React, { useState } from 'react';

const Governance = () => {
  const [activeTab, setActiveTab] = useState('policies');
  
  const tabs = [
    { id: 'policies', label: 'Policies' },
    { id: 'acknowledgements', label: 'Policy Acknowledgements' },
    { id: 'audits', label: 'Audits' },
    { id: 'compliance', label: 'Compliance Issues' }
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold mb-6 text-text-primary">Governance</h1>
      <div className="flex border-b border-border mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 ${activeTab === tab.id ? 'border-b-2 border-brand-primary text-brand-primary font-medium' : 'text-text-secondary'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-4 bg-surface rounded-lg shadow-sm border border-border">
        <p className="text-text-secondary">Content for {tabs.find(t => t.id === activeTab)?.label}</p>
      </div>
    </div>
  );
};

export default Governance;

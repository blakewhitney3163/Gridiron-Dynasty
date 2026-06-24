import React, { useState } from 'react';
import { T } from './theme';
import Franchise from './Franchise';
import DepthChart from './DepthChart';
import InjuriesTab from './franchise/InjuriesTab';

type View = 'franchise' | 'depth' | 'injuries';

export default function MyTeam() {
  const [view, setView] = useState<View>('franchise');
  const [mounted, setMounted] = useState<Set<View>>(new Set(['franchise']));

  const handleView = (v: View) => {
    setView(v);
    setMounted(prev => new Set([...prev, v]));
  };

  const style = (v: View): React.CSSProperties =>
    view === v
      ? { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }
      : { display: 'none' };

  const tabs: { id: View; label: string }[] = [
    { id: 'franchise', label: 'TEAM MANAGEMENT' },
    { id: 'depth',     label: 'DEPTH CHART' },
    { id: 'injuries',  label: '🏥 INJURIES' },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', borderBottom: `1px solid ${T.borderFaint}`, background: T.bgCard }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => handleView(tab.id)} style={{
            padding: '10px 22px', background: 'none', border: 'none',
            borderBottom: view === tab.id ? '2px solid #FF8740' : '2px solid transparent',
            color: view === tab.id ? '#FF8740' : T.textMuted,
            fontWeight: view === tab.id ? 'bold' : 'normal',
            fontSize: 11, letterSpacing: 1.5, cursor: 'pointer', fontFamily: 'monospace',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={style('franchise')}>{mounted.has('franchise') && <Franchise />}</div>
      <div style={style('depth')}>{mounted.has('depth') && <DepthChart />}</div>
      <div style={style('injuries')}>{mounted.has('injuries') && <InjuriesTab />}</div>
    </div>
  );
}

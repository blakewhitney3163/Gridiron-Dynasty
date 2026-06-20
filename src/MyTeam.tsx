import React, { useState } from 'react';
import { T } from './theme';
import Franchise from './Franchise';
import DepthChart from './DepthChart';

type View = 'franchise' | 'depth';

export default function MyTeam() {
  const [view, setView] = useState<View>('franchise');
  const [mounted, setMounted] = useState<Set<View>>(new Set(['franchise']));

  const handleView = (v: View) => {
    setView(v);
    setMounted(prev => new Set([...prev, v]));
  };

  const style = (v: View): React.CSSProperties =>
    view === v ? { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' } : { display: 'none' };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'flex', borderBottom: `1px solid ${T.borderMid}`,
        background: T.bgDark, padding: '0 20px', flexShrink: 0,
      }}>
        {([
          { id: 'franchise' as View, label: 'TEAM MANAGEMENT' },
          { id: 'depth' as View, label: 'DEPTH CHART' },
        ]).map(tab => (
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
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {mounted.has('franchise') && <div style={style('franchise')}><Franchise /></div>}
        {mounted.has('depth') && <div style={style('depth')}><DepthChart /></div>}
      </div>
    </div>
  );
}

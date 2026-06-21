import React, { useState } from 'react';
import { T } from './theme';
import Standings from './Standings';
import Schedule from './Schedule';
import Stats from './Stats';
import Records from './Records';
import Playoffs from './Playoffs';
import Teams from './Teams';

type View = 'standings' | 'schedule' | 'stats' | 'records' | 'playoffs' | 'teams';

const SUB_TABS: { id: View; label: string }[] = [
  { id: 'standings', label: 'STANDINGS' },
  { id: 'schedule', label: 'SCHEDULE' },
  { id: 'stats', label: 'STATS' },
  { id: 'records', label: 'RECORDS' },
  { id: 'playoffs', label: 'PLAYOFFS' },
  { id: 'teams', label: 'TEAMS' },
];

export default function League() {
  const [view, setView] = useState<View>('standings');
  const [mounted, setMounted] = useState<Set<View>>(new Set(['standings']));

  const handleView = (v: View) => {
    setView(v);
    setMounted(prev => new Set([...prev, v]));
  };

  const style = (v: View): React.CSSProperties =>
    view === v ? { flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' } : { display: 'none' }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'flex', borderBottom: `1px solid ${T.borderMid}`,
        background: T.bgDark, padding: '0 20px', flexShrink: 0,
      }}>
        {SUB_TABS.map(tab => (
          <button key={tab.id} onClick={() => handleView(tab.id)} style={{
            padding: '10px 18px', background: 'none', border: 'none',
            borderBottom: view === tab.id ? '2px solid #4FC3F7' : '2px solid transparent',
            color: view === tab.id ? '#4FC3F7' : T.textMuted,
            fontWeight: view === tab.id ? 'bold' : 'normal',
            fontSize: 11, letterSpacing: 1.5, cursor: 'pointer', fontFamily: 'monospace',
          }}>
            {tab.label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {mounted.has('standings') && <div style={style('standings')}><Standings /></div>}
        {mounted.has('schedule') && <div style={style('schedule')}><Schedule /></div>}
        {mounted.has('stats') && <div style={style('stats')}><Stats /></div>}
        {mounted.has('records') && <div style={style('records')}><Records /></div>}
        {mounted.has('playoffs') && <div style={style('playoffs')}><Playoffs /></div>}
        {mounted.has('teams') && <div style={style('teams')}><Teams /></div>}
      </div>
    </div>
  );
}

import React from 'react';
import { T } from './theme';

declare const window: any;

interface Template {
  id: 'rebuild' | 'contender' | 'dynasty';
  label: string;
  tagline: string;
  ovrRange: string;
  capSpace: string;
  patience: string;
  color: string;
  description: string;
}

const TEMPLATES: Template[] = [
  {
    id: 'rebuild',
    label: 'Rebuild',
    tagline: 'Start from scratch',
    ovrRange: '62–70 OVR',
    capSpace: '$30M+ cap space',
    patience: '5-year horizon',
    color: '#4FC3F7',
    description: 'A young, developing roster with cap room to grow. Draft well, develop players, and build a dynasty from the ground up.',
  },
  {
    id: 'contender',
    label: 'Contender',
    tagline: 'Win-now window',
    ovrRange: '78–84 OVR',
    capSpace: '$15M cap space',
    patience: '2-year window',
    color: '#FF8740',
    description: 'A talented, proven roster with playoff expectations. Make smart moves to push over the top before the window closes.',
  },
  {
    id: 'dynasty',
    label: 'Dynasty',
    tagline: 'Championship expectations',
    ovrRange: '85–90 OVR core',
    capSpace: '$8M cap space',
    patience: 'Win now',
    color: '#FFD700',
    description: 'A stacked roster built to win a Gridiron Cup. The owner expects championships. Any regression will be felt immediately.',
  },
];

interface Props {
  onSelect: (templateId: string) => void;
}

export default function TemplateSelect({ onSelect }: Props) {
  const handleSelect = async (id: string) => {
    await window.api.setSetting?.('dynasty_template', id).catch(() => {});
    onSelect(id);
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#050508',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 40,
    }}>
      <div style={{ fontSize: 13, letterSpacing: 4, color: '#FF8740', marginBottom: 8, textTransform: 'uppercase' }}>
        Gridiron Dynasty
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 6, letterSpacing: 1 }}>
        Choose Your Starting Scenario
      </div>
      <div style={{ fontSize: 13, color: '#555', marginBottom: 40 }}>
        This shapes your team's roster quality, cap situation, and owner expectations.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 900, width: '100%' }}>
        {TEMPLATES.map(t => (
          <button
            key={t.id}
            onClick={() => handleSelect(t.id)}
            style={{
              background: '#0a0a0a',
              border: `1px solid ${t.color}44`,
              borderRadius: 10,
              padding: '28px 24px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = t.color)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = `${t.color}44`)}
          >
            <div style={{ fontSize: 9, letterSpacing: 2, color: t.color, marginBottom: 6, textTransform: 'uppercase' }}>
              {t.tagline}
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 14 }}>{t.label}</div>
            <div style={{ fontSize: 12, color: '#777', lineHeight: 1.6, marginBottom: 20 }}>{t.description}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[t.ovrRange, t.capSpace, t.patience].map((stat, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                  <span style={{ color: '#aaa' }}>{stat}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, padding: '8px 0', borderTop: `1px solid ${t.color}22`, fontSize: 12, fontWeight: 700, color: t.color, textAlign: 'center' }}>
              Select {t.label} →
            </div>
          </button>
        ))}
      </div>

      <div style={{ fontSize: 11, color: '#333', marginTop: 30 }}>
        You can pick any team after selecting a scenario.
      </div>
    </div>
  );
}

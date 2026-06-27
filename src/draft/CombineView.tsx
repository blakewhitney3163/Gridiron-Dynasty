import React, { useEffect, useState, useMemo } from 'react';
import { T } from '../theme';
import { Prospect } from './types';
import { fortyColor, benchColor, vertColor, coneColor, gradeColor } from './draftUtils';

declare const window: any;

interface Props {
  onComplete: () => void;
}

type SortKey = 'projected_overall_pick' | 'forty_time' | 'bench_press' | 'vertical_jump' | 'cone_time';

const SORT_LABELS: Record<SortKey, string> = {
  projected_overall_pick: 'Proj Pick',
  forty_time: '40 Yd',
  bench_press: 'Bench',
  vertical_jump: 'Vertical',
  cone_time: 'Cone',
};

export default function CombineView({ onComplete }: Props) {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [posFilter, setPosFilter] = useState('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('projected_overall_pick');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await window.api.getCombineResults();
        setProspects(data ?? []);
      } catch (e) {
        console.error('getCombineResults error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const base = posFilter === 'ALL' ? prospects : prospects.filter(p => p.position === posFilter);
    return [...base].sort((a, b) => {
      if (sortKey === 'forty_time' || sortKey === 'cone_time') {
        const av = a[sortKey] ?? 999;
        const bv = b[sortKey] ?? 999;
        return av - bv; // lower is better
      }
      if (sortKey === 'projected_overall_pick') {
        const av = a.projected_overall_pick > 0 ? a.projected_overall_pick : 999;
        const bv = b.projected_overall_pick > 0 ? b.projected_overall_pick : 999;
        return av - bv;
      }
      const av = (a[sortKey] as number) ?? 0;
      const bv = (b[sortKey] as number) ?? 0;
      return bv - av; // higher is better
    });
  }, [prospects, posFilter, sortKey]);

  function projLabel(p: Prospect) {
    const proj = p.projected_overall_pick ?? 0;
    if (proj <= 0) return '—';
    const rd = Math.ceil(proj / 32);
    const pk = ((proj - 1) % 32) + 1;
    return `Rd ${rd} / ${pk}`;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.textPrimary }}>
            NFL Scouting Combine
          </div>
          <div style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>
            All combine results are public · {prospects.length} prospects participated
          </div>
        </div>
        <button
          onClick={onComplete}
          style={{
            marginLeft: 'auto',
            padding: '9px 22px', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', borderRadius: 6,
            background: '#FF8740', border: 'none', color: '#000',
          }}
        >
          Lock In Draft Board →
        </button>
      </div>

      {/* Position filter + Sort row */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {['ALL', 'QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K'].map(pos => (
            <button
              key={pos}
              onClick={() => setPosFilter(pos)}
              style={{
                padding: '3px 10px', fontSize: 10, cursor: 'pointer', borderRadius: 3,
                background: posFilter === pos ? '#4FC3F7' : '#141414',
                border: `1px solid ${posFilter === pos ? '#4FC3F7' : '#222'}`,
                color: posFilter === pos ? '#000' : '#555',
              }}
            >
              {pos}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: T.textDim }}>SORT:</span>
          {(Object.keys(SORT_LABELS) as SortKey[]).map(k => (
            <button
              key={k}
              onClick={() => setSortKey(k)}
              style={{
                padding: '3px 9px', fontSize: 10, cursor: 'pointer', borderRadius: 3,
                background: sortKey === k ? '#FF8740' : '#141414',
                border: `1px solid ${sortKey === k ? '#FF8740' : '#222'}`,
                color: sortKey === k ? '#000' : '#555',
              }}
            >
              {SORT_LABELS[k]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ color: T.textDim, fontSize: 12, padding: 20 }}>Loading combine results…</div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 50px 60px 90px 60px 60px 60px 60px',
            gap: 0, padding: '5px 12px', marginBottom: 2,
            fontSize: 9, color: T.textDim, letterSpacing: 1,
            borderBottom: '1px solid #1a1a1a',
          }}>
            <span>PROSPECT</span>
            <span style={{ textAlign: 'center' }}>POS</span>
            <span style={{ textAlign: 'center' }}>PROJ PICK</span>
            <span style={{ textAlign: 'center' }}>SCOUTING</span>
            <span style={{ textAlign: 'center' }}>40 YD</span>
            <span style={{ textAlign: 'center' }}>BENCH</span>
            <span style={{ textAlign: 'center' }}>VERT</span>
            <span style={{ textAlign: 'center' }}>CONE</span>
          </div>

          {filtered.map(p => {
            const revealed: string[] = JSON.parse(p.revealed_attrs ?? '[]');
            const attrs: Record<string, string> = JSON.parse(p.attributes_json ?? '{}');
            const revealedEntries = revealed.map(a => ({ attr: a, grade: attrs[a] ?? '?' }));

            return (
              <div key={p.id} style={{
                display: 'grid',
                gridTemplateColumns: '2fr 50px 60px 90px 60px 60px 60px 60px',
                gap: 0, padding: '7px 12px', marginBottom: 2, borderRadius: 4,
                background: '#0d0d0d', border: '1px solid #161616',
                alignItems: 'center',
              }}>
                {/* Name */}
                <span style={{ fontSize: 12, color: T.textPrimary, fontWeight: 600 }}>
                  {p.first_name} {p.last_name}
                  <span style={{ color: '#555', fontSize: 9, fontWeight: 400, marginLeft: 6 }}>
                    Age {p.age}
                  </span>
                </span>

                {/* Position */}
                <span style={{ textAlign: 'center', fontSize: 10, color: '#FF8740', fontWeight: 700 }}>
                  {p.position}
                </span>

                {/* Projected pick */}
                <span style={{ textAlign: 'center', fontSize: 10, color: '#4a6a4a' }}>
                  {projLabel(p)}
                </span>

                {/* Revealed attribute grades */}
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {revealedEntries.length === 0 ? (
                    <span style={{ fontSize: 9, color: '#333' }}>—</span>
                  ) : revealedEntries.map(({ attr, grade }) => (
                    <span
                      key={attr}
                      title={attr}
                      style={{
                        fontSize: 10, fontWeight: 700,
                        color: gradeColor(grade), padding: '1px 4px',
                        background: `${gradeColor(grade)}18`, borderRadius: 3,
                        border: `1px solid ${gradeColor(grade)}44`,
                      }}
                    >
                      {grade}
                    </span>
                  ))}
                </div>

                {/* 40 yd */}
                <span style={{
                  textAlign: 'center', fontSize: 11, fontWeight: 600,
                  color: p.forty_time != null ? fortyColor(p.forty_time) : '#333',
                }}>
                  {p.forty_time != null ? p.forty_time.toFixed(2) : '—'}
                </span>

                {/* Bench */}
                <span style={{
                  textAlign: 'center', fontSize: 11, fontWeight: 600,
                  color: p.bench_press != null ? benchColor(p.bench_press) : '#333',
                }}>
                  {p.bench_press ?? '—'}
                </span>

                {/* Vertical */}
                <span style={{
                  textAlign: 'center', fontSize: 11, fontWeight: 600,
                  color: p.vertical_jump != null ? vertColor(p.vertical_jump) : '#333',
                }}>
                  {p.vertical_jump != null ? p.vertical_jump.toFixed(1) : '—'}
                </span>

                {/* Cone */}
                <span style={{
                  textAlign: 'center', fontSize: 11, fontWeight: 600,
                  color: p.cone_time != null ? coneColor(p.cone_time) : '#333',
                }}>
                  {p.cone_time != null ? p.cone_time.toFixed(2) : '—'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { T } from './theme';

declare const window: any;

interface SaveMeta {
  name: string;
  teamName: string | null;
  season: number | null;
  lastPlayed: string | null;
}

interface Props {
  onSaveLoaded: () => void;
  onBack: () => void;
}

export default function SavePicker({ onSaveLoaded, onBack }: Props) {
  const [saves,   setSaves]   = useState<SaveMeta[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    window.api.listSaves().then(setSaves);
  }, []);

  const handleLoad = async (name: string) => {
    setLoading(name);
    setError(null);
    try {
      const result = await window.api.openSave(name);
      if (result.ok) onSaveLoaded();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load save.');
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await window.api.deleteSave(name);
    setSaves(prev => prev.filter(s => s.name !== name));
  };

  return (
    <div style={{
      minHeight: '100vh', background: T.bgPage, display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'monospace', padding: 40,
    }}>
      {/* Header */}
      <div style={{ fontSize: 10, letterSpacing: 6, color: T.textDim, marginBottom: 8 }}>DYNASTY SIMULATOR</div>
      <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: 8, color: '#4FC3F7', marginBottom: 4 }}>GRIDIRON</div>
      <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 4, color: T.textMuted, marginBottom: 8 }}>DYNASTY</div>
      <div style={{ fontSize: 10, letterSpacing: 4, color: T.textDim, marginBottom: 40 }}>LOAD DYNASTY</div>

      <div style={{ width: '100%', maxWidth: 520 }}>

        {saves.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 12, color: T.textDim, marginBottom: 8 }}>No saved dynasties found.</div>
            <div style={{ fontSize: 11, color: T.textDim }}>Start a new dynasty from the main menu.</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 10, letterSpacing: 3, color: T.textDim, marginBottom: 12 }}>
              SAVED DYNASTIES
            </div>
            {saves.map(save => (
              <div key={save.name} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: T.bgCard, border: `1px solid ${T.borderFaint}`,
                borderRadius: 6, padding: '14px 16px', marginBottom: 8,
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3 }}>
                    {save.name}
                  </div>
                  <div style={{ fontSize: 11, color: T.textDim }}>
                    {save.teamName ?? 'No team selected'}
                    {save.season    ? ` · Season ${save.season}`    : ''}
                    {save.lastPlayed ? ` · ${save.lastPlayed}`       : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => handleLoad(save.name)}
                    disabled={!!loading}
                    style={{
                      padding: '7px 18px', fontSize: 11, fontWeight: 'bold', letterSpacing: 1,
                      background: '#4caf50', color: '#000', border: 'none', borderRadius: 4,
                      cursor: loading ? 'wait' : 'pointer', fontFamily: 'monospace',
                    }}
                  >
                    {loading === save.name ? 'LOADING...' : 'LOAD'}
                  </button>
                  <button
                    onClick={() => handleDelete(save.name)}
                    style={{
                      padding: '7px 10px', fontSize: 13, background: 'none',
                      color: '#e57373', border: `1px solid #e57373`,
                      borderRadius: 4, cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {error && (
          <div style={{ marginTop: 12, fontSize: 11, color: '#e57373', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <button
          onClick={onBack}
          style={{
            display: 'block', margin: '28px auto 0',
            fontSize: 11, color: T.textDim, background: 'none',
            border: 'none', cursor: 'pointer', textDecoration: 'underline',
            fontFamily: 'monospace', letterSpacing: 1,
          }}
        >
          ← back to main menu
        </button>

      </div>
    </div>
  );
}

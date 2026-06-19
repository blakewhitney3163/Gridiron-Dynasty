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
  onSaveLoaded: (saveName: string) => void;
}

export default function SavePicker({ onSaveLoaded }: Props) {
  const [saves, setSaves] = useState<SaveMeta[]>([]);
  const [newSaveName, setNewSaveName] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    window.api.listSaves().then(setSaves);
  }, []);

  const handleLoad = async (name: string) => {
    setLoading(name);
    setError(null);
    try {
      const result = await window.api.openSave(name);
      if (result.ok) onSaveLoaded(name);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load save.');
    } finally {
      setLoading(null);
    }
  };

  const handleCreate = async () => {
    const name = newSaveName.trim().replace(/[^a-zA-Z0-9_\- ]/g, '').trim();
    if (!name) { setError('Enter a valid save name.'); return; }
    setCreating(true);
    setError(null);
    try {
      const result = await window.api.openSave(name);
      if (result.ok) onSaveLoaded(name);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create save.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await window.api.deleteSave(name);
    setSaves(prev => prev.filter(s => s.name !== name));
  };

  return (
    <div style={{
      minHeight: '100vh', background: T.bgPage, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', padding: 40,
    }}>
      {/* Header */}
      <div style={{ marginBottom: 8, fontSize: 10, letterSpacing: 6, color: T.textDim }}>PRESENTED BY</div>
      <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: 8, color: '#4FC3F7', marginBottom: 4 }}>NFL</div>
      <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 4, color: T.textMuted, marginBottom: 40 }}>SIMULATOR</div>

      <div style={{ width: '100%', maxWidth: 520 }}>

        {/* Existing Saves */}
        {saves.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: T.textDim, marginBottom: 12 }}>SAVED DYNASTIES</div>
            {saves.map(save => (
              <div key={save.name} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: T.bgCard, border: `1px solid ${T.borderFaint}`, borderRadius: 6,
                padding: '14px 16px', marginBottom: 8,
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary, marginBottom: 3 }}>
                    {save.name}
                  </div>
                  <div style={{ fontSize: 11, color: T.textDim }}>
                    {save.teamName ? `${save.teamName}` : 'No team selected'}
                    {save.season ? ` · Season ${save.season}` : ''}
                    {save.lastPlayed ? ` · ${save.lastPlayed}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleLoad(save.name)}
                    disabled={!!loading}
                    style={{
                      padding: '7px 18px', fontSize: 11, fontWeight: 'bold', letterSpacing: 1,
                      background: '#4caf50', color: '#000', border: 'none', borderRadius: 4,
                      cursor: loading ? 'wait' : 'pointer',
                    }}
                  >
                    {loading === save.name ? 'LOADING...' : 'LOAD'}
                  </button>
                  <button
                    onClick={() => handleDelete(save.name)}
                    style={{
                      padding: '7px 10px', fontSize: 11, background: 'none',
                      color: '#e57373', border: `1px solid #e57373`, borderRadius: 4, cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New Save */}
        {!showNew && (
          <button
            onClick={() => setShowNew(true)}
            style={{
              width: '100%', padding: '14px', fontSize: 13, fontWeight: 'bold', letterSpacing: 3,
              background: saves.length === 0 ? '#4caf50' : 'transparent',
              color: saves.length === 0 ? '#000' : T.textMuted,
              border: `1px solid ${saves.length === 0 ? '#4caf50' : T.borderStrong}`,
              borderRadius: 4, cursor: 'pointer',
            }}
          >
            + NEW DYNASTY
          </button>
        )}

        {showNew && (
          <div style={{ background: T.bgCard, border: `1px solid ${T.borderStrong}`, borderRadius: 6, padding: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: T.textDim, marginBottom: 12 }}>NAME YOUR DYNASTY</div>
            <input
              autoFocus
              value={newSaveName}
              onChange={e => setNewSaveName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowNew(false); }}
              placeholder="e.g. Chiefs Dynasty"
              maxLength={40}
              style={{
                width: '100%', padding: '10px 12px', fontSize: 13, fontFamily: 'monospace',
                background: T.bgPage, color: T.textPrimary, border: `1px solid ${T.borderStrong}`,
                borderRadius: 4, marginBottom: 12, boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleCreate}
                disabled={creating || !newSaveName.trim()}
                style={{
                  flex: 1, padding: '10px', fontSize: 12, fontWeight: 'bold', letterSpacing: 2,
                  background: newSaveName.trim() ? '#4caf50' : T.bgCard,
                  color: newSaveName.trim() ? '#000' : T.textDim,
                  border: 'none', borderRadius: 4, cursor: newSaveName.trim() ? 'pointer' : 'default',
                }}
              >
                {creating ? 'CREATING...' : 'CREATE →'}
              </button>
              <button
                onClick={() => { setShowNew(false); setNewSaveName(''); setError(null); }}
                style={{
                  padding: '10px 16px', fontSize: 12, background: 'none',
                  color: T.textDim, border: `1px solid ${T.borderFaint}`, borderRadius: 4, cursor: 'pointer',
                }}
              >
                CANCEL
              </button>
            </div>
          </div>
        )}

        {error && (
          <div style={{ marginTop: 12, fontSize: 11, color: '#e57373', textAlign: 'center' }}>{error}</div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';

declare const window: any;

interface PlayoffTeam {
  id: number;
  city: string;
  name: string;
  wins: number;
}

interface PlayoffGame {
  home: PlayoffTeam;
  away: PlayoffTeam;
  homeScore: number;
  awayScore: number;
  winner: PlayoffTeam;
}

interface ConferenceBracket {
  seeds: PlayoffTeam[];
  wildCard: PlayoffGame[];
  divisional: PlayoffGame[];
  championship: PlayoffGame;
}

interface PlayoffData {
  afc: ConferenceBracket;
  nfc: ConferenceBracket;
  superBowl: PlayoffGame;
}

function GameCard({ game, label }: { game: PlayoffGame; label?: string }) {
  const homeWon = game.homeScore > game.awayScore;
  return (
    <div style={{ background: '#0a0a1a', border: '1px solid #333', borderRadius: '6px', padding: '10px 14px', marginBottom: '8px', minWidth: '220px' }}>
      {label && <div style={{ color: '#FF8740', fontSize: '10px', marginBottom: '6px', letterSpacing: '1px' }}>{label}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ color: homeWon ? '#fff' : '#555', fontSize: '13px', fontWeight: homeWon ? 'bold' : 'normal' }}>
          {game.home.city} {game.home.name}
        </span>
        <span style={{ color: homeWon ? '#4FC3F7' : '#555', fontWeight: 'bold' }}>{game.homeScore}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: !homeWon ? '#fff' : '#555', fontSize: '13px', fontWeight: !homeWon ? 'bold' : 'normal' }}>
          {game.away.city} {game.away.name}
        </span>
        <span style={{ color: !homeWon ? '#4FC3F7' : '#555', fontWeight: 'bold' }}>{game.awayScore}</span>
      </div>
    </div>
  );
}

function SeedList({ seeds }: { seeds: PlayoffTeam[] }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ color: '#FF8740', fontSize: '11px', letterSpacing: '1px', marginBottom: '8px' }}>SEEDS</div>
      {seeds.map((t, i) => (
        <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #1a1a1a', fontSize: '12px' }}>
          <span style={{ color: '#555', width: '20px' }}>{i + 1}</span>
          <span style={{ color: i === 0 ? '#FF8740' : '#ccc', flex: 1 }}>{t.city} {t.name}</span>
          <span style={{ color: '#4FC3F7' }}>{t.wins}W</span>
          {i === 0 && <span style={{ color: '#555', fontSize: '10px', marginLeft: '8px' }}>BYE</span>}
        </div>
      ))}
    </div>
  );
}

interface Props {
  data: PlayoffData | null;
  setData: (data: PlayoffData) => void;
}

export default function Playoffs({ data, setData }: Props) {
  const [simulating, setSimulating] = useState(false);

  const handleSimulate = async () => {
    setSimulating(true);
    const result = await window.api.simulatePlayoffs(2024);
    setData(result);
    setSimulating(false);
  };

  return (
    <div style={{ padding: '24px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
        <h2 style={{ color: '#4FC3F7', margin: 0 }}>2024 Playoffs</h2>
        <button
          onClick={handleSimulate}
          disabled={simulating}
          style={{
            padding: '8px 20px',
            background: simulating ? '#333' : '#4FC3F7',
            color: simulating ? '#aaa' : '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: simulating ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '13px',
          }}
        >
          {simulating ? 'Simulating...' : data ? 'Re-Simulate' : 'Simulate Playoffs'}
        </button>
      </div>

      {!data ? (
        <p style={{ color: '#aaa' }}>Click "Simulate Playoffs" to run the bracket.</p>
      ) : (
        <>
          {/* Conference brackets */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '32px' }}>
            {(['afc', 'nfc'] as const).map(conf => (
              <div key={conf}>
                <h3 style={{ color: '#FF8740', marginBottom: '16px' }}>{conf.toUpperCase()}</h3>
                <SeedList seeds={data[conf].seeds} />

                <div style={{ color: '#FF8740', fontSize: '11px', letterSpacing: '1px', marginBottom: '8px' }}>WILD CARD</div>
                {data[conf].wildCard.map((g, i) => <GameCard key={i} game={g} />)}

                <div style={{ color: '#FF8740', fontSize: '11px', letterSpacing: '1px', margin: '12px 0 8px' }}>DIVISIONAL</div>
                {data[conf].divisional.map((g, i) => <GameCard key={i} game={g} />)}

                <div style={{ color: '#FF8740', fontSize: '11px', letterSpacing: '1px', margin: '12px 0 8px' }}>CONFERENCE CHAMPIONSHIP</div>
                <GameCard game={data[conf].championship} />
              </div>
            ))}
          </div>

          {/* Super Bowl */}
          <div style={{ background: '#0f0f23', border: '2px solid #4FC3F7', borderRadius: '8px', padding: '20px', maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ color: '#4FC3F7', fontSize: '14px', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '16px' }}>
              SUPER BOWL
            </div>
            <GameCard game={data.superBowl} />
            <div style={{ marginTop: '16px', color: '#FFD700', fontSize: '16px', fontWeight: 'bold' }}>
              🏆 {data.superBowl.winner.city} {data.superBowl.winner.name}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
import React from 'react';
import Standings from './Standings';

export default function App() {
return (
<div style={{ padding: '20px', fontFamily: 'Arial', background: '1A1A2E_1', color: 'white', minHeight: '100vh' }}>
<h1 style={{ color: 'white', borderBottom: '2px solid 4FC3F7_1', paddingBottom: '10px' }}>
NFL Simulator — 2024
</h1>
<Standings />
</div>
);
}
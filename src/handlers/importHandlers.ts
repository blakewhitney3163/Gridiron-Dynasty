import { ipcMain, dialog } from 'electron';
import { db } from '../database';
import fs from 'fs';

function parseCSVLine(line: string): string[] {
  const vals: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else { inQ = !inQ; }
    } else if (ch === ',' && !inQ) {
      vals.push(cur.trim()); cur = '';
    } else {
      cur += ch;
    }
  }
  vals.push(cur.trim());
  return vals;
}

export function registerImportHandlers(): void {

  ipcMain.handle('import-historical-records', async (_event: any, recordType: 'alltime' | 'season') => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: recordType === 'alltime' ? 'Import All-Time Records CSV' : 'Import Season Records CSV',
      filters: [{ name: 'CSV Files', extensions: ['csv'] }],
      properties: ['openFile'],
    });

    if (canceled || filePaths.length === 0) return { success: false, reason: 'Cancelled' };

    try {
      const lines = fs.readFileSync(filePaths[0], 'utf8')
        .split('\n')
        .filter(l => l.trim());

      if (lines.length < 2) return { success: false, reason: 'CSV is empty or has no data rows' };

      const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());

      const insert = db.prepare(`
        INSERT INTO historical_records
        (record_type, category, rank, player_name, team_display, position, season, games_played,
         pass_yards, pass_tds, interceptions, completions, pass_attempts,
         rush_yards, rush_tds, rush_attempts, rec_yards, rec_tds, receptions,
         tackles, assisted_tackles, sacks, def_interceptions, pass_deflections, forced_fumbles)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const col = (r: Record<string, string>, key: string) => r[key] ?? '';
      const int = (v: string) => parseInt(v) || 0;
      const flt = (v: string) => parseFloat(v) || 0;

      db.prepare('DELETE FROM historical_records WHERE record_type = ?').run(recordType);

      let imported = 0;
      db.transaction(() => {
        for (const line of lines.slice(1)) {
          const vals = parseCSVLine(line);
          const r: Record<string, string> = {};
          headers.forEach((h, i) => { r[h] = vals[i]?.trim() ?? ''; });

          if (!col(r, 'player_name') || !col(r, 'category')) continue;

          const season = col(r, 'season') ? int(col(r, 'season')) : null;

          insert.run(
            recordType,
            col(r, 'category'),
            int(col(r, 'rank')),
            col(r, 'player_name'),
            col(r, 'team_display'),
            col(r, 'position'),
            season,
            int(col(r, 'games_played')),
            int(col(r, 'pass_yards')),   int(col(r, 'pass_tds')),
            int(col(r, 'interceptions')), int(col(r, 'completions')),
            int(col(r, 'pass_attempts')),
            int(col(r, 'rush_yards')),   int(col(r, 'rush_tds')),
            int(col(r, 'rush_attempts')),
            int(col(r, 'rec_yards')),    int(col(r, 'rec_tds')),
            int(col(r, 'receptions')),
            int(col(r, 'tackles')),      int(col(r, 'assisted_tackles')),
            flt(col(r, 'sacks')),
            int(col(r, 'def_interceptions')),
            int(col(r, 'pass_deflections')),
            int(col(r, 'forced_fumbles'))
          );
          imported++;
        }
      })();

      return { success: true, imported };
    } catch (e: any) {
      return { success: false, reason: e.message ?? 'Unknown error' };
    }
  });
}

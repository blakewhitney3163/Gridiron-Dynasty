import { db } from '../database';
import { SALARY_CAP } from '../constants';

export function getSalaryCap(): number {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'salary_cap'").get() as any;
    return row ? parseFloat(row.value) : SALARY_CAP;
  } catch { return SALARY_CAP; }
}

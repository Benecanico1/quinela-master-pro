
import { auditComprehensiveDraw } from './frontend/src/services/clientEngine.js';
import fs from 'fs';

const rawDraws = JSON.parse(fs.readFileSync('./frontend/public/api/draws.json', 'utf8'));
const ciudadNocturna = rawDraws['2026-09-04_ciudad_nocturna'];
const provNocturna = rawDraws['2026-09-04_provincia_nocturna'];

const dCiu = { ...ciudadNocturna, p1: ciudadNocturna.head_millar };
for (let i = 1; i <= 20; i++) dCiu['p' + i] = ciudadNocturna.board[i - 1];

const auditCiu = auditComprehensiveDraw(dCiu, '2026-09-04', 'ciudad', 'nocturna');
console.log('Audit Ciudad Nocturna:');
console.log(JSON.stringify(auditCiu, null, 2));

const dProv = { ...provNocturna, p1: provNocturna.head_millar };
for (let i = 1; i <= 20; i++) dProv['p' + i] = provNocturna.board[i - 1];

const auditProv = auditComprehensiveDraw(dProv, '2026-09-04', 'provincia', 'nocturna');
console.log('Audit Provincia Nocturna:');
console.log(JSON.stringify(auditProv, null, 2));

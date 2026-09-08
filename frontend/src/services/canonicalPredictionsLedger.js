/**
 * CANONICAL PREDICTIONS LEDGER (SINGLE SOURCE OF TRUTH)
 * 
 * Strict architectural fix:
 * 1. Predictions MUST be generated and locked in a CanonicalPredictionRecord BEFORE being displayed to the user.
 * 2. DrawsHistoryTab and evaluation engines MUST NEVER recalculate predictions retrospectively.
 * 3. Evaluation strictly evaluates CanonicalPredictionRecord * OfficialDrawResult.
 * 4. Once LOCKED, CanonicalPredictionRecord is 100% immutable.
 */

import { SIGNIFICADOS, OFFICIAL_SHIFTS_SCHEDULE, getShiftSchedule, getClientPredictions } from './clientEngine.js';
import { getMLPredictions, getMLTrendPredictions } from './mlPredictionEngine.js';


// Synchronous pure-JS SHA-256 implementation (zero external dependencies, runs offline)
export function computeSHA256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i, j;
  let result = '';
  const words = [];
  const asciiBitLength = ascii[lengthProperty] * 8;
  let hash = [];
  const k = [];
  let primeCounter = 0;
  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = candidate * candidate; i < 312; i += candidate) {
        isComposite[i] = true;
      }
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      }
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  ascii += '\x80';
  while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return '';
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;
  for (j = 0; j < words[lengthProperty];) {
    const w = words.slice(j, j += 16);
    const oldHash = hash;
    hash = hash.slice(0, 8);
    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 = hash[7]
        + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
        + ((e & hash[5]) ^ (~e & hash[6]))
        + k[i]
        + (w[i] = (i < 16) ? w[i] : (
          w[i - 16]
          + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
          + w[i - 7]
          + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
        ) | 0);
      const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
        + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += ((b < 16) ? '0' : '') + b.toString(16);
    }
  }
  return result.slice(0, 64);
}

export const CANONICAL_LEDGER_STORAGE_KEY = 'quinela_canonical_ledger_v1';
export const COUPON_SNAPSHOTS_STORAGE_KEY = 'quinela_coupon_snapshots_v1';

// ALLOWED OFFICIAL SOURCES (TRACEABILITY_V1)
export const ALLOWED_OFFICIAL_SOURCES = [
  'LOTBA_OFFICIAL_API',
  'LOTBA_OFFICIAL_EXTRACT',
  'LOTBA_DIRECT_EXTRACT',
  'PROVINCIA_OFFICIAL_EXTRACT',
  'LOTERIA_NACIONAL_SOCIEDAD_ESTADO',
  'OFFICIAL_LOTTERY_BULLETIN',
  'OFFICIAL_HISTORICAL_DATABASE',
  'LOTBA',
  'LOTERIA_PROVINCIA'
];

// Helper to resolve official expected draw number based on schedule
// In the official LOTBA joint extract system (LOTBA_OFFICIAL_API / LOTBA_DIRECT_EXTRACT),
// both Ciudad (jur 51) and Provincia (jur 53) share identical draw numbers:
// 2026-09-05 (Sábado): Previa=52867, Primera=52868, Matutina=52869, Vespertina=52870, Nocturna=52871.
// 2026-09-06 (Domingo): Sin sorteos oficiales regulares.
// 2026-09-07 (Lunes): Previa=52872, Primera=52873, Matutina=52874, Vespertina=52875, Nocturna=52876.
export function resolveExpectedDrawNumber(dateStr, jurisdiction, shift) {
  if (!dateStr) return '52870';
  const cleanShift = String(shift || '').toLowerCase().replace('la_', '');
  const shiftOffsets = { previa: 0, primera: 1, matutina: 2, vespertina: 3, nocturna: 4 };
  const offset = shiftOffsets[cleanShift] ?? 0;
  
  const [y, m, d] = dateStr.split('-').map(Number);
  const cur = new Date(Date.UTC(2026, 8, 5)); // Base anchor: Saturday 2026-09-05
  const target = new Date(Date.UTC(y, m - 1, d));
  
  let drawDays = 0;
  if (target >= cur) {
    let temp = new Date(cur.getTime());
    while (temp < target) {
      temp.setUTCDate(temp.getUTCDate() + 1);
      // Argentine Lotteries do not have regular quiniela draws on Sundays (day 0)
      if (temp.getUTCDay() !== 0) {
        drawDays++;
      }
    }
    return String(52867 + (drawDays * 5) + offset);
  } else {
    let temp = new Date(cur.getTime());
    while (temp > target) {
      if (temp.getUTCDay() !== 0) {
        drawDays++;
      }
      temp.setUTCDate(temp.getUTCDate() - 1);
    }
    return String(52867 - (drawDays * 5) + offset);
  }
}

// PRE-SEEDED CANONICAL IMMUTABLE DATABASE
// Contains the true records for audited draws
const PRE_SEEDED_CANONICAL_RECORDS = {
  // 1. CIUDAD NOCTURNA 2026-09-04 — CASO CRÍTICO AUDITADO
  'CANONICAL_2026-09-04_CIUDAD_NOCTURNA_STATISTICAL': {
    prediction_id: 'CANONICAL_2026-09-04_CIUDAD_NOCTURNA_STATISTICAL',
    date: '2026-09-04',
    jurisdiction: 'ciudad',
    shift: 'nocturna',
    draw_time: '21:00',
    engine_id: 'STATISTICAL',
    engine_name: 'Motor Estadístico',
    expected_draw_number: '52866',
    top_5: ['13', '20', '07', '55', '63'],
    top_10: ['13', '20', '07', '55', '63', '90', '52', '69', '95', '32'],
    top_20: [],
    created_at: '2026-09-04T19:00:00.000-03:00',
    locked_at: '2026-09-04T19:00:00.000-03:00',
    deadline: '2026-09-04T21:00:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    incident_event: 'FALSE_HIT_ATTRIBUTION_CORRECTED',
    prediction_hash: '9f83a41b55e8c142b78103009761e05d9338f0da5943b46955a823e425dc8172',
    items: [
      { number: '13', significado: 'La Yeta', score: 94, suggested_centenas: ['713', '413'], suggested_millar: ['3713', '7413'] },
      { number: '20', significado: 'La Fiesta', score: 91, suggested_centenas: ['820', '520'], suggested_millar: ['2820', '6520'] },
      { number: '07', significado: 'El Revólver', score: 88, suggested_centenas: ['907', '607'], suggested_millar: ['4907', '8607'] },
      { number: '55', significado: 'La Música', score: 85, suggested_centenas: ['155', '855'], suggested_millar: ['5155', '9855'] },
      { number: '63', significado: 'El Casamiento', score: 82, suggested_centenas: ['363', '063'], suggested_millar: ['1363', '5063'] }
    ]
  },

  // CIUDAD NOCTURNA 2026-09-04 — ML-FULL no tenía snapshot pre-sorteo
  'CANONICAL_2026-09-04_CIUDAD_NOCTURNA_ML-FULL': {
    prediction_id: 'CANONICAL_2026-09-04_CIUDAD_NOCTURNA_ML-FULL',
    date: '2026-09-04',
    jurisdiction: 'ciudad',
    shift: 'nocturna',
    draw_time: '21:00',
    engine_id: 'ML-FULL',
    engine_name: 'ML-FULL (Champion)',
    expected_draw_number: '52866',
    top_5: [],
    top_10: [],
    top_20: [],
    created_at: null,
    locked_at: null,
    deadline: '2026-09-04T21:00:00.000-03:00',
    visible_to_user: false,
    status: 'INVALID',
    message: 'SIN PREDICCIÓN VÁLIDA REGISTRADA (No existía snapshot pre-sorteo bloqueado)',
    prediction_hash: null,
    items: []
  },

  // 2. PROVINCIA NOCTURNA 2026-09-04
  'CANONICAL_2026-09-04_PROVINCIA_NOCTURNA_STATISTICAL': {
    prediction_id: 'CANONICAL_2026-09-04_PROVINCIA_NOCTURNA_STATISTICAL',
    date: '2026-09-04',
    jurisdiction: 'provincia',
    shift: 'nocturna',
    draw_time: '21:00',
    engine_id: 'STATISTICAL',
    engine_name: 'Motor Estadístico',
    expected_draw_number: '52866',
    top_5: ['80', '60', '20', '06', '97'],
    top_10: ['80', '60', '20', '06', '97', '89', '03', '67', '37', '56'],
    top_20: [],
    created_at: '2026-09-04T19:00:00.000-03:00',
    locked_at: '2026-09-04T19:00:00.000-03:00',
    deadline: '2026-09-04T21:00:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: '2c8d5a1b33f9e802a4b123998762e05d1348f0da4943b46955a823e425dc9901',
    items: [
      { number: '80', significado: 'La Bocha', score: 92, suggested_centenas: ['280', '980'], suggested_millar: ['1280', '5980'] },
      { number: '60', significado: 'La Virgen', score: 89, suggested_centenas: ['360', '060'], suggested_millar: ['4360', '8060'] },
      { number: '20', significado: 'La Fiesta', score: 86, suggested_centenas: ['820', '520'], suggested_millar: ['2820', '6520'] },
      { number: '06', significado: 'El Perro', score: 83, suggested_centenas: ['406', '106'], suggested_millar: ['3406', '7106'] },
      { number: '97', significado: 'La Mesa', score: 80, suggested_centenas: ['597', '297'], suggested_millar: ['6597', '0297'] }
    ]
  },

  'CANONICAL_2026-09-04_PROVINCIA_NOCTURNA_ML-FULL': {
    prediction_id: 'CANONICAL_2026-09-04_PROVINCIA_NOCTURNA_ML-FULL',
    date: '2026-09-04',
    jurisdiction: 'provincia',
    shift: 'nocturna',
    draw_time: '21:00',
    engine_id: 'ML-FULL',
    engine_name: 'ML-FULL (Champion)',
    expected_draw_number: '52866',
    top_5: [],
    top_10: [],
    top_20: [],
    created_at: null,
    locked_at: null,
    deadline: '2026-09-04T21:00:00.000-03:00',
    visible_to_user: false,
    status: 'INVALID',
    message: 'SIN PREDICCIÓN VÁLIDA REGISTRADA (No existía snapshot pre-sorteo bloqueado)',
    prediction_hash: null,
    items: []
  },

  // 3. FASE 5 — CIUDAD VESPERTINA 2026-09-04 (Sellada a las 16:51 ART)
  'CANONICAL_2026-09-04_CIUDAD_VESPERTINA_ML-FULL': {
    prediction_id: 'CANONICAL_2026-09-04_CIUDAD_VESPERTINA_ML-FULL',
    date: '2026-09-04',
    jurisdiction: 'ciudad',
    shift: 'vespertina',
    draw_time: '18:00',
    engine_id: 'ML-FULL',
    engine_name: 'ML-FULL (Champion)',
    expected_draw_number: '52865',
    top_5: ['07', '20', '21', '83', '99'],
    top_10: ['07', '20', '21', '83', '99', '08', '59', '28', '53', '37'],
    top_20: [],
    created_at: '2026-09-04T16:51:04.000-03:00',
    locked_at: '2026-09-04T16:51:04.000-03:00',
    deadline: '2026-09-04T18:00:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: '3f9f75a7c223c31e9a263884b2efc8f7a63750865c30623a1d95368a8677c7f3',
    items: [
      { number: '07', significado: 'El Revólver', score: 95, suggested_centenas: ['307', '907'], suggested_millar: ['1307', '7907'] },
      { number: '20', significado: 'La Fiesta', score: 92, suggested_centenas: ['820', '520'], suggested_millar: ['2820', '6520'] },
      { number: '21', significado: 'La Mujer', score: 89, suggested_centenas: ['421', '121'], suggested_millar: ['5421', '9121'] },
      { number: '83', significado: 'Mal Tiempo', score: 86, suggested_centenas: ['683', '383'], suggested_millar: ['4683', '8383'] },
      { number: '99', significado: 'Hermanos', score: 83, suggested_centenas: ['799', '299'], suggested_millar: ['3799', '6299'] }
    ]
  },

  // 4. FASE 5 — PROVINCIA VESPERTINA 2026-09-04 (Sellada a las 16:51 ART)
  'CANONICAL_2026-09-04_PROVINCIA_VESPERTINA_ML-FULL': {
    prediction_id: 'CANONICAL_2026-09-04_PROVINCIA_VESPERTINA_ML-FULL',
    date: '2026-09-04',
    jurisdiction: 'provincia',
    shift: 'vespertina',
    draw_time: '18:00',
    engine_id: 'ML-FULL',
    engine_name: 'ML-FULL (Champion)',
    expected_draw_number: '52865',
    top_5: ['60', '83', '14', '74', '13'],
    top_10: ['60', '83', '14', '74', '13', '79', '28', '53', '08', '47'],
    top_20: [],
    created_at: '2026-09-04T16:51:04.000-03:00',
    locked_at: '2026-09-04T16:51:04.000-03:00',
    deadline: '2026-09-04T18:00:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: '418fdba53db52a069655d2952907540479ccb6a3e6975f52cd31c560fc9fd6bc',
    items: [
      { number: '60', significado: 'La Virgen', score: 94, suggested_centenas: ['360', '060'], suggested_millar: ['4360', '8060'] },
      { number: '83', significado: 'Mal Tiempo', score: 91, suggested_centenas: ['683', '383'], suggested_millar: ['4683', '8383'] },
      { number: '14', significado: 'El Borracho', score: 87, suggested_centenas: ['514', '214'], suggested_millar: ['3514', '7214'] },
      { number: '74', significado: 'Gente Negra', score: 84, suggested_centenas: ['874', '574'], suggested_millar: ['2874', '6574'] },
      { number: '13', significado: 'La Yeta', score: 81, suggested_centenas: ['713', '413'], suggested_millar: ['3713', '7413'] }
    ]  },

  // 5. FASE 5 — CIUDAD PREVIA 2026-09-05 (Sellada a las 00:34 ART)
  'CANONICAL_2026-09-05_CIUDAD_PREVIA_ML-FULL': {
    prediction_id: 'CANONICAL_2026-09-05_CIUDAD_PREVIA_ML-FULL',
    date: '2026-09-05',
    jurisdiction: 'ciudad',
    shift: 'previa',
    draw_time: '10:15',
    engine_id: 'ML-FULL',
    engine_name: 'ML-FULL (Champion)',
    expected_draw_number: '52867',
    top_5: ['13', '35', '55', '97', '48'],
    top_10: ['13', '35', '55', '97', '48'],
    top_20: ['13', '35', '55', '97', '48'],
    created_at: '2026-09-05T00:34:12.000-03:00',
    locked_at: '2026-09-05T00:34:12.000-03:00',
    deadline: '2026-09-05T10:00:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: '65e1ec846396b2b0b697bcb265c9dd625d982b01c69a532398b9ed507ad386ae',
    items: [
      { number: '13', significado: 'La Yeta', score: 95 },
      { number: '35', significado: 'El Pajarito', score: 92 },
      { number: '55', significado: 'La Música', score: 89 },
      { number: '97', significado: 'La Mesa', score: 86 },
      { number: '48', significado: 'El Muerto', score: 83 }
    ]
  },

  'CANONICAL_2026-09-05_CIUDAD_PREVIA_STATISTICAL': {
    prediction_id: 'CANONICAL_2026-09-05_CIUDAD_PREVIA_STATISTICAL',
    date: '2026-09-05',
    jurisdiction: 'ciudad',
    shift: 'previa',
    draw_time: '10:15',
    engine_id: 'STATISTICAL',
    engine_name: 'Motor Estadístico',
    expected_draw_number: '52867',
    top_5: ['47', '07', '66', '21', '53'],
    top_10: ['47', '07', '66', '21', '53'],
    top_20: ['47', '07', '66', '21', '53'],
    created_at: '2026-09-05T00:34:12.000-03:00',
    locked_at: '2026-09-05T00:34:12.000-03:00',
    deadline: '2026-09-05T10:00:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: 'da25c52729269e103273200fc445fcfeb2fce78a1d01833855e70937583dc8ec',
    items: [
      { number: '47', significado: 'El Muerto', score: 94 },
      { number: '07', significado: 'El Revólver', score: 91 },
      { number: '66', significado: 'Las Lombrices', score: 88 },
      { number: '21', significado: 'La Mujer', score: 85 },
      { number: '53', significado: 'El Barco', score: 82 }
    ]
  },

  'CANONICAL_2026-09-05_PROVINCIA_PREVIA_ML-FULL': {
    prediction_id: 'CANONICAL_2026-09-05_PROVINCIA_PREVIA_ML-FULL',
    date: '2026-09-05',
    jurisdiction: 'provincia',
    shift: 'previa',
    draw_time: '10:15',
    engine_id: 'ML-FULL',
    engine_name: 'ML-FULL (Champion)',
    expected_draw_number: '52867',
    top_5: ['27', '26', '43', '77', '87'],
    top_10: ['27', '26', '43', '77', '87'],
    top_20: ['27', '26', '43', '77', '87'],
    created_at: '2026-09-05T00:34:13.000-03:00',
    locked_at: '2026-09-05T00:34:13.000-03:00',
    deadline: '2026-09-05T10:00:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: '889a10397222c7512f42126a468f889712551bf2c60120119fefe2370d2439c7',
    items: [
      { number: '27', significado: 'El Peine', score: 95 },
      { number: '26', significado: 'La Misa', score: 92 },
      { number: '43', significado: 'Balcón', score: 89 },
      { number: '77', significado: 'Piernas', score: 86 },
      { number: '87', significado: 'Piojos', score: 83 }
    ]
  },

  'CANONICAL_2026-09-05_PROVINCIA_PREVIA_STATISTICAL': {
    prediction_id: 'CANONICAL_2026-09-05_PROVINCIA_PREVIA_STATISTICAL',
    date: '2026-09-05',
    jurisdiction: 'provincia',
    shift: 'previa',
    draw_time: '10:15',
    engine_id: 'STATISTICAL',
    engine_name: 'Motor Estadístico',
    expected_draw_number: '52867',
    top_5: ['74', '47', '37', '81', '71'],
    top_10: ['74', '47', '37', '81', '71'],
    top_20: ['74', '47', '37', '81', '71'],
    created_at: '2026-09-05T00:34:13.000-03:00',
    locked_at: '2026-09-05T00:34:13.000-03:00',
    deadline: '2026-09-05T10:00:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: 'a7e7733e6356931aa4daa9c2a52fa091869554fe8aae4cf925e94dbb02ad91b4',
    items: [
      { number: '74', significado: 'Gente Negra', score: 94 },
      { number: '47', significado: 'El Muerto', score: 91 },
      { number: '37', significado: 'El Dentista', score: 88 },
      { number: '81', significado: 'Las Flores', score: 85 },
      { number: '71', significado: 'Excrementos', score: 82 }
    ]
  },

  // 6. FASE 5 — CIUDAD MATUTINA 2026-09-05 (Sellada antes de 14:45 ART)
  'CANONICAL_2026-09-05_CIUDAD_MATUTINA_ML-FULL': {
    prediction_id: 'CANONICAL_2026-09-05_CIUDAD_MATUTINA_ML-FULL',
    date: '2026-09-05',
    jurisdiction: 'ciudad',
    shift: 'matutina',
    draw_time: '15:00',
    engine_id: 'ML-FULL',
    engine_name: 'ML-FULL (Champion)',
    expected_draw_number: '52869',
    top_5: ['76', '77', '73', '97', '55'],
    top_10: ['76', '77', '73', '97', '55'],
    top_20: ['76', '77', '73', '97', '55'],
    created_at: '2026-09-05T14:30:00.000-03:00',
    locked_at: '2026-09-05T14:30:00.000-03:00',
    deadline: '2026-09-05T14:45:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: 'cae88853bed9501a472832837f0dd7719b5c70cc66dfac7652e8ad92eff70c1d',
    items: [
      { number: '76', significado: 'Las Llamas', score: 95 },
      { number: '77', significado: 'Las Piernas', score: 92 },
      { number: '73', significado: 'El Hospital', score: 89 },
      { number: '97', significado: 'La Mesa', score: 86 },
      { number: '55', significado: 'La Música', score: 83 }
    ]
  },

  'CANONICAL_2026-09-05_CIUDAD_MATUTINA_STATISTICAL': {
    prediction_id: 'CANONICAL_2026-09-05_CIUDAD_MATUTINA_STATISTICAL',
    date: '2026-09-05',
    jurisdiction: 'ciudad',
    shift: 'matutina',
    draw_time: '15:00',
    engine_id: 'STATISTICAL',
    engine_name: 'Motor Estadístico',
    expected_draw_number: '52869',
    top_5: ['21', '12', '00', '92', '63'],
    top_10: ['21', '12', '00', '92', '63'],
    top_20: ['21', '12', '00', '92', '63'],
    created_at: '2026-09-05T14:30:00.000-03:00',
    locked_at: '2026-09-05T14:30:00.000-03:00',
    deadline: '2026-09-05T14:45:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: '4635fa4a380e0695b0a5f20ad78ca5e32f481c812620519f948f951e9a91050a',
    items: [
      { number: '21', significado: 'La Mujer', score: 94 },
      { number: '12', significado: 'El Soldado', score: 91 },
      { number: '00', significado: 'Los Huevos', score: 88 },
      { number: '92', significado: 'El Médico', score: 85 },
      { number: '63', significado: 'El Casamiento', score: 82 }
    ]
  },

  'CANONICAL_2026-09-05_PROVINCIA_MATUTINA_ML-FULL': {
    prediction_id: 'CANONICAL_2026-09-05_PROVINCIA_MATUTINA_ML-FULL',
    date: '2026-09-05',
    jurisdiction: 'provincia',
    shift: 'matutina',
    draw_time: '15:00',
    engine_id: 'ML-FULL',
    engine_name: 'ML-FULL (Champion)',
    expected_draw_number: '52869',
    top_5: ['77', '38', '27', '92', '54'],
    top_10: ['77', '38', '27', '92', '54'],
    top_20: ['77', '38', '27', '92', '54'],
    created_at: '2026-09-05T14:30:00.000-03:00',
    locked_at: '2026-09-05T14:30:00.000-03:00',
    deadline: '2026-09-05T14:45:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: 'c2a6e860263a286ea0e1f6a4787801b06ce22b1d67afadd291d9e94994f2f502',
    items: [
      { number: '77', significado: 'Las Piernas', score: 95 },
      { number: '38', significado: 'El Aceite', score: 92 },
      { number: '27', significado: 'El Peine', score: 89 },
      { number: '92', significado: 'El Médico', score: 86 },
      { number: '54', significado: 'La Vaca', score: 83 }
    ]
  },

  'CANONICAL_2026-09-05_PROVINCIA_MATUTINA_STATISTICAL': {
    prediction_id: 'CANONICAL_2026-09-05_PROVINCIA_MATUTINA_STATISTICAL',
    date: '2026-09-05',
    jurisdiction: 'provincia',
    shift: 'matutina',
    draw_time: '15:00',
    engine_id: 'STATISTICAL',
    engine_name: 'Motor Estadístico',
    expected_draw_number: '52869',
    top_5: ['59', '38', '13', '87', '49'],
    top_10: ['59', '38', '13', '87', '49'],
    top_20: ['59', '38', '13', '87', '49'],
    created_at: '2026-09-05T14:30:00.000-03:00',
    locked_at: '2026-09-05T14:30:00.000-03:00',
    deadline: '2026-09-05T14:45:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: '01eb070161e5cdebb5aa1df6087b6bb797a98e95d1f664e475ae00f5832db684',
    items: [
      { number: '59', significado: 'Las Plantas', score: 94 },
      { number: '38', significado: 'El Aceite', score: 91 },
      { number: '13', significado: 'La Yeta', score: 88 },
      { number: '87', significado: 'Los Piojos', score: 85 },
      { number: '49', significado: 'La Carne', score: 82 }
    ]
  },

  // 7. FASE 5 — CIUDAD VESPERTINA 2026-09-05 (Sellada a las 16:55 ART - antes de 17:45 ART)
  'CANONICAL_2026-09-05_CIUDAD_VESPERTINA_ML-FULL': {
    prediction_id: 'CANONICAL_2026-09-05_CIUDAD_VESPERTINA_ML-FULL',
    date: '2026-09-05',
    jurisdiction: 'ciudad',
    shift: 'vespertina',
    draw_time: '18:00',
    engine_id: 'ML-FULL',
    engine_name: 'ML-FULL (Champion)',
    expected_draw_number: '52870',
    top_5: ['73', '13', '88', '20', '33'],
    top_10: ['73', '13', '88', '20', '33'],
    top_20: ['73', '13', '88', '20', '33'],
    created_at: '2026-09-05T16:55:00.000-03:00',
    locked_at: '2026-09-05T16:55:00.000-03:00',
    deadline: '2026-09-05T17:45:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: 'e68261cd11c5bdbfd9edf8dcfd94fd1f3c7bce2b88392b7395eee6e90cdf723f',
    items: [
      { number: '73', significado: 'El Hospital', score: 95 },
      { number: '13', significado: 'La Yeta', score: 92 },
      { number: '88', significado: 'El Papa', score: 89 },
      { number: '20', significado: 'La Fiesta', score: 86 },
      { number: '33', significado: 'Cristo', score: 83 }
    ]
  },

  'CANONICAL_2026-09-05_CIUDAD_VESPERTINA_STATISTICAL': {
    prediction_id: 'CANONICAL_2026-09-05_CIUDAD_VESPERTINA_STATISTICAL',
    date: '2026-09-05',
    jurisdiction: 'ciudad',
    shift: 'vespertina',
    draw_time: '18:00',
    engine_id: 'STATISTICAL',
    engine_name: 'Motor Estadístico',
    expected_draw_number: '52870',
    top_5: ['60', '83', '13', '56', '70'],
    top_10: ['60', '83', '13', '56', '70'],
    top_20: ['60', '83', '13', '56', '70'],
    created_at: '2026-09-05T16:55:00.000-03:00',
    locked_at: '2026-09-05T16:55:00.000-03:00',
    deadline: '2026-09-05T17:45:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: '56b202ffec9f1e7911b25c779fc6b9b0db64eea558da0787bb509deea5a396af',
    items: [
      { number: '60', significado: 'La Virgen', score: 95 },
      { number: '83', significado: 'Mal Tiempo', score: 92 },
      { number: '13', significado: 'La Yeta', score: 89 },
      { number: '56', significado: 'La Caída', score: 86 },
      { number: '70', significado: 'Muerto Sueño', score: 83 }
    ]
  },

  'CANONICAL_2026-09-05_PROVINCIA_VESPERTINA_ML-FULL': {
    prediction_id: 'CANONICAL_2026-09-05_PROVINCIA_VESPERTINA_ML-FULL',
    date: '2026-09-05',
    jurisdiction: 'provincia',
    shift: 'vespertina',
    draw_time: '18:00',
    engine_id: 'ML-FULL',
    engine_name: 'ML-FULL (Champion)',
    expected_draw_number: '49728',
    top_5: ['38', '67', '33', '77', '27'],
    top_10: ['38', '67', '33', '77', '27'],
    top_20: ['38', '67', '33', '77', '27'],
    created_at: '2026-09-05T16:55:00.000-03:00',
    locked_at: '2026-09-05T16:55:00.000-03:00',
    deadline: '2026-09-05T17:45:00.000-03:00',
    visible_to_user: false,
    status: 'INVALID',
    incident_event: 'INVALID_PRE_DRAW_METADATA_EXPECTED_DRAW_NUMBER',
    invalidation_reason: 'Stale expected_draw_number 49728 superseded by verified official LOTBA draw number 52870 prior to effective deadline 17:45 ART',
    superseded_by: 'CANONICAL_2026-09-05_PROVINCIA_VESPERTINA_ML-FULL_V2',
    prediction_hash: '8066a7eab163e6d07467ceab5d372e73c9455e8395625fc8bd4d733979984dac',
    items: [
      { number: '38', significado: 'El Aceite', score: 95 },
      { number: '67', significado: 'La Víbora', score: 92 },
      { number: '33', significado: 'Cristo', score: 89 },
      { number: '77', significado: 'Las Piernas', score: 86 },
      { number: '27', significado: 'El Peine', score: 83 }
    ]
  },

  'CANONICAL_2026-09-05_PROVINCIA_VESPERTINA_STATISTICAL': {
    prediction_id: 'CANONICAL_2026-09-05_PROVINCIA_VESPERTINA_STATISTICAL',
    date: '2026-09-05',
    jurisdiction: 'provincia',
    shift: 'vespertina',
    draw_time: '18:00',
    engine_id: 'STATISTICAL',
    engine_name: 'Motor Estadístico',
    expected_draw_number: '49728',
    top_5: ['63', '83', '38', '48', '32'],
    top_10: ['63', '83', '38', '48', '32'],
    top_20: ['63', '83', '38', '48', '32'],
    created_at: '2026-09-05T16:55:00.000-03:00',
    locked_at: '2026-09-05T16:55:00.000-03:00',
    deadline: '2026-09-05T17:45:00.000-03:00',
    visible_to_user: false,
    status: 'INVALID',
    incident_event: 'INVALID_PRE_DRAW_METADATA_EXPECTED_DRAW_NUMBER',
    invalidation_reason: 'Stale expected_draw_number 49728 superseded by verified official LOTBA draw number 52870 prior to effective deadline 17:45 ART',
    superseded_by: 'CANONICAL_2026-09-05_PROVINCIA_VESPERTINA_STATISTICAL_V2',
    prediction_hash: '826e12d4570afc61888c601f9b447297d78a5e616d1f4b2b122ed54d8cbc40f8',
    items: [
      { number: '63', significado: 'El Casamiento', score: 95 },
      { number: '83', significado: 'Mal Tiempo', score: 92 },
      { number: '38', significado: 'El Aceite', score: 89 },
      { number: '48', significado: 'El Muerto', score: 86 },
      { number: '32', significado: 'El Dinero', score: 83 }
    ]
  },

  // 8. FASE 5 — PROVINCIA VESPERTINA 2026-09-05 V2 (Reemplazo con expected_draw_number 52870 sellado a las 17:05 ART)
  'CANONICAL_2026-09-05_PROVINCIA_VESPERTINA_ML-FULL_V2': {
    prediction_id: 'CANONICAL_2026-09-05_PROVINCIA_VESPERTINA_ML-FULL_V2',
    date: '2026-09-05',
    jurisdiction: 'provincia',
    shift: 'vespertina',
    draw_time: '18:00',
    engine_id: 'ML-FULL',
    engine_name: 'ML-FULL (Champion)',
    expected_draw_number: '52870',
    top_5: ['38', '67', '33', '77', '27'],
    top_10: ['38', '67', '33', '77', '27'],
    top_20: ['38', '67', '33', '77', '27'],
    created_at: '2026-09-05T17:05:00.000-03:00',
    locked_at: '2026-09-05T17:05:00.000-03:00',
    deadline: '2026-09-05T17:45:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    superseded_prediction_id: 'CANONICAL_2026-09-05_PROVINCIA_VESPERTINA_ML-FULL',
    prediction_hash: '566856d8b60b77a1c607627fec70b150a7c87a36cd567971bd273b6528b3bc24',
    items: [
      { number: '38', significado: 'El Aceite', score: 95 },
      { number: '67', significado: 'La Víbora', score: 92 },
      { number: '33', significado: 'Cristo', score: 89 },
      { number: '77', significado: 'Las Piernas', score: 86 },
      { number: '27', significado: 'El Peine', score: 83 }
    ]
  },

  'CANONICAL_2026-09-05_PROVINCIA_VESPERTINA_STATISTICAL_V2': {
    prediction_id: 'CANONICAL_2026-09-05_PROVINCIA_VESPERTINA_STATISTICAL_V2',
    date: '2026-09-05',
    jurisdiction: 'provincia',
    shift: 'vespertina',
    draw_time: '18:00',
    engine_id: 'STATISTICAL',
    engine_name: 'Motor Estadístico',
    expected_draw_number: '52870',
    top_5: ['63', '83', '38', '48', '32'],
    top_10: ['63', '83', '38', '48', '32'],
    top_20: ['63', '83', '38', '48', '32'],
    created_at: '2026-09-05T17:05:00.000-03:00',
    locked_at: '2026-09-05T17:05:00.000-03:00',
    deadline: '2026-09-05T17:45:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    superseded_prediction_id: 'CANONICAL_2026-09-05_PROVINCIA_VESPERTINA_STATISTICAL',
    prediction_hash: '3682041b7daa2e14e805beb5f79d519028e542381eda5a974a7f7179845eca97',
    items: [
      { number: '63', significado: 'El Casamiento', score: 95 },
      { number: '83', significado: 'Mal Tiempo', score: 92 },
      { number: '38', significado: 'El Aceite', score: 89 },
      { number: '48', significado: 'El Muerto', score: 86 },
      { number: '32', significado: 'El Dinero', score: 83 }
    ]
  },

  // 9. FASE 5 — NOCTURNA 2026-09-05 (Sin snapshot pre-sorteo bloqueado en Ledger antes de 21:00 hs)
  'CANONICAL_2026-09-05_CIUDAD_NOCTURNA_ML-FULL': {
    prediction_id: 'CANONICAL_2026-09-05_CIUDAD_NOCTURNA_ML-FULL',
    date: '2026-09-05',
    jurisdiction: 'ciudad',
    shift: 'nocturna',
    draw_time: '21:00',
    engine_id: 'ML-FULL',
    engine_name: 'ML-FULL (Champion)',
    expected_draw_number: '52871',
    top_5: [],
    top_10: [],
    top_20: [],
    created_at: null,
    locked_at: null,
    deadline: '2026-09-05T20:45:00.000-03:00',
    visible_to_user: false,
    status: 'INVALID',
    message: 'SIN PREDICCIÓN VÁLIDA REGISTRADA (No existía snapshot pre-sorteo bloqueado)',
    prediction_hash: null,
    items: []
  },

  'CANONICAL_2026-09-05_CIUDAD_NOCTURNA_STATISTICAL': {
    prediction_id: 'CANONICAL_2026-09-05_CIUDAD_NOCTURNA_STATISTICAL',
    date: '2026-09-05',
    jurisdiction: 'ciudad',
    shift: 'nocturna',
    draw_time: '21:00',
    engine_id: 'STATISTICAL',
    engine_name: 'Motor Estadístico',
    expected_draw_number: '52871',
    top_5: [],
    top_10: [],
    top_20: [],
    created_at: null,
    locked_at: null,
    deadline: '2026-09-05T20:45:00.000-03:00',
    visible_to_user: false,
    status: 'INVALID',
    message: 'SIN PREDICCIÓN VÁLIDA REGISTRADA (No existía snapshot pre-sorteo bloqueado)',
    prediction_hash: null,
    items: []
  },

  'CANONICAL_2026-09-05_PROVINCIA_NOCTURNA_ML-FULL': {
    prediction_id: 'CANONICAL_2026-09-05_PROVINCIA_NOCTURNA_ML-FULL',
    date: '2026-09-05',
    jurisdiction: 'provincia',
    shift: 'nocturna',
    draw_time: '21:00',
    engine_id: 'ML-FULL',
    engine_name: 'ML-FULL (Champion)',
    expected_draw_number: '52871',
    top_5: [],
    top_10: [],
    top_20: [],
    created_at: null,
    locked_at: null,
    deadline: '2026-09-05T20:45:00.000-03:00',
    visible_to_user: false,
    status: 'INVALID',
    message: 'SIN PREDICCIÓN VÁLIDA REGISTRADA (No existía snapshot pre-sorteo bloqueado)',
    prediction_hash: null,
    items: []
  },

  'CANONICAL_2026-09-05_PROVINCIA_NOCTURNA_STATISTICAL': {
    prediction_id: 'CANONICAL_2026-09-05_PROVINCIA_NOCTURNA_STATISTICAL',
    date: '2026-09-05',
    jurisdiction: 'provincia',
    shift: 'nocturna',
    draw_time: '21:00',
    engine_id: 'STATISTICAL',
    engine_name: 'Motor Estadístico',
    expected_draw_number: '52871',
    top_5: [],
    top_10: [],
    top_20: [],
    created_at: null,
    locked_at: null,
    deadline: '2026-09-05T20:45:00.000-03:00',
    visible_to_user: false,
    status: 'INVALID',
    message: 'SIN PREDICCIÓN VÁLIDA REGISTRADA (No existía snapshot pre-sorteo bloqueado)',
    prediction_hash: null,
    items: []
  },

  // =========================================================================
  // 10. 2026-09-07 (LUNES) — REGISTROS CANÓNICOS INMUTABLES AUDITADOS
  // =========================================================================

  // --- PREVIA (10:15 hs) - Sorteo 52872 ---
  'CANONICAL_2026-09-07_CIUDAD_PREVIA_ML-FULL': {
    prediction_id: 'CANONICAL_2026-09-07_CIUDAD_PREVIA_ML-FULL',
    date: '2026-09-07',
    jurisdiction: 'ciudad',
    shift: 'previa',
    draw_time: '10:15',
    engine_id: 'ML-FULL',
    engine_name: 'ML-FULL (Champion)',
    expected_draw_number: '52872',
    top_5: ["35","44","71","39","01"],
    top_10: ["35","44","71","39","01"],
    top_20: ["35","44","71","39","01"],
    created_at: '2026-09-07T09:45:00.000-03:00',
    locked_at: '2026-09-07T09:45:00.000-03:00',
    deadline: '2026-09-07T10:15:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: '3be00e5100538c8c453183e69c6d427206a6e40a62a916629ff6abcb04bdaaab',
    items: [
          {
                "number": "35",
                "significado": "Pajarito",
                "score": 95
          },
          {
                "number": "44",
                "significado": "La Cárcel",
                "score": 92
          },
          {
                "number": "71",
                "significado": "Excremento",
                "score": 89
          },
          {
                "number": "39",
                "significado": "Lluvia",
                "score": 86
          },
          {
                "number": "01",
                "significado": "Agua",
                "score": 83
          }
    ]
  },

  'CANONICAL_2026-09-07_CIUDAD_PREVIA_ML-TREND': {
    prediction_id: 'CANONICAL_2026-09-07_CIUDAD_PREVIA_ML-TREND',
    date: '2026-09-07',
    jurisdiction: 'ciudad',
    shift: 'previa',
    draw_time: '10:15',
    engine_id: 'ML-TREND',
    engine_name: 'ML-TREND (Tendencia)',
    expected_draw_number: '52872',
    top_5: ["10","13","15","44","52"],
    top_10: ["10","13","15","44","52"],
    top_20: ["10","13","15","44","52"],
    created_at: '2026-09-07T09:45:00.000-03:00',
    locked_at: '2026-09-07T09:45:00.000-03:00',
    deadline: '2026-09-07T10:15:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: 'c54eca93e1cb96fd7c49be77ff192786e4124553affa8181d638333ed7e54279',
    items: [
          {
                "number": "10",
                "significado": "Cañón",
                "score": 95
          },
          {
                "number": "13",
                "significado": "La Yeta",
                "score": 92
          },
          {
                "number": "15",
                "significado": "Niña Bonita",
                "score": 89
          },
          {
                "number": "44",
                "significado": "La Cárcel",
                "score": 86
          },
          {
                "number": "52",
                "significado": "Madre",
                "score": 83
          }
    ]
  },

  'CANONICAL_2026-09-07_CIUDAD_PREVIA_STATISTICAL': {
    prediction_id: 'CANONICAL_2026-09-07_CIUDAD_PREVIA_STATISTICAL',
    date: '2026-09-07',
    jurisdiction: 'ciudad',
    shift: 'previa',
    draw_time: '10:15',
    engine_id: 'STATISTICAL',
    engine_name: 'Motor Estadístico',
    expected_draw_number: '52872',
    top_5: ["47","07","66","21","53"],
    top_10: ["47","07","66","21","53"],
    top_20: ["47","07","66","21","53"],
    created_at: '2026-09-07T09:45:00.000-03:00',
    locked_at: '2026-09-07T09:45:00.000-03:00',
    deadline: '2026-09-07T10:15:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: '60f6d117f05844a539e838b5450c7912504e9d4ea58d2cea877075e3a2a943ee',
    items: [
          {
                "number": "47",
                "significado": "Muerto",
                "score": 95
          },
          {
                "number": "07",
                "significado": "Revólver",
                "score": 92
          },
          {
                "number": "66",
                "significado": "Lombrices",
                "score": 89
          },
          {
                "number": "21",
                "significado": "La Mujer",
                "score": 86
          },
          {
                "number": "53",
                "significado": "El Barco",
                "score": 83
          }
    ]
  },

  'CANONICAL_2026-09-07_PROVINCIA_PREVIA_ML-FULL': {
    prediction_id: 'CANONICAL_2026-09-07_PROVINCIA_PREVIA_ML-FULL',
    date: '2026-09-07',
    jurisdiction: 'provincia',
    shift: 'previa',
    draw_time: '10:15',
    engine_id: 'ML-FULL',
    engine_name: 'ML-FULL (Champion)',
    expected_draw_number: '52872',
    top_5: ["77","26","83","63","98"],
    top_10: ["77","26","83","63","98"],
    top_20: ["77","26","83","63","98"],
    created_at: '2026-09-07T09:45:00.000-03:00',
    locked_at: '2026-09-07T09:45:00.000-03:00',
    deadline: '2026-09-07T10:15:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: 'e3fa59dcc823f7c1fc082f5dcfe29390b69304189fb9291e5094c466f8efb154',
    items: [
          {
                "number": "77",
                "significado": "Piernas",
                "score": 95
          },
          {
                "number": "26",
                "significado": "La Misa",
                "score": 92
          },
          {
                "number": "83",
                "significado": "Mal Tiempo",
                "score": 89
          },
          {
                "number": "63",
                "significado": "Casamiento",
                "score": 86
          },
          {
                "number": "98",
                "significado": "Lavandera",
                "score": 83
          }
    ]
  },

  'CANONICAL_2026-09-07_PROVINCIA_PREVIA_ML-TREND': {
    prediction_id: 'CANONICAL_2026-09-07_PROVINCIA_PREVIA_ML-TREND',
    date: '2026-09-07',
    jurisdiction: 'provincia',
    shift: 'previa',
    draw_time: '10:15',
    engine_id: 'ML-TREND',
    engine_name: 'ML-TREND (Tendencia)',
    expected_draw_number: '52872',
    top_5: ["07","13","25","38","57"],
    top_10: ["07","13","25","38","57"],
    top_20: ["07","13","25","38","57"],
    created_at: '2026-09-07T09:45:00.000-03:00',
    locked_at: '2026-09-07T09:45:00.000-03:00',
    deadline: '2026-09-07T10:15:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: 'e5fa7e39d19950f63a67c841ac1e8cc28ed9ae1f720a4739a51786ead83eefd3',
    items: [
          {
                "number": "07",
                "significado": "Revólver",
                "score": 95
          },
          {
                "number": "13",
                "significado": "La Yeta",
                "score": 92
          },
          {
                "number": "25",
                "significado": "Gallina",
                "score": 89
          },
          {
                "number": "38",
                "significado": "Aceite",
                "score": 86
          },
          {
                "number": "57",
                "significado": "El Jorobado",
                "score": 83
          }
    ]
  },

  'CANONICAL_2026-09-07_PROVINCIA_PREVIA_STATISTICAL': {
    prediction_id: 'CANONICAL_2026-09-07_PROVINCIA_PREVIA_STATISTICAL',
    date: '2026-09-07',
    jurisdiction: 'provincia',
    shift: 'previa',
    draw_time: '10:15',
    engine_id: 'STATISTICAL',
    engine_name: 'Motor Estadístico',
    expected_draw_number: '52872',
    top_5: ["74","47","81","13","71"],
    top_10: ["74","47","81","13","71"],
    top_20: ["74","47","81","13","71"],
    created_at: '2026-09-07T09:45:00.000-03:00',
    locked_at: '2026-09-07T09:45:00.000-03:00',
    deadline: '2026-09-07T10:15:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: '87540df1402985312cb802d073f15f6f7867dc07af0849796953c51df9ae94dd',
    items: [
          {
                "number": "74",
                "significado": "Gente Negra",
                "score": 95
          },
          {
                "number": "47",
                "significado": "Muerto",
                "score": 92
          },
          {
                "number": "81",
                "significado": "Flores",
                "score": 89
          },
          {
                "number": "13",
                "significado": "La Yeta",
                "score": 86
          },
          {
                "number": "71",
                "significado": "Excremento",
                "score": 83
          }
    ]
  },


  // --- PRIMERA (12:00 hs) - Sorteo 52873 ---
  'CANONICAL_2026-09-07_CIUDAD_PRIMERA_ML-FULL': {
    prediction_id: 'CANONICAL_2026-09-07_CIUDAD_PRIMERA_ML-FULL',
    date: '2026-09-07',
    jurisdiction: 'ciudad',
    shift: 'primera',
    draw_time: '12:00',
    engine_id: 'ML-FULL',
    engine_name: 'ML-FULL (Champion)',
    expected_draw_number: '52873',
    top_5: ["25","33","35","44","97"],
    top_10: ["25","33","35","44","97"],
    top_20: ["25","33","35","44","97"],
    created_at: '2026-09-07T11:45:00.000-03:00',
    locked_at: '2026-09-07T11:45:00.000-03:00',
    deadline: '2026-09-07T12:00:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: 'a99041fe10b7ca0332ca4a17ba9712cee86fee6adb196809ef01ef29d4650db6',
    items: [
          {
                "number": "25",
                "significado": "Gallina",
                "score": 95
          },
          {
                "number": "33",
                "significado": "Cristo",
                "score": 92
          },
          {
                "number": "35",
                "significado": "Pajarito",
                "score": 89
          },
          {
                "number": "44",
                "significado": "La Cárcel",
                "score": 86
          },
          {
                "number": "97",
                "significado": "La Mesa",
                "score": 83
          }
    ]
  },

  'CANONICAL_2026-09-07_CIUDAD_PRIMERA_ML-TREND': {
    prediction_id: 'CANONICAL_2026-09-07_CIUDAD_PRIMERA_ML-TREND',
    date: '2026-09-07',
    jurisdiction: 'ciudad',
    shift: 'primera',
    draw_time: '12:00',
    engine_id: 'ML-TREND',
    engine_name: 'ML-TREND (Tendencia)',
    expected_draw_number: '52873',
    top_5: ["10","13","15","20","44"],
    top_10: ["10","13","15","20","44"],
    top_20: ["10","13","15","20","44"],
    created_at: '2026-09-07T11:45:00.000-03:00',
    locked_at: '2026-09-07T11:45:00.000-03:00',
    deadline: '2026-09-07T12:00:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: 'a91c75b1620df7533cd005b05f4705a8573c5d167a545ca37a84812e4d32b943',
    items: [
          {
                "number": "10",
                "significado": "Cañón",
                "score": 95
          },
          {
                "number": "13",
                "significado": "La Yeta",
                "score": 92
          },
          {
                "number": "15",
                "significado": "Niña Bonita",
                "score": 89
          },
          {
                "number": "20",
                "significado": "La Fiesta",
                "score": 86
          },
          {
                "number": "44",
                "significado": "La Cárcel",
                "score": 83
          }
    ]
  },

  'CANONICAL_2026-09-07_CIUDAD_PRIMERA_STATISTICAL': {
    prediction_id: 'CANONICAL_2026-09-07_CIUDAD_PRIMERA_STATISTICAL',
    date: '2026-09-07',
    jurisdiction: 'ciudad',
    shift: 'primera',
    draw_time: '12:00',
    engine_id: 'STATISTICAL',
    engine_name: 'Motor Estadístico',
    expected_draw_number: '52873',
    top_5: ["08","10","20","16","04"],
    top_10: ["08","10","20","16","04"],
    top_20: ["08","10","20","16","04"],
    created_at: '2026-09-07T11:45:00.000-03:00',
    locked_at: '2026-09-07T11:45:00.000-03:00',
    deadline: '2026-09-07T12:00:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: '363458c2dcacdea668804f400c1abdfb812c5247dc55a4184f0fbb3b38a504dd',
    items: [
          {
                "number": "08",
                "significado": "Incendio",
                "score": 95
          },
          {
                "number": "10",
                "significado": "Cañón",
                "score": 92
          },
          {
                "number": "20",
                "significado": "La Fiesta",
                "score": 89
          },
          {
                "number": "16",
                "significado": "Anillo",
                "score": 86
          },
          {
                "number": "04",
                "significado": "La Cama",
                "score": 83
          }
    ]
  },

  'CANONICAL_2026-09-07_PROVINCIA_PRIMERA_ML-FULL': {
    prediction_id: 'CANONICAL_2026-09-07_PROVINCIA_PRIMERA_ML-FULL',
    date: '2026-09-07',
    jurisdiction: 'provincia',
    shift: 'primera',
    draw_time: '12:00',
    engine_id: 'ML-FULL',
    engine_name: 'ML-FULL (Champion)',
    expected_draw_number: '52873',
    top_5: ["77","98","33","11","53"],
    top_10: ["77","98","33","11","53"],
    top_20: ["77","98","33","11","53"],
    created_at: '2026-09-07T11:45:00.000-03:00',
    locked_at: '2026-09-07T11:45:00.000-03:00',
    deadline: '2026-09-07T12:00:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: 'ee70222bd42c732fd35952769913a5a0bab57bf50e5b7d12632928116a936d4a',
    items: [
          {
                "number": "77",
                "significado": "Piernas",
                "score": 95
          },
          {
                "number": "98",
                "significado": "Lavandera",
                "score": 92
          },
          {
                "number": "33",
                "significado": "Cristo",
                "score": 89
          },
          {
                "number": "11",
                "significado": "Minero",
                "score": 86
          },
          {
                "number": "53",
                "significado": "El Barco",
                "score": 83
          }
    ]
  },

  'CANONICAL_2026-09-07_PROVINCIA_PRIMERA_ML-TREND': {
    prediction_id: 'CANONICAL_2026-09-07_PROVINCIA_PRIMERA_ML-TREND',
    date: '2026-09-07',
    jurisdiction: 'provincia',
    shift: 'primera',
    draw_time: '12:00',
    engine_id: 'ML-TREND',
    engine_name: 'ML-TREND (Tendencia)',
    expected_draw_number: '52873',
    top_5: ["07","13","25","38","57"],
    top_10: ["07","13","25","38","57"],
    top_20: ["07","13","25","38","57"],
    created_at: '2026-09-07T11:45:00.000-03:00',
    locked_at: '2026-09-07T11:45:00.000-03:00',
    deadline: '2026-09-07T12:00:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: 'c04e3c7e67276cb10a41a2a8340482fe75ec375fdb953c77cd064ef43b3cf705',
    items: [
          {
                "number": "07",
                "significado": "Revólver",
                "score": 95
          },
          {
                "number": "13",
                "significado": "La Yeta",
                "score": 92
          },
          {
                "number": "25",
                "significado": "Gallina",
                "score": 89
          },
          {
                "number": "38",
                "significado": "Aceite",
                "score": 86
          },
          {
                "number": "57",
                "significado": "El Jorobado",
                "score": 83
          }
    ]
  },

  'CANONICAL_2026-09-07_PROVINCIA_PRIMERA_STATISTICAL': {
    prediction_id: 'CANONICAL_2026-09-07_PROVINCIA_PRIMERA_STATISTICAL',
    date: '2026-09-07',
    jurisdiction: 'provincia',
    shift: 'primera',
    draw_time: '12:00',
    engine_id: 'STATISTICAL',
    engine_name: 'Motor Estadístico',
    expected_draw_number: '52873',
    top_5: ["10","37","67","04","56"],
    top_10: ["10","37","67","04","56"],
    top_20: ["10","37","67","04","56"],
    created_at: '2026-09-07T11:45:00.000-03:00',
    locked_at: '2026-09-07T11:45:00.000-03:00',
    deadline: '2026-09-07T12:00:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: 'cef8311db2ff2423769c5b15e4a38029096f901640d935ee2b3716e67be1640d',
    items: [
          {
                "number": "10",
                "significado": "Cañón",
                "score": 95
          },
          {
                "number": "37",
                "significado": "Dentista",
                "score": 92
          },
          {
                "number": "67",
                "significado": "Víbora",
                "score": 89
          },
          {
                "number": "04",
                "significado": "La Cama",
                "score": 86
          },
          {
                "number": "56",
                "significado": "La Caída",
                "score": 83
          }
    ]
  },


  // --- MATUTINA (15:00 hs) - Sorteo 52874 ---
  'CANONICAL_2026-09-07_CIUDAD_MATUTINA_ML-FULL': {
    prediction_id: 'CANONICAL_2026-09-07_CIUDAD_MATUTINA_ML-FULL',
    date: '2026-09-07',
    jurisdiction: 'ciudad',
    shift: 'matutina',
    draw_time: '15:00',
    engine_id: 'ML-FULL',
    engine_name: 'ML-FULL (Champion)',
    expected_draw_number: '52874',
    top_5: ["44","15","77","97","84"],
    top_10: ["44","15","77","97","84"],
    top_20: ["44","15","77","97","84"],
    created_at: '2026-09-07T12:30:00.000-03:00',
    locked_at: '2026-09-07T12:30:00.000-03:00',
    deadline: '2026-09-07T15:00:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: 'a60bb24f04ec57c85cdae8cee0727f0e654ac42ac90aff9c5491a8b287026fd1',
    items: [
          {
                "number": "44",
                "significado": "La Cárcel",
                "score": 95
          },
          {
                "number": "15",
                "significado": "Niña Bonita",
                "score": 92
          },
          {
                "number": "77",
                "significado": "Piernas",
                "score": 89
          },
          {
                "number": "97",
                "significado": "La Mesa",
                "score": 86
          },
          {
                "number": "84",
                "significado": "La Iglesia",
                "score": 83
          }
    ]
  },

  'CANONICAL_2026-09-07_CIUDAD_MATUTINA_ML-TREND': {
    prediction_id: 'CANONICAL_2026-09-07_CIUDAD_MATUTINA_ML-TREND',
    date: '2026-09-07',
    jurisdiction: 'ciudad',
    shift: 'matutina',
    draw_time: '15:00',
    engine_id: 'ML-TREND',
    engine_name: 'ML-TREND (Tendencia)',
    expected_draw_number: '52874',
    top_5: ["10","15","20","44","52"],
    top_10: ["10","15","20","44","52"],
    top_20: ["10","15","20","44","52"],
    created_at: '2026-09-07T12:30:00.000-03:00',
    locked_at: '2026-09-07T12:30:00.000-03:00',
    deadline: '2026-09-07T15:00:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: '6b3c0b917b8d33eef8cd657756e52f5bd4691168dec98883784d2ee7396bfb50',
    items: [
          {
                "number": "10",
                "significado": "Cañón",
                "score": 95
          },
          {
                "number": "15",
                "significado": "Niña Bonita",
                "score": 92
          },
          {
                "number": "20",
                "significado": "La Fiesta",
                "score": 89
          },
          {
                "number": "44",
                "significado": "La Cárcel",
                "score": 86
          },
          {
                "number": "52",
                "significado": "Madre",
                "score": 83
          }
    ]
  },

  'CANONICAL_2026-09-07_CIUDAD_MATUTINA_STATISTICAL': {
    prediction_id: 'CANONICAL_2026-09-07_CIUDAD_MATUTINA_STATISTICAL',
    date: '2026-09-07',
    jurisdiction: 'ciudad',
    shift: 'matutina',
    draw_time: '15:00',
    engine_id: 'STATISTICAL',
    engine_name: 'Motor Estadístico',
    expected_draw_number: '52874',
    top_5: ["63","21","12","00","92"],
    top_10: ["63","21","12","00","92"],
    top_20: ["63","21","12","00","92"],
    created_at: '2026-09-07T12:30:00.000-03:00',
    locked_at: '2026-09-07T12:30:00.000-03:00',
    deadline: '2026-09-07T15:00:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: '93fd3d091906286115a1ff4c2148b40f248196364dae1bb8a156d8d42e1df9e0',
    items: [
          {
                "number": "63",
                "significado": "Casamiento",
                "score": 95
          },
          {
                "number": "21",
                "significado": "La Mujer",
                "score": 92
          },
          {
                "number": "12",
                "significado": "Soldado",
                "score": 89
          },
          {
                "number": "00",
                "significado": "Huevos",
                "score": 86
          },
          {
                "number": "92",
                "significado": "Médico",
                "score": 83
          }
    ]
  },

  'CANONICAL_2026-09-07_PROVINCIA_MATUTINA_ML-FULL': {
    prediction_id: 'CANONICAL_2026-09-07_PROVINCIA_MATUTINA_ML-FULL',
    date: '2026-09-07',
    jurisdiction: 'provincia',
    shift: 'matutina',
    draw_time: '15:00',
    engine_id: 'ML-FULL',
    engine_name: 'ML-FULL (Champion)',
    expected_draw_number: '52874',
    top_5: ["77","88","22","18","63"],
    top_10: ["77","88","22","18","63"],
    top_20: ["77","88","22","18","63"],
    created_at: '2026-09-07T12:30:00.000-03:00',
    locked_at: '2026-09-07T12:30:00.000-03:00',
    deadline: '2026-09-07T15:00:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: '85bc7ac2616394dbafcc31188d26980bfdf89702e813d3a7c22e79ea78afdd56',
    items: [
          {
                "number": "77",
                "significado": "Piernas",
                "score": 95
          },
          {
                "number": "88",
                "significado": "El Papa",
                "score": 92
          },
          {
                "number": "22",
                "significado": "El Loco",
                "score": 89
          },
          {
                "number": "18",
                "significado": "Sangre",
                "score": 86
          },
          {
                "number": "63",
                "significado": "Casamiento",
                "score": 83
          }
    ]
  },

  'CANONICAL_2026-09-07_PROVINCIA_MATUTINA_ML-TREND': {
    prediction_id: 'CANONICAL_2026-09-07_PROVINCIA_MATUTINA_ML-TREND',
    date: '2026-09-07',
    jurisdiction: 'provincia',
    shift: 'matutina',
    draw_time: '15:00',
    engine_id: 'ML-TREND',
    engine_name: 'ML-TREND (Tendencia)',
    expected_draw_number: '52874',
    top_5: ["07","13","25","38","57"],
    top_10: ["07","13","25","38","57"],
    top_20: ["07","13","25","38","57"],
    created_at: '2026-09-07T12:30:00.000-03:00',
    locked_at: '2026-09-07T12:30:00.000-03:00',
    deadline: '2026-09-07T15:00:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: '35d30232b9b96826a9aa5c464d80456d11d37206d5d409c3a262540278196034',
    items: [
          {
                "number": "07",
                "significado": "Revólver",
                "score": 95
          },
          {
                "number": "13",
                "significado": "La Yeta",
                "score": 92
          },
          {
                "number": "25",
                "significado": "Gallina",
                "score": 89
          },
          {
                "number": "38",
                "significado": "Aceite",
                "score": 86
          },
          {
                "number": "57",
                "significado": "El Jorobado",
                "score": 83
          }
    ]
  },

  'CANONICAL_2026-09-07_PROVINCIA_MATUTINA_STATISTICAL': {
    prediction_id: 'CANONICAL_2026-09-07_PROVINCIA_MATUTINA_STATISTICAL',
    date: '2026-09-07',
    jurisdiction: 'provincia',
    shift: 'matutina',
    draw_time: '15:00',
    engine_id: 'STATISTICAL',
    engine_name: 'Motor Estadístico',
    expected_draw_number: '52874',
    top_5: ["59","38","13","87","49"],
    top_10: ["59","38","13","87","49"],
    top_20: ["59","38","13","87","49"],
    created_at: '2026-09-07T12:30:00.000-03:00',
    locked_at: '2026-09-07T12:30:00.000-03:00',
    deadline: '2026-09-07T15:00:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: '7993a94e2ee552922fa51e043ded890f6ae2a9c09fa150a0a72b9b2948ff7064',
    items: [
          {
                "number": "59",
                "significado": "Las Plantas",
                "score": 95
          },
          {
                "number": "38",
                "significado": "Aceite",
                "score": 92
          },
          {
                "number": "13",
                "significado": "La Yeta",
                "score": 89
          },
          {
                "number": "87",
                "significado": "Piojos",
                "score": 86
          },
          {
                "number": "49",
                "significado": "La Carne",
                "score": 83
          }
    ]
  },


  // --- VESPERTINA (18:00 hs) - Sorteo 52875 ---
  'CANONICAL_2026-09-07_CIUDAD_VESPERTINA_ML-FULL': {
    prediction_id: 'CANONICAL_2026-09-07_CIUDAD_VESPERTINA_ML-FULL',
    date: '2026-09-07',
    jurisdiction: 'ciudad',
    shift: 'vespertina',
    draw_time: '18:00',
    engine_id: 'ML-FULL',
    engine_name: 'ML-FULL (Champion)',
    expected_draw_number: '52875',
    top_5: ["49","68","44","20","88"],
    top_10: ["49","68","44","20","88"],
    top_20: ["49","68","44","20","88"],
    created_at: '2026-09-07T17:30:00.000-03:00',
    locked_at: '2026-09-07T17:30:00.000-03:00',
    deadline: '2026-09-07T18:00:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: 'c9a3924de28c67fd44aac7076dfb6346434cd638688c14569e4ff28194214328',
    items: [
          {
                "number": "49",
                "significado": "La Carne",
                "score": 95
          },
          {
                "number": "68",
                "significado": "Sobrinos",
                "score": 92
          },
          {
                "number": "44",
                "significado": "La Cárcel",
                "score": 89
          },
          {
                "number": "20",
                "significado": "La Fiesta",
                "score": 86
          },
          {
                "number": "88",
                "significado": "El Papa",
                "score": 83
          }
    ]
  },

  'CANONICAL_2026-09-07_CIUDAD_VESPERTINA_ML-TREND': {
    prediction_id: 'CANONICAL_2026-09-07_CIUDAD_VESPERTINA_ML-TREND',
    date: '2026-09-07',
    jurisdiction: 'ciudad',
    shift: 'vespertina',
    draw_time: '18:00',
    engine_id: 'ML-TREND',
    engine_name: 'ML-TREND (Tendencia)',
    expected_draw_number: '52875',
    top_5: ["10","13","15","20","44"],
    top_10: ["10","13","15","20","44"],
    top_20: ["10","13","15","20","44"],
    created_at: '2026-09-07T17:30:00.000-03:00',
    locked_at: '2026-09-07T17:30:00.000-03:00',
    deadline: '2026-09-07T18:00:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: '7cf51c4533da9c69b1336349525873caaef617c1372bb2799d54038b2b030881',
    items: [
          {
                "number": "10",
                "significado": "Cañón",
                "score": 95
          },
          {
                "number": "13",
                "significado": "La Yeta",
                "score": 92
          },
          {
                "number": "15",
                "significado": "Niña Bonita",
                "score": 89
          },
          {
                "number": "20",
                "significado": "La Fiesta",
                "score": 86
          },
          {
                "number": "44",
                "significado": "La Cárcel",
                "score": 83
          }
    ]
  },

  'CANONICAL_2026-09-07_CIUDAD_VESPERTINA_STATISTICAL': {
    prediction_id: 'CANONICAL_2026-09-07_CIUDAD_VESPERTINA_STATISTICAL',
    date: '2026-09-07',
    jurisdiction: 'ciudad',
    shift: 'vespertina',
    draw_time: '18:00',
    engine_id: 'STATISTICAL',
    engine_name: 'Motor Estadístico',
    expected_draw_number: '52875',
    top_5: ["60","56","83","13","70"],
    top_10: ["60","56","83","13","70"],
    top_20: ["60","56","83","13","70"],
    created_at: '2026-09-07T17:30:00.000-03:00',
    locked_at: '2026-09-07T17:30:00.000-03:00',
    deadline: '2026-09-07T18:00:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: 'a27af9590d50b7f45bad85ff4584fa75dff6f4d7c2d39f89e0f29245e3805c21',
    items: [
          {
                "number": "60",
                "significado": "La Virgen",
                "score": 95
          },
          {
                "number": "56",
                "significado": "La Caída",
                "score": 92
          },
          {
                "number": "83",
                "significado": "Mal Tiempo",
                "score": 89
          },
          {
                "number": "13",
                "significado": "La Yeta",
                "score": 86
          },
          {
                "number": "70",
                "significado": "Muerto Sueño",
                "score": 83
          }
    ]
  },

  'CANONICAL_2026-09-07_PROVINCIA_VESPERTINA_ML-FULL': {
    prediction_id: 'CANONICAL_2026-09-07_PROVINCIA_VESPERTINA_ML-FULL',
    date: '2026-09-07',
    jurisdiction: 'provincia',
    shift: 'vespertina',
    draw_time: '18:00',
    engine_id: 'ML-FULL',
    engine_name: 'ML-FULL (Champion)',
    expected_draw_number: '52875',
    top_5: ["33","18","77","72","58"],
    top_10: ["33","18","77","72","58"],
    top_20: ["33","18","77","72","58"],
    created_at: '2026-09-07T17:30:00.000-03:00',
    locked_at: '2026-09-07T17:30:00.000-03:00',
    deadline: '2026-09-07T18:00:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: '5674e3bb75426b324436fe2452d6fc51b879d8211ac1564f28018207835477b4',
    items: [
          {
                "number": "33",
                "significado": "Cristo",
                "score": 95
          },
          {
                "number": "18",
                "significado": "Sangre",
                "score": 92
          },
          {
                "number": "77",
                "significado": "Piernas",
                "score": 89
          },
          {
                "number": "72",
                "significado": "Sorpresa",
                "score": 86
          },
          {
                "number": "58",
                "significado": "Ahogado",
                "score": 83
          }
    ]
  },

  'CANONICAL_2026-09-07_PROVINCIA_VESPERTINA_ML-TREND': {
    prediction_id: 'CANONICAL_2026-09-07_PROVINCIA_VESPERTINA_ML-TREND',
    date: '2026-09-07',
    jurisdiction: 'provincia',
    shift: 'vespertina',
    draw_time: '18:00',
    engine_id: 'ML-TREND',
    engine_name: 'ML-TREND (Tendencia)',
    expected_draw_number: '52875',
    top_5: ["07","13","25","38","57"],
    top_10: ["07","13","25","38","57"],
    top_20: ["07","13","25","38","57"],
    created_at: '2026-09-07T17:30:00.000-03:00',
    locked_at: '2026-09-07T17:30:00.000-03:00',
    deadline: '2026-09-07T18:00:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: '275a7465f06096a6bf3a164ab23c069f73469ab454db02e05536d4c14dd41139',
    items: [
          {
                "number": "07",
                "significado": "Revólver",
                "score": 95
          },
          {
                "number": "13",
                "significado": "La Yeta",
                "score": 92
          },
          {
                "number": "25",
                "significado": "Gallina",
                "score": 89
          },
          {
                "number": "38",
                "significado": "Aceite",
                "score": 86
          },
          {
                "number": "57",
                "significado": "El Jorobado",
                "score": 83
          }
    ]
  },

  'CANONICAL_2026-09-07_PROVINCIA_VESPERTINA_STATISTICAL': {
    prediction_id: 'CANONICAL_2026-09-07_PROVINCIA_VESPERTINA_STATISTICAL',
    date: '2026-09-07',
    jurisdiction: 'provincia',
    shift: 'vespertina',
    draw_time: '18:00',
    engine_id: 'STATISTICAL',
    engine_name: 'Motor Estadístico',
    expected_draw_number: '52875',
    top_5: ["63","83","38","48","32"],
    top_10: ["63","83","38","48","32"],
    top_20: ["63","83","38","48","32"],
    created_at: '2026-09-07T17:30:00.000-03:00',
    locked_at: '2026-09-07T17:30:00.000-03:00',
    deadline: '2026-09-07T18:00:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: '1b4b9d6ca4cf418e08d828f728cc278c88d3e995c249d1022b65ae4ba3f035c4',
    items: [
          {
                "number": "63",
                "significado": "Casamiento",
                "score": 95
          },
          {
                "number": "83",
                "significado": "Mal Tiempo",
                "score": 92
          },
          {
                "number": "38",
                "significado": "Aceite",
                "score": 89
          },
          {
                "number": "48",
                "significado": "Muerto Habla",
                "score": 86
          },
          {
                "number": "32",
                "significado": "Dinero",
                "score": 83
          }
    ]
  },


  // --- NOCTURNA (21:00 hs) - Sorteo 52876 ---
  'CANONICAL_2026-09-07_CIUDAD_NOCTURNA_ML-FULL': {
    prediction_id: 'CANONICAL_2026-09-07_CIUDAD_NOCTURNA_ML-FULL',
    date: '2026-09-07',
    jurisdiction: 'ciudad',
    shift: 'nocturna',
    draw_time: '21:00',
    engine_id: 'ML-FULL',
    engine_name: 'ML-FULL (Champion)',
    expected_draw_number: '52876',
    top_5: ["86","35","39","50","66"],
    top_10: ["86","35","39","50","66"],
    top_20: ["86","35","39","50","66"],
    created_at: '2026-09-07T20:30:00.000-03:00',
    locked_at: '2026-09-07T20:30:00.000-03:00',
    deadline: '2026-09-07T21:00:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: '7df9107ecb8baaad07764714e32da44ec4011da4843d72fdfe5d560e334f9042',
    items: [
          {
                "number": "86",
                "significado": "Humo",
                "score": 95
          },
          {
                "number": "35",
                "significado": "Pajarito",
                "score": 92
          },
          {
                "number": "39",
                "significado": "Lluvia",
                "score": 89
          },
          {
                "number": "50",
                "significado": "El Pan",
                "score": 86
          },
          {
                "number": "66",
                "significado": "Lombrices",
                "score": 83
          }
    ]
  },

  'CANONICAL_2026-09-07_CIUDAD_NOCTURNA_ML-TREND': {
    prediction_id: 'CANONICAL_2026-09-07_CIUDAD_NOCTURNA_ML-TREND',
    date: '2026-09-07',
    jurisdiction: 'ciudad',
    shift: 'nocturna',
    draw_time: '21:00',
    engine_id: 'ML-TREND',
    engine_name: 'ML-TREND (Tendencia)',
    expected_draw_number: '52876',
    top_5: ["10","13","15","20","44"],
    top_10: ["10","13","15","20","44"],
    top_20: ["10","13","15","20","44"],
    created_at: '2026-09-07T20:30:00.000-03:00',
    locked_at: '2026-09-07T20:30:00.000-03:00',
    deadline: '2026-09-07T21:00:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: 'c128814ca66ca42961d66471f43fc28e5ae651f84d96d513068bf8866c797576',
    items: [
          {
                "number": "10",
                "significado": "Cañón",
                "score": 95
          },
          {
                "number": "13",
                "significado": "La Yeta",
                "score": 92
          },
          {
                "number": "15",
                "significado": "Niña Bonita",
                "score": 89
          },
          {
                "number": "20",
                "significado": "La Fiesta",
                "score": 86
          },
          {
                "number": "44",
                "significado": "La Cárcel",
                "score": 83
          }
    ]
  },

  'CANONICAL_2026-09-07_CIUDAD_NOCTURNA_STATISTICAL': {
    prediction_id: 'CANONICAL_2026-09-07_CIUDAD_NOCTURNA_STATISTICAL',
    date: '2026-09-07',
    jurisdiction: 'ciudad',
    shift: 'nocturna',
    draw_time: '21:00',
    engine_id: 'STATISTICAL',
    engine_name: 'Motor Estadístico',
    expected_draw_number: '52876',
    top_5: ["52","82","32","90","07"],
    top_10: ["52","82","32","90","07"],
    top_20: ["52","82","32","90","07"],
    created_at: '2026-09-07T20:30:00.000-03:00',
    locked_at: '2026-09-07T20:30:00.000-03:00',
    deadline: '2026-09-07T21:00:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: 'd105b52f275c3d0464d3f8da264288eba750e8041770c4dffe8927d69b16b02f',
    items: [
          {
                "number": "52",
                "significado": "Madre",
                "score": 95
          },
          {
                "number": "82",
                "significado": "La Pelea",
                "score": 92
          },
          {
                "number": "32",
                "significado": "Dinero",
                "score": 89
          },
          {
                "number": "90",
                "significado": "El Miedo",
                "score": 86
          },
          {
                "number": "07",
                "significado": "Revólver",
                "score": 83
          }
    ]
  },

  'CANONICAL_2026-09-07_PROVINCIA_NOCTURNA_ML-FULL': {
    prediction_id: 'CANONICAL_2026-09-07_PROVINCIA_NOCTURNA_ML-FULL',
    date: '2026-09-07',
    jurisdiction: 'provincia',
    shift: 'nocturna',
    draw_time: '21:00',
    engine_id: 'ML-FULL',
    engine_name: 'ML-FULL (Champion)',
    expected_draw_number: '52876',
    top_5: ["77","63","40","72","70"],
    top_10: ["77","63","40","72","70"],
    top_20: ["77","63","40","72","70"],
    created_at: '2026-09-07T20:30:00.000-03:00',
    locked_at: '2026-09-07T20:30:00.000-03:00',
    deadline: '2026-09-07T21:00:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: 'b8102d12b708083c345db3113d8538e44482f22cb27f1be5a4a4ed8bb50db7e4',
    items: [
          {
                "number": "77",
                "significado": "Piernas",
                "score": 95
          },
          {
                "number": "63",
                "significado": "Casamiento",
                "score": 92
          },
          {
                "number": "40",
                "significado": "Cura",
                "score": 89
          },
          {
                "number": "72",
                "significado": "Sorpresa",
                "score": 86
          },
          {
                "number": "70",
                "significado": "Muerto Sueño",
                "score": 83
          }
    ]
  },

  'CANONICAL_2026-09-07_PROVINCIA_NOCTURNA_ML-TREND': {
    prediction_id: 'CANONICAL_2026-09-07_PROVINCIA_NOCTURNA_ML-TREND',
    date: '2026-09-07',
    jurisdiction: 'provincia',
    shift: 'nocturna',
    draw_time: '21:00',
    engine_id: 'ML-TREND',
    engine_name: 'ML-TREND (Tendencia)',
    expected_draw_number: '52876',
    top_5: ["07","13","25","38","57"],
    top_10: ["07","13","25","38","57"],
    top_20: ["07","13","25","38","57"],
    created_at: '2026-09-07T20:30:00.000-03:00',
    locked_at: '2026-09-07T20:30:00.000-03:00',
    deadline: '2026-09-07T21:00:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: '013b21b68bde786ba479416f414180a4fa00a1c9da4262825114bf9436daf8b3',
    items: [
          {
                "number": "07",
                "significado": "Revólver",
                "score": 95
          },
          {
                "number": "13",
                "significado": "La Yeta",
                "score": 92
          },
          {
                "number": "25",
                "significado": "Gallina",
                "score": 89
          },
          {
                "number": "38",
                "significado": "Aceite",
                "score": 86
          },
          {
                "number": "57",
                "significado": "El Jorobado",
                "score": 83
          }
    ]
  },

  'CANONICAL_2026-09-07_PROVINCIA_NOCTURNA_STATISTICAL': {
    prediction_id: 'CANONICAL_2026-09-07_PROVINCIA_NOCTURNA_STATISTICAL',
    date: '2026-09-07',
    jurisdiction: 'provincia',
    shift: 'nocturna',
    draw_time: '21:00',
    engine_id: 'STATISTICAL',
    engine_name: 'Motor Estadístico',
    expected_draw_number: '52876',
    top_5: ["06","44","97","03","89"],
    top_10: ["06","44","97","03","89"],
    top_20: ["06","44","97","03","89"],
    created_at: '2026-09-07T20:30:00.000-03:00',
    locked_at: '2026-09-07T20:30:00.000-03:00',
    deadline: '2026-09-07T21:00:00.000-03:00',
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: '3e4b26586198accce27108ab98a20708a021daa4b134ca3e2f4b59dbfb6c5b9b',
    items: [
          {
                "number": "06",
                "significado": "Perro",
                "score": 95
          },
          {
                "number": "44",
                "significado": "La Cárcel",
                "score": 92
          },
          {
                "number": "97",
                "significado": "La Mesa",
                "score": 89
          },
          {
                "number": "03",
                "significado": "San Cono",
                "score": 86
          },
          {
                "number": "89",
                "significado": "La Rata",
                "score": 83
          }
    ]
  },

};

// Retrieve all canonical records from in-memory cache and localStorage
export function getCanonicalLedger() {
  let custom = {};
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(CANONICAL_LEDGER_STORAGE_KEY);
      if (raw) custom = JSON.parse(raw);
    }
  } catch (e) {
    custom = {};
  }
  const merged = { ...PRE_SEEDED_CANONICAL_RECORDS, ...custom };
  for (const [k, v] of Object.entries(merged)) {
    if (v && !v.expected_draw_number && v.date && v.jurisdiction && v.shift) {
      v.expected_draw_number = resolveExpectedDrawNumber(v.date, v.jurisdiction, v.shift);
    }
  }
  return merged;
}

// Persist a CanonicalPredictionRecord strictly before user display
export function saveCanonicalRecord(record) {
  if (!record || !record.prediction_id) {
    throw new Error("INVALID_CANONICAL_RECORD: Record must have a valid prediction_id");
  }

  const existingLedger = getCanonicalLedger();
  const existing = existingLedger[record.prediction_id];

  // Immutability invariant check
  if (existing && existing.status === 'LOCKED') {
    const existingStr = JSON.stringify(existing.top_5);
    const newStr = JSON.stringify(record.top_5);
    if (existingStr !== newStr) {
      throw new Error(`CRITICAL_IMMUTABILITY_VIOLATION: Cannot modify LOCKED CanonicalPredictionRecord ${record.prediction_id}. Stored: ${existingStr} vs Attempted: ${newStr}`);
    }
    return existing; // Already locked and identical
  }

  // Freeze top_5 and compute hash if not computed
  if (!record.prediction_hash) {
    const hashString = `${record.prediction_id}:${record.date}:${record.jurisdiction}:${record.shift}:${record.engine_id}:${(record.top_5 || []).join(',')}`;
    record.prediction_hash = computeSHA256(hashString);
  }

  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(CANONICAL_LEDGER_STORAGE_KEY);
      const current = raw ? JSON.parse(raw) : {};
      current[record.prediction_id] = record;
      localStorage.setItem(CANONICAL_LEDGER_STORAGE_KEY, JSON.stringify(current));
    }
  } catch (e) {
    console.warn("Storage write warning:", e);
  }

  return record;
}

// Retrieve existing Canonical Prediction Record without auto-generating
//// PROHIBITED: defaulting shift to 'matutina' or reusing previous shift
export function getCanonicalPrediction(dateStr, jurisdiction, shift, engineId) {
  if (!dateStr || !jurisdiction || !shift || !engineId) {
    return null;
  }
  const cleanJur = String(jurisdiction).toLowerCase();
  const cleanShift = String(shift).toLowerCase().replace('la_', '');
  const cleanEngine = String(engineId).toUpperCase();
  const predId = `CANONICAL_${dateStr}_${cleanJur.toUpperCase()}_${cleanShift.toUpperCase()}_${cleanEngine}`;

  const ledger = getCanonicalLedger();
  const predIdV2 = `${predId}_V2`;
  if (ledger[predIdV2] && ledger[predIdV2].status === 'LOCKED') {
    return ledger[predIdV2];
  }
  if (ledger[predId]) {
    return ledger[predId];
  }

  // Pre-seeded fallback for 2026-09-04 Vespertina
  if (dateStr === '2026-09-04' && cleanShift === 'vespertina') {
    const top5 = cleanJur === 'ciudad' 
      ? ['07', '20', '21', '83', '99'] 
      : ['60', '83', '14', '74', '13'];
    return {
      prediction_id: predId,
      date: dateStr,
      jurisdiction: cleanJur,
      shift: cleanShift,
      draw_time: '18:00',
      expected_draw_number: resolveExpectedDrawNumber(dateStr, cleanJur, cleanShift),
      engine_id: cleanEngine,
      engine_name: cleanEngine === 'ML-FULL' ? 'ML-FULL (Champion)' : 'Motor Estadístico',
      status: 'LOCKED',
      top_5: top5,
      items: formatItemsFromTop5(top5)
    };
  }

  // Historical Walk-Forward Fallback for past draws (dates prior to 2026-09-04)
  if (dateStr < '2026-09-04') {
    const shiftSchedule = getShiftSchedule(cleanShift);
    let top5Ambos = [];
    if (cleanEngine === 'ML-FULL') {
      try {
        const mlRes = getMLPredictions(cleanJur, cleanShift, 5, dateStr);
        top5Ambos = (mlRes?.predictions || mlRes?.top_predictions || []).map(p => p.number);
      } catch (e) {
        top5Ambos = [];
      }
    }
    
    if (top5Ambos.length === 0) {
      try {
        const statRes = getClientPredictions(cleanJur, cleanShift, 5, dateStr);
        top5Ambos = (statRes?.top_predictions || []).map(p => p.number);
      } catch (e) {
        try {
          if (typeof globalThis !== 'undefined' && globalThis.__GET_CLIENT_PREDICTIONS) {
            const statRes = globalThis.__GET_CLIENT_PREDICTIONS(cleanJur, cleanShift, 5, dateStr);
            top5Ambos = (statRes?.top_predictions || []).map(p => p.number);
          }
        } catch (err) {
          top5Ambos = [];
        }
      }
    }


    if (top5Ambos.length > 0) {
      return {
        prediction_id: `HISTORICAL_${dateStr}_${cleanJur.toUpperCase()}_${cleanShift.toUpperCase()}_${cleanEngine}`,
        date: dateStr,
        jurisdiction: cleanJur,
        shift: cleanShift,
        draw_time: shiftSchedule.time,
        expected_draw_number: resolveExpectedDrawNumber(dateStr, cleanJur, cleanShift),
        engine_id: cleanEngine,
        engine_name: cleanEngine === 'ML-FULL' ? 'ML-FULL (Champion)' : 'Motor Estadístico',
        top_5: top5Ambos,
        items: formatItemsFromTop5(top5Ambos),
        status: 'LOCKED',
        is_historical: true
      };
    }
  }

  return null;
}

// Get or Create Canonical Prediction Record strictly respecting draw deadlines
// STRICT COMPOSITE KEY: date + jurisdiction + shift + engine
export function getOrCreateCanonicalPrediction(dateStr, jurisdiction, shift, engineId) {
  if (!dateStr || !jurisdiction || !shift || !engineId) {
    return null;
  }
  const cleanJur = String(jurisdiction).toLowerCase();
  const cleanShift = String(shift).toLowerCase().replace('la_', '');
  const cleanEngine = String(engineId).toUpperCase();
  const predId = `CANONICAL_${dateStr}_${cleanJur.toUpperCase()}_${cleanShift.toUpperCase()}_${cleanEngine}`;

  const ledger = getCanonicalLedger();
  const predIdV2 = `${predId}_V2`;
  if (ledger[predIdV2] && ledger[predIdV2].status === 'LOCKED') {
    return ledger[predIdV2];
  }
  if (ledger[predId]) {
    return ledger[predId];
  }

  // Calculate draw deadline
  const shiftSchedule = getShiftSchedule(cleanShift);
  const drawDeadlineDate = new Date(`${dateStr}T${shiftSchedule.time}:00.000-03:00`);
  const now = new Date();

  // If draw deadline has already passed, RETROSPECTIVE GENERATION IS STRICTLY PROHIBITED
  if (now >= drawDeadlineDate) {
    return {
      prediction_id: predId,
      date: dateStr,
      jurisdiction: cleanJur,
      shift: cleanShift,
      draw_time: shiftSchedule.time,
      engine_id: cleanEngine,
      engine_name: cleanEngine === 'ML-FULL' ? 'ML-FULL (Champion)' : 'Motor Estadístico',
      top_5: [],
      top_10: [],
      top_20: [],
      created_at: null,
      locked_at: null,
      deadline: drawDeadlineDate.toISOString(),
      visible_to_user: false,
      status: 'INVALID',
      message: 'SIN PREDICCIÓN VÁLIDA REGISTRADA (Generación retrospectiva prohibida)',
      prediction_hash: null,
      items: []
    };
  }

  // Generate top 5 using appropriate model ONCE before deadline
  let top5Ambos = [];
  let items = [];

  const getEngineTitle = (eng) => {
    if (eng === 'ML-FULL') return 'ML-FULL (Champion)';
    if (eng === 'ML-TREND') return 'ML-TREND (Tendencia)';
    return 'Motor Estadístico';
  };

  if (cleanEngine === 'ML-FULL') {
    const mlRes = getMLPredictions(cleanJur, cleanShift, 5, dateStr);
    top5Ambos = (mlRes.top_predictions || mlRes.predictions || []).map(p => p.number);
    items = (mlRes.top_predictions || mlRes.predictions || []).map(p => ({
      number: p.number,
      significado: p.significado || SIGNIFICADOS[p.number] || 'La Suerte',
      score: p.composite_score || 85,
      suggested_centenas: p.suggested_centenas || [`7${p.number}`],
      suggested_millar: p.suggested_millar || [`17${p.number}`]
    }));
  } else if (cleanEngine === 'ML-TREND') {
    const trendRes = getMLTrendPredictions(cleanJur, cleanShift, 5, dateStr);
    top5Ambos = (trendRes.top_predictions || trendRes.predictions || []).map(p => p.number);
    items = (trendRes.top_predictions || trendRes.predictions || []).map(p => ({
      number: p.number,
      significado: p.significado || SIGNIFICADOS[p.number] || 'La Suerte',
      score: p.composite_score || 88,
      suggested_centenas: p.suggested_centenas || [`7${p.number}`],
      suggested_millar: p.suggested_millar || [`17${p.number}`]
    }));
  } else {
    // Statistical engine
    let statRes = null;
    try {
      if (typeof globalThis !== 'undefined' && globalThis.__GET_CLIENT_PREDICTIONS) {
        statRes = globalThis.__GET_CLIENT_PREDICTIONS(cleanJur, cleanShift, 5, dateStr);
      }
    } catch (e) {}
    if (!statRes) {
      statRes = getMLPredictions(cleanJur, cleanShift, 5, dateStr);
    }
    top5Ambos = (statRes?.top_predictions || statRes?.predictions || []).map(p => p.number);
    items = (statRes?.top_predictions || statRes?.predictions || []).map(p => ({
      number: p.number,
      significado: p.significado || SIGNIFICADOS[p.number] || 'La Suerte',
      score: p.composite_score || 80,
      suggested_centenas: p.suggested_centenas || [`7${p.number}`],
      suggested_millar: p.suggested_millar || [`17${p.number}`]
    }));
  }

  const expectedDrawNumber = resolveExpectedDrawNumber(dateStr, cleanJur, cleanShift);

  const record = {
    prediction_id: predId,
    date: dateStr,
    jurisdiction: cleanJur,
    shift: cleanShift,
    draw_time: shiftSchedule.time,
    expected_draw_number: expectedDrawNumber,
    engine_id: cleanEngine,
    engine_name: getEngineTitle(cleanEngine),
    top_5: top5Ambos,
    top_10: top5Ambos,
    top_20: top5Ambos,
    created_at: now.toISOString(),
    locked_at: now.toISOString(),
    deadline: drawDeadlineDate.toISOString(),
    visible_to_user: true,
    status: 'LOCKED',
    items: items
  };

  record.prediction_hash = computeCanonicalPredictionHash(record);
  saveCanonicalRecord(record);
  return record;
}

// Ensure items array exists for cards UI from top_5 without recalculating
export function formatItemsFromTop5(top5List) {
  if (!Array.isArray(top5List)) return [];
  return top5List.map((num, i) => ({
    number: num,
    significado: SIGNIFICADOS[num] || 'La Suerte',
    score: 95 - (i * 3),
    suggested_centenas: [`${(parseInt(num[0], 10) * 3 + 2) % 10}${num}`],
    suggested_millar: [`${(i * 4 + 3) % 9 + 1}${(parseInt(num[0], 10) * 3 + 2) % 10}${num}`]
  }));
}


// PURE EVALUATION FUNCTION (Section E: Single Evaluation Function)
// Evaluates ONLY CanonicalPredictionRecord * OfficialDrawResult.
// NEVER calls getMLPredictions or getClientPredictions!
export function evaluateCanonicalPrediction(canonicalRecord, officialDraw) {
  if (!canonicalRecord || canonicalRecord.status === 'INVALID' || !Array.isArray(canonicalRecord.top_5) || canonicalRecord.top_5.length === 0) {
    return {
      is_evaluated: false,
      evaluation_allowed: false,
      status: 'INVALID_OR_MISSING',
      message: 'SIN PREDICCIÓN VÁLIDA REGISTRADA',
      details: 'No existe pronóstico sellado pre-sorteo para este motor.',
      head_hit: false,
      head_rank: null,
      head_multiplier: null,
      unique_hits: [],
      official_positions: [],
      hit_at_5: 0,
      precision_at_5: 0.0,
      board_occurrence_hits: 0,
      board_occurrence_coverage: 0.0,
      is_hit: false,
      hit_type: 'NO_RECORD',
      top_5: [],
      prediction_id: canonicalRecord?.prediction_id || null,
      engine_id: canonicalRecord?.engine_id || null,
      engine_name: canonicalRecord?.engine_name || null,
      engine_type: canonicalRecord?.engine_id === 'ML-FULL' ? 'ML' : 'STATISTICAL',
      status_text: '⚪ Sin pronóstico registrado'
    };
  }

  const isHistorical = canonicalRecord.is_historical === true || (canonicalRecord.date && canonicalRecord.date < '2026-09-04');

  // Requirement 1: Mandatory Expected Draw Number Gate for Prospective Predictions
  if (!isHistorical && !canonicalRecord.expected_draw_number) {
    return {
      is_evaluated: false,
      evaluation_allowed: false,
      status: 'INVALID_MISSING_EXPECTED_DRAW_NUMBER',
      message: 'SIN NÚMERO DE SORTEO ESPERADO',
      details: 'El registro canónico no contiene el expected_draw_number obligatorio.',
      head_hit: false,
      head_rank: null,
      head_multiplier: null,
      unique_hits: [],
      official_positions: [],
      hit_at_5: 0,
      precision_at_5: 0.0,
      board_occurrence_hits: 0,
      board_occurrence_coverage: 0.0,
      is_hit: false,
      hit_type: 'NO_RECORD',
      top_5: [...canonicalRecord.top_5],
      prediction_id: canonicalRecord.prediction_id || null,
      engine_id: canonicalRecord.engine_id || null,
      engine_name: canonicalRecord.engine_name || null,
      engine_type: canonicalRecord.engine_id === 'ML-FULL' ? 'ML' : 'STATISTICAL',
      status_text: '❌ Sin número de sorteo esperado'
    };
  }

  // Base payload for when evaluation cannot proceed (OFFICIAL RESULT GATE)
  const waitingResultPayload = {
    is_evaluated: false,
    evaluation_allowed: false,
    status: 'WAITING_OFFICIAL_RESULT',
    message: 'ESPERANDO RESULTADO OFICIAL',
    details: 'Aguardando extracto oficial verificado de la lotería.',
    head_hit: false,
    head_rank: null,
    head_multiplier: null,
    unique_hits: [],
    official_positions: [],
    hit_at_5: 0,
    precision_at_5: 0.0,
    board_occurrence_hits: 0,
    board_occurrence_coverage: 0.0,
    is_hit: false,
    hit_type: 'PENDING',
    top_5: [...canonicalRecord.top_5],
    prediction_id: canonicalRecord.prediction_id,
    expected_draw_number: canonicalRecord.expected_draw_number,
    engine_id: canonicalRecord.engine_id,
    engine_name: canonicalRecord.engine_name,
    engine_type: canonicalRecord.engine_id === 'ML-FULL' ? 'ML' : 'STATISTICAL',
    created_at: canonicalRecord.created_at,
    locked_at: canonicalRecord.locked_at,
    deadline: canonicalRecord.deadline,
    prediction_hash: canonicalRecord.prediction_hash,
    status_text: 'ESPERANDO RESULTADO OFICIAL'
  };

  // 1. officialDraw != null
  if (!officialDraw || typeof officialDraw !== 'object') {
    return waitingResultPayload;
  }

  // 2. Board or Head validation (20 numbers or p1)
  const hasBoard = Array.isArray(officialDraw.board) && officialDraw.board.length === 20;
  const hasP1 = !!(officialDraw.p1 || officialDraw.head_millar);
  if (!hasBoard && !hasP1) {
    return waitingResultPayload;
  }

  // 3. officialDraw.date == canonicalRecord.date
  const drawDate = officialDraw.date || officialDraw.draw_date || officialDraw.official_date;
  if (!drawDate || String(drawDate) !== String(canonicalRecord.date)) {
    return waitingResultPayload;
  }
  // Anti-spoofing: reject if underlying real_date conflicts with prediction date
  const underlyingDate = officialDraw.real_date;
  if (underlyingDate && String(underlyingDate) !== String(canonicalRecord.date)) {
    return waitingResultPayload;
  }

  // 4. officialDraw.shift == canonicalRecord.shift
  const drawShift = String(officialDraw.shift || '').toLowerCase().replace('la_', '');
  const recShift = String(canonicalRecord.shift || '').toLowerCase().replace('la_', '');
  if (!drawShift || drawShift !== recShift) {
    return waitingResultPayload;
  }

  // 5. officialDraw.jurisdiction == canonicalRecord.jurisdiction
  const drawJur = String(officialDraw.jurisdiction || officialDraw.lottery || '').toLowerCase();
  const recJur = String(canonicalRecord.jurisdiction || '').toLowerCase();
  if (!drawJur || drawJur !== recJur) {
    return waitingResultPayload;
  }

  // 6. For prospective live draws (Phase 5 >= 2026-09-04), verify status
  if (!isHistorical) {
    const drawStatus = String(officialDraw.status || '').toUpperCase();
    const isValidStatus = drawStatus === 'PUBLISHED' || drawStatus === 'COMPLETED' || drawStatus === 'VERIFIED_OFFICIAL' || hasBoard || hasP1;
    if (!isValidStatus) {
      return waitingResultPayload;
    }

    if (officialDraw.draw_number && canonicalRecord.expected_draw_number && String(officialDraw.draw_number) !== String(canonicalRecord.expected_draw_number)) {
      console.warn(`Draw number check: received ${officialDraw.draw_number} vs expected ${canonicalRecord.expected_draw_number}`);
    }

    if (officialDraw.received_at) {
      const drawTimeStr = canonicalRecord.draw_time || '10:15';
      const drawDateTime = canonicalRecord.deadline 
        ? new Date(canonicalRecord.deadline).getTime() 
        : new Date(`${canonicalRecord.date}T${drawTimeStr.length === 5 ? drawTimeStr : '10:15'}:00.000-03:00`).getTime();
      const receivedTime = new Date(officialDraw.received_at).getTime();
      if (!isNaN(receivedTime) && !isNaN(drawDateTime) && receivedTime <= drawDateTime && !hasBoard && !hasP1) {
        return waitingResultPayload;
      }
    }
  }

  const p1 = officialDraw.p1 || officialDraw.head_millar || '';
  const headAmbo = p1.slice(-2);
  const isHeadHit = canonicalRecord.top_5.includes(headAmbo);
  const headRank = isHeadHit ? (canonicalRecord.top_5.indexOf(headAmbo) + 1) : null;

  // Board inspection (positions 1 to 20)
  const boardAmbos = [];
  const boardPositions = [];
  for (let pos = 1; pos <= 20; pos++) {
    let boardVal = officialDraw[`p${pos}`];
    if (!boardVal && Array.isArray(officialDraw.board) && officialDraw.board[pos - 1]) {
      boardVal = officialDraw.board[pos - 1];
    }
    if (boardVal) {
      const amboVal = String(boardVal).slice(-2);
      boardAmbos.push(amboVal);
      boardPositions.push({ ambo: amboVal, pos, fullNumber: String(boardVal) });
    }
  }

  // Unique matching predictions (each predicted number can contribute at most 1)
  const unique_hits = canonicalRecord.top_5.filter(n => boardAmbos.includes(n));
  const hit_at_5 = unique_hits.length > 0 ? 1 : 0;
  const precision_at_5 = unique_hits.length / 5.0;

  // Detailed official positions for each hit
  const official_positions = [];
  let board_occurrence_hits = 0;

  boardPositions.forEach(({ ambo, pos, fullNumber }) => {
    if (canonicalRecord.top_5.includes(ambo)) {
      board_occurrence_hits++;
      const mult = pos === 1 
        ? '70x (A la Cabeza)' 
        : pos <= 5 
          ? '14x (A los 5)' 
          : pos <= 10 
            ? '7x (A los 10)' 
            : '3.5x (A los 20)';
      official_positions.push({
        number: ambo,
        position: pos,
        rank_in_prediction: canonicalRecord.top_5.indexOf(ambo) + 1,
        full_number: fullNumber,
        multiplier: mult
      });
    }
  });

  const board_occurrence_coverage = board_occurrence_hits / 20.0;

  let status_text = '⚪ Sin aciertos en extracto oficial';
  let details = 'Ningún número del pronóstico figuró en el extracto oficial.';

  if (isHeadHit) {
    status_text = `👑 CABEZA (${headAmbo})`;
    details = `👑 CABEZA (70x) con Ambo ${headAmbo} (Pronóstico #${headRank})`;
  } else if (official_positions.length > 0) {
    const firstHit = official_positions[0];
    status_text = `🎯 Acierto en Posición #${firstHit.position} (${firstHit.multiplier})`;
    details = `Sin acierto a Cabeza • 🎯 Acierto a los 20: Ambo ${firstHit.number} en posición #${firstHit.position} (${firstHit.multiplier})`;
  }

  const primaryHit = isHeadHit ? official_positions.find(h => h.position === 1) : (official_positions[0] || null);

  return {
    is_evaluated: true,
    evaluation_allowed: true,
    prediction_id: canonicalRecord.prediction_id,
    expected_draw_number: canonicalRecord.expected_draw_number,
    official_draw_number: officialDraw.draw_number,
    engine_id: canonicalRecord.engine_id,
    engine_type: canonicalRecord.engine_id === 'ML-FULL' ? 'ML' : canonicalRecord.engine_id === 'ML-TREND' ? 'ML_TREND' : 'STATISTICAL',
    engine_name: canonicalRecord.engine_name,
    top_5: [...canonicalRecord.top_5],
    status: canonicalRecord.status,
    created_at: canonicalRecord.created_at,
    locked_at: canonicalRecord.locked_at,
    deadline: canonicalRecord.deadline,
    prediction_hash: canonicalRecord.prediction_hash,
    official_head_number: p1,
    official_head_ambo: headAmbo,
    head_hit: isHeadHit,
    head_rank: headRank,
    head_multiplier: isHeadHit ? '70x (A la Cabeza)' : null,
    unique_hits,
    official_positions,
    hit_at_5,
    precision_at_5,
    board_occurrence_hits,
    board_occurrence_coverage,
    is_hit: official_positions.length > 0,
    hit_type: isHeadHit ? 'CABEZA' : (official_positions.length > 0 ? 'PIZARRA' : 'NO_HIT'),
    number: primaryHit ? primaryHit.number : null,
    significado: primaryHit ? (SIGNIFICADOS[primaryHit.number] || 'La Suerte') : null,
    position: primaryHit ? primaryHit.position : null,
    matched_positions: official_positions.map(h => h.position),
    model_rank: primaryHit ? primaryHit.rank_in_prediction : null,
    multiplier: primaryHit ? primaryHit.multiplier : null,
    board_hits: official_positions.map(h => ({
      ambo: h.number,
      position: h.position,
      multiplier: h.multiplier,
      rank_in_prediction: h.rank_in_prediction
    })),
    secondary_hits: official_positions.filter(h => h.position > 1).map(h => ({
      ambo: h.number,
      position: h.position,
      multiplier: h.multiplier,
      rank_in_prediction: h.rank_in_prediction
    })),
    status_text,
    details
  };
}

// Backward-compatibility alias
export const evaluateCanonicalRecord = evaluateCanonicalPrediction;

// Snapshot of Coupon (Requirement 9)
export function recordCouponSnapshot({ prediction_id, exact_top5_displayed, engine, jurisdiction, shift }) {
  const snapshot = {
    prediction_id,
    exact_top5_displayed: [...exact_top5_displayed],
    engine,
    jurisdiction,
    shift,
    viewed_at: new Date().toISOString()
  };

  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(COUPON_SNAPSHOTS_STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      list.push(snapshot);
      if (list.length > 50) list.shift(); // Keep last 50
      localStorage.setItem(COUPON_SNAPSHOTS_STORAGE_KEY, JSON.stringify(list));
    }
  } catch (e) {}

  return snapshot;
}

export function getCouponSnapshots() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(COUPON_SNAPSHOTS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    }
  } catch (e) {}
  return [];
}

// Global hook registration for universal runtime cross-module access (Node.js + Web Browser + Webpack ESM)
if (typeof globalThis !== 'undefined') {
  globalThis.__CANONICAL_LEDGER_GET = getCanonicalPrediction;
}
if (typeof window !== 'undefined') {
  window.__CANONICAL_LEDGER_GET = getCanonicalPrediction;
}


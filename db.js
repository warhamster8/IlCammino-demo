/**
 * IlCammino Demo — database SQLite in-browser (sql.js)
 * Schema allineato al modello dati del progetto + seed fittizio.
 */

const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  ruolo TEXT NOT NULL CHECK (ruolo IN ('ADMIN', 'OPERATOR')),
  two_fa INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS patients (
  codice_fiscale TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  data_nascita TEXT NOT NULL,
  luogo_nascita TEXT,
  sesso TEXT CHECK (sesso IN ('M', 'F')),
  indirizzo TEXT,
  citta TEXT,
  cap TEXT,
  email TEXT,
  telefono TEXT,
  note_mediche TEXT,
  allergie TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codice_fiscale TEXT NOT NULL REFERENCES patients(codice_fiscale) ON DELETE CASCADE,
  data_ora TEXT NOT NULL,
  tipo TEXT NOT NULL,
  esito TEXT,
  note_medico TEXT,
  stato TEXT NOT NULL CHECK (stato IN ('PROGRAMMATA', 'COMPLETATA', 'ANNULLATA')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS privacy_consents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codice_fiscale TEXT NOT NULL REFERENCES patients(codice_fiscale) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  data_firma TEXT NOT NULL,
  data_scadenza TEXT NOT NULL,
  stato TEXT NOT NULL CHECK (stato IN ('ATTIVO', 'IN_SCADENZA', 'SCADUTO', 'REVOCATO')),
  file_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  utente_email TEXT,
  azione TEXT NOT NULL,
  entita TEXT,
  dettaglio TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  chiave TEXT PRIMARY KEY,
  valore TEXT NOT NULL
);
`;

const DEFAULT_SETTINGS = {
  org_eyebrow: 'Associazione ODV',
  org_name: 'il Cammino',
  org_subtitle: 'Gestione ambulatorio · servizio gratuito',
  operator_name: 'Luca Verdi',
  login_user: 'demo',
  login_pass: 'cammino2026',
};

const SEED_SQL = `
INSERT INTO users (email, nome, cognome, ruolo, two_fa) VALUES
  ('admin@ilcammino.demo', 'Maria', 'Bianchi', 'ADMIN', 1),
  ('operatore@ilcammino.demo', 'Luca', 'Verdi', 'OPERATOR', 1);

INSERT INTO settings (chiave, valore) VALUES
  ('org_eyebrow', 'Associazione ODV'),
  ('org_name', 'il Cammino'),
  ('org_subtitle', 'Gestione ambulatorio · servizio gratuito'),
  ('operator_name', 'Luca Verdi'),
  ('login_user', 'demo'),
  ('login_pass', 'cammino2026');

INSERT INTO patients (codice_fiscale, nome, cognome, data_nascita, luogo_nascita, sesso, indirizzo, citta, cap, email, telefono, note_mediche, allergie) VALUES
  ('RSSMRA85M01H501Z', 'Mario', 'Rossi', '1985-08-01', 'Roma', 'M', 'Via Roma 12', 'Roma', '00100', 'mario.rossi@email.it', '3331112233', 'Ipertensione controllata', 'Penicillina'),
  ('BNCGNN90A41F205X', 'Giovanna', 'Bianchi', '1990-01-01', 'Milano', 'F', 'Corso Italia 5', 'Milano', '20100', 'g.bianchi@email.it', '3409988776', NULL, 'Nessuna nota'),
  ('VRDLCU78C15L219Y', 'Luca', 'Verdi', '1978-03-15', 'Torino', 'M', 'Via Po 8', 'Torino', '10100', 'luca.verdi@email.it', '3475566778', 'Diabete tipo 2', 'Lattice'),
  ('NRELRA92E45A662K', 'Lara', 'Neri', '1992-05-05', 'Ancona', 'F', 'Via Adriatica 22', 'Ancona', '60100', 'lara.neri@email.it', '3391122334', NULL, 'Aspirina'),
  ('PLLFRC65H12F839P', 'Francesco', 'Pellegrini', '1965-06-12', 'Napoli', 'M', 'Via Toledo 40', 'Napoli', '80100', 'f.pellegrini@email.it', '3284455667', 'BPCO lieve', 'Nessuna'),
  ('CNTSLA88D22D612Q', 'Silvia', 'Conti', '1988-04-22', 'Firenze', 'F', 'Via Tornabuoni 3', 'Firenze', '50100', 'silvia.conti@email.it', '3317788990', 'Gravidanza precedente', 'Nessuna'),
  ('GRRGPP70L30C351R', 'Giuseppe', 'Gori', '1970-07-30', 'Catania', 'M', 'Via Etnea 100', 'Catania', '95100', 'g.gori@email.it', '3490011223', 'Cardiopatia ischemica', 'Iodio'),
  ('FNTMRC95T48L736S', 'Marica', 'Fontana', '1995-12-08', 'Trieste', 'F', 'Via Carducci 7', 'Trieste', '34100', 'marica.fontana@email.it', '3336677889', NULL, 'Nessuna'),
  ('SNTNTN60A01H501T', 'Antonio', 'Santoro', '1960-01-01', 'Roma', 'M', 'Via Appia 200', 'Roma', '00179', 'a.santoro@email.it', '3209988776', 'Artrosi ginocchio', 'Nessuna'),
  ('MRTLUI82M41L736U', 'Luisa', 'Martini', '1982-08-01', 'Trieste', 'F', 'Piazza Unità 1', 'Trieste', '34121', 'luisa.martini@email.it', '3385544332', 'Emicrania cronica', 'Codeina');

INSERT INTO visits (codice_fiscale, data_ora, tipo, esito, note_medico, stato) VALUES
  ('RSSMRA85M01H501Z', '2026-10-12 09:30', 'Controllo pressione', 'Valori nella norma', 'Continua terapia attuale', 'COMPLETATA'),
  ('BNCGNN90A41F205X', '2026-10-12 10:15', 'Visita generica', NULL, NULL, 'PROGRAMMATA'),
  ('VRDLCU78C15L219Y', '2026-10-12 11:00', 'Controllo glicemia', 'HbA1c 6.8%', 'Ridurre carboidrati', 'COMPLETATA'),
  ('NRELRA92E45A662K', '2026-10-13 09:00', 'Visita specialistica', NULL, NULL, 'PROGRAMMATA'),
  ('PLLFRC65H12F839P', '2026-10-13 10:30', 'Controllo respiratorio', 'Spirometria stabile', 'Inalatore al bisogno', 'PROGRAMMATA'),
  ('CNTSLA88D22D612Q', '2026-09-20 15:00', 'Visita generica', 'Buone condizioni', NULL, 'COMPLETATA'),
  ('GRRGPP70L30C351R', '2026-09-15 11:30', 'Cardiologia', 'ECG nei limiti', 'Controlli tra 6 mesi', 'COMPLETATA'),
  ('FNTMRC95T48L736S', '2026-10-14 16:00', 'Visita generica', NULL, NULL, 'PROGRAMMATA'),
  ('SNTNTN60A01H501T', '2026-08-10 09:45', 'Ortopedia', 'Ginocchio destro migliorato', 'Fisioterapia', 'COMPLETATA'),
  ('MRTLUI82M41L736U', '2026-10-15 14:00', 'Neurologia', NULL, NULL, 'PROGRAMMATA'),
  ('RSSMRA85M01H501Z', '2026-09-01 09:00', 'Controllo pressione', 'Lieve aumento', 'Aggiustare dosaggio', 'COMPLETATA'),
  ('VRDLCU78C15L219Y', '2026-07-12 10:00', 'Controllo glicemia', 'Stabile', NULL, 'ANNULLATA');

INSERT INTO privacy_consents (codice_fiscale, tipo, data_firma, data_scadenza, stato, file_url) VALUES
  ('RSSMRA85M01H501Z', 'Trattamento Dati Sanitari', '2025-01-15', '2026-11-15', 'IN_SCADENZA', '/demo/consensi/rossi.pdf'),
  ('BNCGNN90A41F205X', 'Trattamento Dati Sanitari', '2025-06-01', '2027-06-01', 'ATTIVO', '/demo/consensi/bianchi.pdf'),
  ('VRDLCU78C15L219Y', 'Trattamento Dati Sanitari', '2024-03-10', '2025-03-10', 'SCADUTO', NULL),
  ('NRELRA92E45A662K', 'Trattamento Dati Sanitari', '2025-09-01', '2027-09-01', 'ATTIVO', '/demo/consensi/neri.pdf'),
  ('PLLFRC65H12F839P', 'Comunicazione a Terzi', '2025-02-20', '2026-10-25', 'IN_SCADENZA', NULL),
  ('CNTSLA88D22D612Q', 'Trattamento Dati Sanitari', '2025-04-12', '2027-04-12', 'ATTIVO', '/demo/consensi/conti.pdf'),
  ('GRRGPP70L30C351R', 'Marketing', '2023-01-01', '2024-01-01', 'SCADUTO', NULL),
  ('FNTMRC95T48L736S', 'Trattamento Dati Sanitari', '2026-01-10', '2028-01-10', 'ATTIVO', '/demo/consensi/fontana.pdf'),
  ('SNTNTN60A01H501T', 'Trattamento Dati Sanitari', '2025-11-01', '2026-10-20', 'IN_SCADENZA', NULL),
  ('MRTLUI82M41L736U', 'Trattamento Dati Sanitari', '2025-05-15', '2027-05-15', 'ATTIVO', '/demo/consensi/martini.pdf'),
  ('RSSMRA85M01H501Z', 'Marketing', '2025-01-15', '2026-01-15', 'REVOCATO', NULL);

INSERT INTO audit_log (utente_email, azione, entita, dettaglio) VALUES
  ('admin@ilcammino.demo', 'LOGIN', 'users', 'Accesso demo amministratore'),
  ('operatore@ilcammino.demo', 'VISUALIZZA', 'patients', 'Scheda RSSMRA85M01H501Z'),
  ('operatore@ilcammino.demo', 'CREA', 'visits', 'Visita programmata per Fontana'),
  ('admin@ilcammino.demo', 'AGGIORNA', 'privacy_consents', 'Stato consenso Verdi → SCADUTO');
`;

let SQL = null;
let db = null;

function rowsFrom(result) {
  if (!result || !result.length) return [];
  const { columns, values } = result[0];
  return values.map((row) =>
    Object.fromEntries(columns.map((col, i) => [col, row[i]]))
  );
}

function exec(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function run(sql, params = []) {
  db.run(sql, params);
}

function audit(azione, entita, dettaglio) {
  run(
    `INSERT INTO audit_log (utente_email, azione, entita, dettaglio)
     VALUES (?, ?, ?, ?)`,
    ['operatore@ilcammino.demo', azione, entita, dettaglio]
  );
}

function refreshConsentStates() {
  run(`
    UPDATE privacy_consents
    SET stato = CASE
      WHEN stato = 'REVOCATO' THEN 'REVOCATO'
      WHEN date(data_scadenza) < date('now') THEN 'SCADUTO'
      WHEN date(data_scadenza) <= date('now', '+30 days') THEN 'IN_SCADENZA'
      ELSE 'ATTIVO'
    END
    WHERE stato != 'REVOCATO'
  `);
}

const STORAGE_KEY = 'ilcammino_demo_db_v5';

function ensureSettings() {
  run(`CREATE TABLE IF NOT EXISTS settings (
    chiave TEXT PRIMARY KEY,
    valore TEXT NOT NULL
  )`);
  for (const [chiave, valore] of Object.entries(DEFAULT_SETTINGS)) {
    const existing = exec(`SELECT valore FROM settings WHERE chiave = ?`, [chiave]);
    if (!existing.length) {
      run(`INSERT INTO settings (chiave, valore) VALUES (?, ?)`, [chiave, valore]);
    }
  }
}

function createFreshDatabase() {
  db = new SQL.Database();
  db.run(SCHEMA_SQL);
  db.run(SEED_SQL);
  ensureSettings();
  refreshConsentStates();
  persistDatabase();
  return db;
}

async function initDatabase() {
  SQL = await initSqlJs({
    locateFile: (file) => `./vendor/${file}`,
  });

  localStorage.removeItem('ilcammino_demo_db');
  localStorage.removeItem('ilcammino_demo_db_v2');
  localStorage.removeItem('ilcammino_demo_db_v3');

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const bytes = Uint8Array.from(atob(saved), (c) => c.charCodeAt(0));
      db = new SQL.Database(bytes);
      const check = exec(`SELECT COUNT(*) AS n FROM patients`);
      if (!check.length) throw new Error('DB vuoto o invalido');
      ensureSettings();
      refreshConsentStates();
      persistDatabase();
      return db;
    } catch (err) {
      console.warn('Database locale non valido, ripristino seed.', err);
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  return createFreshDatabase();
}

function persistDatabase() {
  const data = db.export();
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < data.length; i += chunk) {
    binary += String.fromCharCode.apply(null, data.subarray(i, i + chunk));
  }
  localStorage.setItem(STORAGE_KEY, btoa(binary));
}

function resetDatabase(preserveSettings = true) {
  const savedSettings = preserveSettings ? getSettings() : null;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('ilcammino_demo_db');
  createFreshDatabase();
  if (savedSettings) {
    setSettings(savedSettings);
  }
}

function getDashboardStats() {
  const pazienti = exec(`SELECT COUNT(*) AS n FROM patients`)[0].n;
  const visiteMese = exec(`
    SELECT COUNT(*) AS n FROM visits
    WHERE strftime('%Y-%m', data_ora) = strftime('%Y-%m', 'now')
      AND stato != 'ANNULLATA'
  `)[0].n;
  const consensiScadenza = exec(`
    SELECT COUNT(*) AS n FROM privacy_consents
    WHERE stato IN ('IN_SCADENZA', 'SCADUTO')
  `)[0].n;
  const programmateOggi = exec(`
    SELECT COUNT(*) AS n FROM visits
    WHERE date(data_ora) = date('now') AND stato = 'PROGRAMMATA'
  `)[0].n;

  const avvisi = exec(`
    SELECT pc.id, pc.tipo, pc.data_scadenza, pc.stato,
           p.nome, p.cognome, p.codice_fiscale
    FROM privacy_consents pc
    JOIN patients p ON p.codice_fiscale = pc.codice_fiscale
    WHERE pc.stato IN ('IN_SCADENZA', 'SCADUTO')
    ORDER BY pc.data_scadenza ASC
    LIMIT 8
  `);

  const prossimeVisite = exec(`
    SELECT v.id, v.data_ora, v.tipo, v.stato, p.nome, p.cognome, p.codice_fiscale
    FROM visits v
    JOIN patients p ON p.codice_fiscale = v.codice_fiscale
    WHERE v.stato = 'PROGRAMMATA' AND date(v.data_ora) >= date('now')
    ORDER BY v.data_ora ASC
    LIMIT 6
  `);

  return { pazienti, visiteMese, consensiScadenza, programmateOggi, avvisi, prossimeVisite };
}

function searchPatients(q = '') {
  const term = `%${q.trim()}%`;
  if (!q.trim()) {
    return exec(`
      SELECT * FROM patients
      ORDER BY cognome, nome
    `);
  }
  return exec(
    `
    SELECT * FROM patients
    WHERE codice_fiscale LIKE ? COLLATE NOCASE
       OR nome LIKE ? COLLATE NOCASE
       OR cognome LIKE ? COLLATE NOCASE
       OR citta LIKE ? COLLATE NOCASE
    ORDER BY cognome, nome
  `,
    [term, term, term, term]
  );
}

function getPatient(cf) {
  return exec(`SELECT * FROM patients WHERE codice_fiscale = ?`, [cf])[0] || null;
}

function getPatientVisits(cf) {
  return exec(
    `SELECT * FROM visits WHERE codice_fiscale = ? ORDER BY data_ora DESC`,
    [cf]
  );
}

function getPatientConsents(cf) {
  return exec(
    `SELECT * FROM privacy_consents WHERE codice_fiscale = ? ORDER BY data_scadenza DESC`,
    [cf]
  );
}

function createPatient(data) {
  run(
    `INSERT INTO patients (
      codice_fiscale, nome, cognome, data_nascita, luogo_nascita, sesso,
      indirizzo, citta, cap, email, telefono, note_mediche, allergie
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.codice_fiscale.toUpperCase(),
      data.nome,
      data.cognome,
      data.data_nascita,
      data.luogo_nascita || null,
      data.sesso || null,
      data.indirizzo || null,
      data.citta || null,
      data.cap || null,
      data.email || null,
      data.telefono || null,
      data.note_mediche || null,
      data.allergie || null,
    ]
  );
  audit('CREA', 'patients', `Nuovo paziente ${data.codice_fiscale}`);
  persistDatabase();
}

function updatePatient(cf, data) {
  run(
    `UPDATE patients SET
      nome = ?, cognome = ?, data_nascita = ?, luogo_nascita = ?, sesso = ?,
      indirizzo = ?, citta = ?, cap = ?, email = ?, telefono = ?,
      note_mediche = ?, allergie = ?, updated_at = datetime('now')
     WHERE codice_fiscale = ?`,
    [
      data.nome,
      data.cognome,
      data.data_nascita,
      data.luogo_nascita || null,
      data.sesso || null,
      data.indirizzo || null,
      data.citta || null,
      data.cap || null,
      data.email || null,
      data.telefono || null,
      data.note_mediche || null,
      data.allergie || null,
      cf,
    ]
  );
  audit('AGGIORNA', 'patients', `Scheda ${cf}`);
  persistDatabase();
}

function deletePatient(cf) {
  run(`DELETE FROM patients WHERE codice_fiscale = ?`, [cf]);
  audit('ELIMINA', 'patients', `Scheda ${cf}`);
  persistDatabase();
}

function getSettings() {
  ensureSettings();
  const rows = exec(`SELECT chiave, valore FROM settings`);
  const out = { ...DEFAULT_SETTINGS };
  for (const r of rows) out[r.chiave] = r.valore;
  return out;
}

function getSetting(chiave) {
  const s = getSettings();
  return s[chiave] ?? DEFAULT_SETTINGS[chiave] ?? '';
}

function setSettings(partial) {
  ensureSettings();
  for (const [chiave, valore] of Object.entries(partial)) {
    run(
      `INSERT INTO settings (chiave, valore) VALUES (?, ?)
       ON CONFLICT(chiave) DO UPDATE SET valore = excluded.valore`,
      [chiave, String(valore ?? '')]
    );
  }
  audit('AGGIORNA', 'settings', 'Impostazioni aggiornate dal pannello');
  persistDatabase();
}

function exportBackup() {
  const payload = {
    versione: 1,
    esportato_il: new Date().toISOString(),
    settings: getSettings(),
    patients: exec(`SELECT * FROM patients ORDER BY cognome, nome`),
    visits: exec(`SELECT * FROM visits ORDER BY data_ora`),
    privacy_consents: exec(`SELECT * FROM privacy_consents ORDER BY id`),
    audit_log: exec(`SELECT * FROM audit_log ORDER BY id`),
  };
  return JSON.stringify(payload, null, 2);
}

function importBackup(jsonText) {
  const data = typeof jsonText === 'string' ? JSON.parse(jsonText) : jsonText;
  if (!data || !Array.isArray(data.patients)) {
    throw new Error('File di backup non valido');
  }

  run(`DELETE FROM audit_log`);
  run(`DELETE FROM privacy_consents`);
  run(`DELETE FROM visits`);
  run(`DELETE FROM patients`);

  for (const p of data.patients) {
    run(
      `INSERT INTO patients (
        codice_fiscale, nome, cognome, data_nascita, luogo_nascita, sesso,
        indirizzo, citta, cap, email, telefono, note_mediche, allergie, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.codice_fiscale,
        p.nome,
        p.cognome,
        p.data_nascita,
        p.luogo_nascita || null,
        p.sesso || null,
        p.indirizzo || null,
        p.citta || null,
        p.cap || null,
        p.email || null,
        p.telefono || null,
        p.note_mediche || null,
        p.allergie || null,
        p.created_at || null,
        p.updated_at || null,
      ]
    );
  }

  for (const v of data.visits || []) {
    run(
      `INSERT INTO visits (id, codice_fiscale, data_ora, tipo, esito, note_medico, stato, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        v.id,
        v.codice_fiscale,
        v.data_ora,
        v.tipo,
        v.esito || null,
        v.note_medico || null,
        v.stato,
        v.created_at || null,
      ]
    );
  }

  for (const c of data.privacy_consents || []) {
    run(
      `INSERT INTO privacy_consents (
        id, codice_fiscale, tipo, data_firma, data_scadenza, stato, file_url, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        c.id,
        c.codice_fiscale,
        c.tipo,
        c.data_firma,
        c.data_scadenza,
        c.stato,
        c.file_url || null,
        c.created_at || null,
      ]
    );
  }

  if (data.settings && typeof data.settings === 'object') {
    setSettings(data.settings);
  }

  refreshConsentStates();
  audit('IMPORTA', 'backup', 'Ripristino da file di backup');
  persistDatabase();
}

function listVisits(filtroStato = '') {
  if (filtroStato) {
    return exec(
      `
      SELECT v.*, p.nome, p.cognome
      FROM visits v
      JOIN patients p ON p.codice_fiscale = v.codice_fiscale
      WHERE v.stato = ?
      ORDER BY v.data_ora DESC
    `,
      [filtroStato]
    );
  }
  return exec(`
    SELECT v.*, p.nome, p.cognome
    FROM visits v
    JOIN patients p ON p.codice_fiscale = v.codice_fiscale
    ORDER BY v.data_ora DESC
  `);
}

function createVisit(data) {
  run(
    `INSERT INTO visits (codice_fiscale, data_ora, tipo, esito, note_medico, stato)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.codice_fiscale,
      data.data_ora,
      data.tipo,
      data.esito || null,
      data.note_medico || null,
      data.stato || 'PROGRAMMATA',
    ]
  );
  audit('CREA', 'visits', `Visita per ${data.codice_fiscale}`);
  persistDatabase();
}

function updateVisitStatus(id, stato) {
  run(`UPDATE visits SET stato = ? WHERE id = ?`, [stato, id]);
  audit('AGGIORNA', 'visits', `Visita #${id} → ${stato}`);
  persistDatabase();
}

function listConsents(filtro = '') {
  if (filtro) {
    return exec(
      `
      SELECT pc.*, p.nome, p.cognome
      FROM privacy_consents pc
      JOIN patients p ON p.codice_fiscale = pc.codice_fiscale
      WHERE pc.stato = ?
      ORDER BY pc.data_scadenza ASC
    `,
      [filtro]
    );
  }
  return exec(`
    SELECT pc.*, p.nome, p.cognome
    FROM privacy_consents pc
    JOIN patients p ON p.codice_fiscale = pc.codice_fiscale
    ORDER BY pc.data_scadenza ASC
  `);
}

function getConsent(id) {
  const rows = exec(
    `
    SELECT pc.*, p.nome, p.cognome
    FROM privacy_consents pc
    JOIN patients p ON p.codice_fiscale = pc.codice_fiscale
    WHERE pc.id = ?
  `,
    [id]
  );
  return rows[0] || null;
}

function createConsent(data) {
  run(
    `INSERT INTO privacy_consents (
      codice_fiscale, tipo, data_firma, data_scadenza, stato, file_url
    ) VALUES (?, ?, ?, ?, 'ATTIVO', ?)`,
    [
      data.codice_fiscale,
      data.tipo,
      data.data_firma,
      data.data_scadenza,
      data.file_url || null,
    ]
  );
  refreshConsentStates();
  audit(
    'CREA',
    'privacy_consents',
    `Consenso ${data.tipo} per ${data.codice_fiscale}`
  );
  persistDatabase();
}

function updateConsent(id, data) {
  run(
    `UPDATE privacy_consents SET
      tipo = ?,
      data_firma = ?,
      data_scadenza = ?,
      file_url = COALESCE(?, file_url)
     WHERE id = ?`,
    [
      data.tipo,
      data.data_firma,
      data.data_scadenza,
      data.file_url || null,
      id,
    ]
  );
  refreshConsentStates();
  audit('AGGIORNA', 'privacy_consents', `Modifica consenso #${id}`);
  persistDatabase();
}

function renewConsent(id, mesi = 24, fileUrl = null) {
  if (fileUrl) {
    run(
      `UPDATE privacy_consents
       SET data_firma = date('now'),
           data_scadenza = date('now', '+' || ? || ' months'),
           stato = 'ATTIVO',
           file_url = ?
       WHERE id = ?`,
      [mesi, fileUrl, id]
    );
  } else {
    run(
      `UPDATE privacy_consents
       SET data_firma = date('now'),
           data_scadenza = date('now', '+' || ? || ' months'),
           stato = 'ATTIVO'
       WHERE id = ?`,
      [mesi, id]
    );
  }
  refreshConsentStates();
  audit('AGGIORNA', 'privacy_consents', `Rinnovo consenso #${id} (+${mesi} mesi)`);
  persistDatabase();
}

function revokeConsent(id) {
  run(`UPDATE privacy_consents SET stato = 'REVOCATO' WHERE id = ?`, [id]);
  audit('AGGIORNA', 'privacy_consents', `Revoca consenso #${id}`);
  persistDatabase();
}

/** Report visite: mensile / annuale / per paziente */
function getReport(anno, mese = null, cf = null) {
  let sql = `
    SELECT
      strftime('%Y-%m', data_ora) AS periodo,
      COUNT(*) AS totale,
      SUM(CASE WHEN stato = 'COMPLETATA' THEN 1 ELSE 0 END) AS completate,
      SUM(CASE WHEN stato = 'PROGRAMMATA' THEN 1 ELSE 0 END) AS programmate,
      SUM(CASE WHEN stato = 'ANNULLATA' THEN 1 ELSE 0 END) AS annullate
    FROM visits
    WHERE strftime('%Y', data_ora) = ?
  `;
  const params = [String(anno)];

  if (mese) {
    sql += ` AND strftime('%m', data_ora) = ?`;
    params.push(String(mese).padStart(2, '0'));
  }
  if (cf) {
    sql += ` AND codice_fiscale = ?`;
    params.push(cf);
  }

  sql += ` GROUP BY periodo ORDER BY periodo`;
  return exec(sql, params);
}

/** Report compliance privacy: quante schede per stato */
function getPrivacyReport() {
  return exec(`
    SELECT
      stato AS periodo,
      COUNT(*) AS totale,
      SUM(CASE WHEN file_url IS NOT NULL AND length(file_url) > 0 THEN 1 ELSE 0 END) AS completate,
      SUM(CASE WHEN file_url IS NULL OR length(file_url) = 0 THEN 1 ELSE 0 END) AS programmate,
      0 AS annullate
    FROM privacy_consents
    GROUP BY stato
    ORDER BY
      CASE stato
        WHEN 'ATTIVO' THEN 1
        WHEN 'IN_SCADENZA' THEN 2
        WHEN 'SCADUTO' THEN 3
        WHEN 'REVOCATO' THEN 4
        ELSE 5
      END
  `);
}

/** Report per tipologia prestazione (progetti / campagne) */
function getReportByTipo(anno, mese = null) {
  let sql = `
    SELECT
      tipo AS periodo,
      COUNT(*) AS totale,
      SUM(CASE WHEN stato = 'COMPLETATA' THEN 1 ELSE 0 END) AS completate,
      SUM(CASE WHEN stato = 'PROGRAMMATA' THEN 1 ELSE 0 END) AS programmate,
      SUM(CASE WHEN stato = 'ANNULLATA' THEN 1 ELSE 0 END) AS annullate
    FROM visits
    WHERE strftime('%Y', data_ora) = ?
  `;
  const params = [String(anno)];
  if (mese) {
    sql += ` AND strftime('%m', data_ora) = ?`;
    params.push(String(mese).padStart(2, '0'));
  }
  sql += ` GROUP BY tipo ORDER BY totale DESC, tipo`;
  return exec(sql, params);
}

function listPatientsShort() {
  return exec(`SELECT codice_fiscale, nome, cognome FROM patients ORDER BY cognome, nome`);
}

function listAudit(limit = 20) {
  return exec(
    `SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?`,
    [limit]
  );
}

function exportReportCsv(rows, headers = null) {
  const header = headers || [
    'periodo',
    'totale',
    'completate',
    'programmate',
    'annullate',
  ];
  const lines = [header.join(';')];
  for (const r of rows) {
    lines.push(header.map((h) => r[h] ?? '').join(';'));
  }
  return lines.join('\n');
}

window.IlCamminoDB = {
  initDatabase,
  resetDatabase,
  persistDatabase,
  getDashboardStats,
  searchPatients,
  getPatient,
  getPatientVisits,
  getPatientConsents,
  createPatient,
  updatePatient,
  deletePatient,
  listVisits,
  createVisit,
  updateVisitStatus,
  listConsents,
  getConsent,
  createConsent,
  updateConsent,
  renewConsent,
  revokeConsent,
  getReport,
  getPrivacyReport,
  getReportByTipo,
  listPatientsShort,
  listAudit,
  exportReportCsv,
  refreshConsentStates,
  getSettings,
  getSetting,
  setSettings,
  exportBackup,
  importBackup,
  DEFAULT_SETTINGS,
};

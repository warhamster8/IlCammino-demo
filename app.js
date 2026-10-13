/**
 * IlCammino Demo — logica UI
 */

const DB = window.IlCamminoDB;

const TITLES = {
  dashboard: ['Dashboard', 'Panoramica dell’ambulatorio'],
  pazienti: ['Pazienti', 'Anagrafica e ricerca rapida'],
  visite: ['Visite', 'Agenda e storico prestazioni'],
  consensi: ['Consensi privacy', 'Scadenze e rinnovi'],
  report: ['Report', 'Riepiloghi mensili e annuali'],
  audit: ['Audit log', 'Tracciamento accessi e modifiche'],
  guida: ['Guida all’uso', 'Istruzioni per operare senza toccare il codice'],
  manutenzione: ['Manutenzione', 'Impostazioni, backup e ripristino'],
};

let lastReportRows = [];
let lastReportHeaders = null;
let currentReportType = 'visite_mese';
let editingCf = null;
let eventsBound = false;

const REPORT_META = {
  visite_mese: {
    hint: 'Esempio regolare: a fine mese seleziona anno e mese correnti, lascia «Tutti i pazienti», genera ed esporta CSV per il verbale interno.',
    cols: ['Periodo', 'Totale', 'Completate', 'Programmate', 'Annullate'],
    csv: ['periodo', 'totale', 'completate', 'programmate', 'annullate'],
  },
  visite_anno: {
    hint: 'Esempio annuale: scegli l’anno, lascia mese vuoto («Tutto l’anno»). Ottieni una riga per mese — utile al bilancio attività.',
    cols: ['Periodo', 'Totale', 'Completate', 'Programmate', 'Annullate'],
    csv: ['periodo', 'totale', 'completate', 'programmate', 'annullate'],
  },
  privacy: {
    hint: 'Esempio compliance (trimestrale): genera il report privacy. Vedi per ogni stato quanti moduli ci sono e quanti hanno l’allegato firmato.',
    cols: ['Stato', 'Totale', 'Con allegato', 'Senza allegato', '—'],
    csv: ['periodo', 'totale', 'completate', 'programmate', 'annullate'],
  },
  progetto: {
    hint: 'Esempio progetto: filtra anno (e mese se serve). Le visite si raggruppano per tipologia — es. solo «Cardiologia» o «Controllo glicemia».',
    cols: ['Tipologia', 'Totale', 'Completate', 'Programmate', 'Annullate'],
    csv: ['periodo', 'totale', 'completate', 'programmate', 'annullate'],
  },
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addMonthsISO(months) {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function fileLabel(url) {
  if (!url) return '—';
  if (url.startsWith('data:')) return 'Allegato locale';
  if (url.startsWith('allegato://')) return url.replace('allegato://', '');
  const parts = String(url).split('/');
  return parts[parts.length - 1] || url;
}

function readFileAsStoredUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }
    const maxBytes = 180 * 1024;
    if (file.size > maxBytes) {
      resolve(`allegato://${file.name}`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Lettura file fallita'));
    reader.readAsDataURL(file);
  });
}

function $(id) {
  return document.getElementById(id);
}

function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2600);
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') || iso.includes(' ') ? iso.replace(' ', 'T') : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function badgeStatoVisita(stato) {
  const map = {
    PROGRAMMATA: 'badge-info',
    COMPLETATA: 'badge-ok',
    ANNULLATA: 'badge-muted',
  };
  return `<span class="badge ${map[stato] || 'badge-muted'}">${stato}</span>`;
}

function badgeStatoConsenso(stato) {
  const map = {
    ATTIVO: 'badge-ok',
    IN_SCADENZA: 'badge-warn',
    SCADUTO: 'badge-danger',
    REVOCATO: 'badge-muted',
  };
  return `<span class="badge ${map[stato] || 'badge-muted'}">${stato.replace('_', ' ')}</span>`;
}

function openModal(id) {
  $(id).classList.add('open');
  document.body.classList.add('locked');
}

function closeModal(id) {
  $(id).classList.remove('open');
  if (!document.querySelector('.modal-backdrop.open')) {
    document.body.classList.remove('locked');
  }
}

function switchPanel(name) {
  document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
  $(`panel-${name}`).classList.add('active');
  document.querySelector(`.nav-btn[data-panel="${name}"]`)?.classList.add('active');
  const [title, sub] = TITLES[name];
  $('pageTitle').textContent = title;
  $('pageSubtitle').textContent = sub;
  closeSidebar();

  if (name === 'dashboard') renderDashboard();
  if (name === 'pazienti') renderPazienti();
  if (name === 'visite') renderVisite();
  if (name === 'consensi') renderConsensi();
  if (name === 'report') renderReportFilters();
  if (name === 'audit') renderAudit();
  if (name === 'manutenzione') renderManutenzione();
}

function applyBranding() {
  const s = DB.getSettings();
  $('brandEyebrow').textContent = s.org_eyebrow || '';
  $('brandName').textContent = s.org_name || 'il Cammino';
  $('brandSubtitle').textContent = s.org_subtitle || '';
  $('operatorLabel').textContent = s.operator_name || 'Operatore';
  $('loginHintUser').textContent = s.login_user || 'demo';
  $('loginHintPass').textContent = s.login_pass || '';
  document.title = `${s.org_name || 'il Cammino'} — Demo ambulatorio`;
}

function renderManutenzione() {
  const s = DB.getSettings();
  $('setEyebrow').value = s.org_eyebrow || '';
  $('setOrgName').value = s.org_name || '';
  $('setSubtitle').value = s.org_subtitle || '';
  $('setOperator').value = s.operator_name || '';
  $('setLoginUser').value = s.login_user || '';
  $('setLoginPass').value = s.login_pass || '';
}

function closeSidebar() {
  $('sidebar').classList.remove('open');
  $('sidebarOverlay').classList.remove('show');
  const menu = $('menuBtn');
  if (menu) menu.setAttribute('aria-expanded', 'false');
}

function openSidebar() {
  $('sidebar').classList.add('open');
  $('sidebarOverlay').classList.add('show');
  const menu = $('menuBtn');
  if (menu) menu.setAttribute('aria-expanded', 'true');
}

function renderDashboard() {
  const s = DB.getDashboardStats();
  $('kpiPazienti').textContent = s.pazienti;
  $('kpiVisite').textContent = s.visiteMese;
  $('kpiConsensi').textContent = s.consensiScadenza;
  $('kpiOggi').textContent = s.programmateOggi;

  $('listaAvvisi').innerHTML = s.avvisi.length
    ? s.avvisi
        .map(
          (a) => `
      <div class="list-item">
        <div>
          <strong>${a.cognome} ${a.nome}</strong>
          <span class="meta">${a.tipo} · scadenza ${formatDate(a.data_scadenza)}</span>
        </div>
        ${badgeStatoConsenso(a.stato)}
      </div>`
        )
        .join('')
    : `<div class="empty">Nessun consenso in scadenza o scaduto.</div>`;

  $('listaProssime').innerHTML = s.prossimeVisite.length
    ? s.prossimeVisite
        .map(
          (v) => `
      <div class="list-item">
        <div>
          <strong>${formatDateTime(v.data_ora)}</strong>
          <span class="meta">${v.cognome} ${v.nome} · ${v.tipo}</span>
        </div>
        ${badgeStatoVisita(v.stato)}
      </div>`
        )
        .join('')
    : `<div class="empty">Nessuna visita programmata.</div>`;
}

function renderPazienti(q = '') {
  const rows = DB.searchPatients(q);
  const tbody = $('tbodyPazienti');
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty">Nessun paziente trovato.</td></tr>`;
    return;
  }
  tbody.innerHTML = rows
    .map(
      (p) => `
    <tr>
      <td data-label="Paziente"><strong>${p.cognome} ${p.nome}</strong><span class="meta">${formatDate(p.data_nascita)}</span></td>
      <td data-label="Codice fiscale"><code>${p.codice_fiscale}</code></td>
      <td data-label="Contatti">${p.telefono || '—'}<span class="meta">${p.email || ''}</span></td>
      <td data-label="Città">${p.citta || '—'}</td>
      <td data-label="Azioni">
        <div class="row-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-azione="scheda" data-cf="${p.codice_fiscale}">Scheda</button>
          <button type="button" class="btn btn-ghost btn-sm" data-azione="modifica" data-cf="${p.codice_fiscale}">Modifica</button>
          <button type="button" class="btn btn-danger btn-sm" data-azione="elimina" data-cf="${p.codice_fiscale}">Elimina</button>
        </div>
      </td>
    </tr>`
    )
    .join('');
}

function renderVisite() {
  const filtro = $('filtroVisite').value;
  const rows = DB.listVisits(filtro);
  const tbody = $('tbodyVisite');
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty">Nessuna visita.</td></tr>`;
    return;
  }
  tbody.innerHTML = rows
    .map(
      (v) => `
    <tr>
      <td data-label="Data / ora">${formatDateTime(v.data_ora)}</td>
      <td data-label="Paziente"><strong>${v.cognome} ${v.nome}</strong><span class="meta">${v.codice_fiscale}</span></td>
      <td data-label="Tipo">${v.tipo}</td>
      <td data-label="Stato">${badgeStatoVisita(v.stato)}</td>
      <td data-label="Azioni">
        <div class="row-actions">
          ${
            v.stato === 'PROGRAMMATA'
              ? `<button type="button" class="btn btn-ghost btn-sm" data-visita="${v.id}" data-stato="COMPLETATA">Completa</button>
                 <button type="button" class="btn btn-danger btn-sm" data-visita="${v.id}" data-stato="ANNULLATA">Annulla</button>`
              : '—'
          }
        </div>
      </td>
    </tr>`
    )
    .join('');
}

function renderConsensi() {
  const filtro = $('filtroConsensi').value;
  const rows = DB.listConsents(filtro);
  const tbody = $('tbodyConsensi');
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty">Nessun consenso.</td></tr>`;
    return;
  }
  tbody.innerHTML = rows
    .map((c) => {
      const azioni = [];
      if (c.stato !== 'REVOCATO') {
        azioni.push(
          `<button type="button" class="btn btn-ghost btn-sm" data-consenso="modifica" data-id="${c.id}">Modifica</button>`
        );
      }
      if (c.stato === 'IN_SCADENZA' || c.stato === 'SCADUTO') {
        azioni.push(
          `<button type="button" class="btn btn-primary btn-sm" data-consenso="rinnova" data-id="${c.id}">Rinnova</button>`
        );
      }
      if (c.stato === 'ATTIVO' || c.stato === 'IN_SCADENZA') {
        azioni.push(
          `<button type="button" class="btn btn-danger btn-sm" data-consenso="revoca" data-id="${c.id}">Revoca</button>`
        );
      }
      return `
    <tr>
      <td data-label="Paziente"><strong>${c.cognome} ${c.nome}</strong></td>
      <td data-label="Tipo">${c.tipo}</td>
      <td data-label="Firma">${formatDate(c.data_firma)}</td>
      <td data-label="Scadenza">${formatDate(c.data_scadenza)}</td>
      <td data-label="Allegato"><span class="meta">${fileLabel(c.file_url)}</span></td>
      <td data-label="Stato">${badgeStatoConsenso(c.stato)}</td>
      <td data-label="Azioni">
        <div class="row-actions">${azioni.length ? azioni.join('') : '—'}</div>
      </td>
    </tr>`;
    })
    .join('');
}

function applyReportTypeUI() {
  const meta = REPORT_META[currentReportType];
  $('reportHint').textContent = meta.hint;
  $('theadReport').innerHTML = meta.cols.map((c) => `<th>${c}</th>`).join('');

  document.querySelectorAll('#reportPresets .preset-card').forEach((btn) => {
    const on = btn.dataset.report === currentReportType;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-selected', on ? 'true' : 'false');
  });

  const showMese = currentReportType !== 'privacy';
  const showPaz =
    currentReportType === 'visite_mese' || currentReportType === 'visite_anno';
  $('reportMese').style.display = showMese ? '' : 'none';
  $('reportPaziente').style.display = showPaz ? '' : 'none';
  $('reportAnno').style.display = currentReportType === 'privacy' ? 'none' : '';

  if (currentReportType === 'visite_mese') {
    if (!$('reportMese').value) {
      $('reportMese').value = String(new Date().getMonth() + 1).padStart(2, '0');
    }
  }
  if (currentReportType === 'visite_anno') {
    $('reportMese').value = '';
  }
}

function renderReportFilters() {
  const yearSel = $('reportAnno');
  if (!yearSel.options.length) {
    const years = [2026, 2025, 2024];
    yearSel.innerHTML = years.map((y) => `<option value="${y}">${y}</option>`).join('');
  }
  const paz = $('reportPaziente');
  const current = paz.value;
  paz.innerHTML =
    `<option value="">Tutti i pazienti</option>` +
    DB.listPatientsShort()
      .map(
        (p) =>
          `<option value="${p.codice_fiscale}">${p.cognome} ${p.nome}</option>`
      )
      .join('');
  paz.value = current;
  applyReportTypeUI();
  generaReport();
}

function generaReport() {
  const anno = $('reportAnno').value;
  const mese = $('reportMese').value || null;
  const cf = $('reportPaziente').value || null;
  const meta = REPORT_META[currentReportType];
  lastReportHeaders = meta.csv;

  if (currentReportType === 'privacy') {
    lastReportRows = DB.getPrivacyReport();
  } else if (currentReportType === 'progetto') {
    lastReportRows = DB.getReportByTipo(anno, mese);
  } else if (currentReportType === 'visite_anno') {
    lastReportRows = DB.getReport(anno, null, cf);
  } else {
    lastReportRows = DB.getReport(anno, mese, cf);
  }

  const tbody = $('tbodyReport');
  const labels = meta.cols;
  if (!lastReportRows.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty">Nessun dato per i filtri selezionati.</td></tr>`;
    return;
  }
  tbody.innerHTML = lastReportRows
    .map(
      (r) => `
    <tr>
      <td data-label="${labels[0]}">${r.periodo}</td>
      <td data-label="${labels[1]}">${r.totale}</td>
      <td data-label="${labels[2]}">${r.completate}</td>
      <td data-label="${labels[3]}">${r.programmate}</td>
      <td data-label="${labels[4]}">${r.annullate}</td>
    </tr>`
    )
    .join('');
}

function renderAudit() {
  const rows = DB.listAudit(40);
  $('tbodyAudit').innerHTML = rows
    .map(
      (a) => `
    <tr>
      <td data-label="Quando">${formatDateTime(a.created_at)}</td>
      <td data-label="Utente">${a.utente_email || '—'}</td>
      <td data-label="Azione">${a.azione}</td>
      <td data-label="Entità">${a.entita || '—'}</td>
      <td data-label="Dettaglio">${a.dettaglio || '—'}</td>
    </tr>`
    )
    .join('');
}

function fillPazienteForm(p = null) {
  const form = $('formPaziente');
  form.reset();
  $('pPrivacyNow').checked = false;
  $('privacyOnCreateFields').classList.add('hidden');
  $('pPrivacyFile').value = '';
  $('pPrivacyScadenza').value = addMonthsISO(24);
  if (p) {
    $('pazienteMode').value = 'edit';
    editingCf = p.codice_fiscale;
    $('modalPazienteTitle').textContent = 'Modifica paziente';
    $('privacyOnCreate').classList.add('hidden');
    $('pCf').value = p.codice_fiscale;
    $('pCf').readOnly = true;
    $('pNome').value = p.nome;
    $('pCognome').value = p.cognome;
    $('pNascita').value = p.data_nascita;
    $('pLuogo').value = p.luogo_nascita || '';
    $('pSesso').value = p.sesso || '';
    $('pIndirizzo').value = p.indirizzo || '';
    $('pCitta').value = p.citta || '';
    $('pCap').value = p.cap || '';
    $('pEmail').value = p.email || '';
    $('pTelefono').value = p.telefono || '';
    $('pNote').value = p.note_mediche || '';
    $('pAllergie').value = p.allergie || '';
  } else {
    $('pazienteMode').value = 'create';
    editingCf = null;
    $('modalPazienteTitle').textContent = 'Nuovo paziente';
    $('privacyOnCreate').classList.remove('hidden');
    $('pCf').readOnly = false;
  }
}

function fillConsensoSelect() {
  $('cPaziente').innerHTML = DB.listPatientsShort()
    .map(
      (p) =>
        `<option value="${p.codice_fiscale}">${p.cognome} ${p.nome} (${p.codice_fiscale})</option>`
    )
    .join('');
}

function openConsensoModal(mode, id = null) {
  $('formConsenso').reset();
  $('consensoMode').value = mode;
  $('consensoId').value = id || '';
  $('cFile').value = '';
  $('fieldConsensoMesi').hidden = mode !== 'rinnova';
  $('fieldConsensoPaziente').style.display = mode === 'create' ? '' : 'none';
  $('cPaziente').required = mode === 'create';
  $('cMesi').value = '24';

  if (mode === 'create') {
    $('modalConsensoTitle').textContent = 'Carica consenso';
    $('btnSalvaConsenso').textContent = 'Salva consenso';
    $('cFileHint').textContent = 'Carica il modulo firmato (PDF o immagine).';
    fillConsensoSelect();
    $('cFirma').value = todayISO();
    $('cScadenza').value = addMonthsISO(24);
    $('cFirma').disabled = false;
    $('cScadenza').disabled = false;
    $('cTipo').disabled = false;
  } else {
    const c = DB.getConsent(Number(id));
    if (!c) return;
    $('cTipo').value = c.tipo;
    $('cFirma').value = c.data_firma;
    $('cScadenza').value = c.data_scadenza;
    if (mode === 'modifica') {
      $('modalConsensoTitle').textContent = `Modifica consenso — ${c.cognome} ${c.nome}`;
      $('btnSalvaConsenso').textContent = 'Salva modifiche';
      $('cFileHint').textContent = c.file_url
        ? `Allegato attuale: ${fileLabel(c.file_url)}. Scegli un file solo se vuoi sostituirlo.`
        : 'Nessun allegato. Puoi caricarne uno ora.';
      $('cFirma').disabled = false;
      $('cScadenza').disabled = false;
      $('cTipo').disabled = false;
    } else {
      $('modalConsensoTitle').textContent = `Rinnova consenso — ${c.cognome} ${c.nome}`;
      $('btnSalvaConsenso').textContent = 'Conferma rinnovo';
      $('cFileHint').textContent = 'Opzionale: allega il nuovo modulo firmato.';
      $('cFirma').value = todayISO();
      $('cScadenza').value = addMonthsISO(24);
      $('cFirma').disabled = true;
      $('cScadenza').disabled = true;
      $('cTipo').disabled = true;
    }
  }
  openModal('modalConsenso');
}

function openScheda(cf) {
  const p = DB.getPatient(cf);
  if (!p) return;
  const visite = DB.getPatientVisits(cf);
  const consensi = DB.getPatientConsents(cf);
  $('schedaTitolo').textContent = `${p.cognome} ${p.nome}`;
  $('schedaBody').innerHTML = `
    <p><strong>CF:</strong> ${p.codice_fiscale}<br>
    <strong>Nato/a:</strong> ${formatDate(p.data_nascita)} · ${p.luogo_nascita || '—'} (${p.sesso || '—'})<br>
    <strong>Indirizzo:</strong> ${p.indirizzo || '—'}, ${p.cap || ''} ${p.citta || ''}<br>
    <strong>Contatti:</strong> ${p.telefono || '—'} · ${p.email || '—'}<br>
    <strong>Note:</strong> ${p.note_mediche || '—'}<br>
    <strong>Allergie:</strong> ${p.allergie || '—'}</p>

    <div class="detail-block">
      <h4>Visite (${visite.length})</h4>
      ${
        visite.length
          ? visite
              .slice(0, 8)
              .map(
                (v) =>
                  `<div class="list-item"><div><strong>${formatDateTime(v.data_ora)}</strong><span class="meta">${v.tipo}</span></div>${badgeStatoVisita(v.stato)}</div>`
              )
              .join('')
          : '<div class="empty">Nessuna visita.</div>'
      }
    </div>

    <div class="detail-block">
      <h4>Consensi (${consensi.length})</h4>
      ${
        consensi.length
          ? consensi
              .map(
                (c) =>
                  `<div class="list-item"><div><strong>${c.tipo}</strong><span class="meta">Scade ${formatDate(c.data_scadenza)}</span></div>${badgeStatoConsenso(c.stato)}</div>`
              )
              .join('')
          : '<div class="empty">Nessun consenso.</div>'
      }
    </div>
  `;
  openModal('modalScheda');
}

function fillVisitaSelect() {
  $('vPaziente').innerHTML = DB.listPatientsShort()
    .map(
      (p) =>
        `<option value="${p.codice_fiscale}">${p.cognome} ${p.nome} (${p.codice_fiscale})</option>`
    )
    .join('');
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  $('vDataOra').value = now.toISOString().slice(0, 16);
}

function bindEvents() {
  if (eventsBound) return;
  eventsBound = true;

  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchPanel(btn.dataset.panel));
  });

  $('menuBtn').addEventListener('click', () => {
    if ($('sidebar').classList.contains('open')) closeSidebar();
    else openSidebar();
  });
  $('sidebarOverlay').addEventListener('click', closeSidebar);
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) closeSidebar();
  });

  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });
  document.querySelectorAll('.modal-backdrop').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (e.target === el) closeModal(el.id);
    });
  });

  $('searchPazienti').addEventListener('input', (e) => {
    renderPazienti(e.target.value);
  });

  $('btnNuovoPaziente').addEventListener('click', () => {
    fillPazienteForm(null);
    openModal('modalPaziente');
  });

  $('tbodyPazienti').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-azione]');
    if (!btn) return;
    const cf = btn.dataset.cf;
    if (btn.dataset.azione === 'scheda') openScheda(cf);
    if (btn.dataset.azione === 'modifica') {
      fillPazienteForm(DB.getPatient(cf));
      openModal('modalPaziente');
    }
    if (btn.dataset.azione === 'elimina') {
      if (!confirm(`Eliminare il paziente ${cf}? Verranno eliminate anche visite e consensi collegati.`)) return;
      DB.deletePatient(cf);
      toast('Paziente eliminato.');
      renderPazienti($('searchPazienti').value);
      renderDashboard();
    }
  });

  $('pPrivacyNow').addEventListener('change', () => {
    $('privacyOnCreateFields').classList.toggle('hidden', !$('pPrivacyNow').checked);
  });

  $('formPaziente').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    const cf = data.codice_fiscale.trim().toUpperCase();
    if (!/^[A-Z0-9]{16}$/i.test(cf)) {
      toast('Codice fiscale non valido (16 caratteri).');
      return;
    }
    try {
      if ($('pazienteMode').value === 'create') {
        if (DB.getPatient(cf)) {
          toast('Esiste già un paziente con questo CF.');
          return;
        }
        data.codice_fiscale = cf;
        DB.createPatient(data);

        if ($('pPrivacyNow').checked) {
          const fileUrl = await readFileAsStoredUrl($('pPrivacyFile').files[0]);
          DB.createConsent({
            codice_fiscale: cf,
            tipo: $('pPrivacyTipo').value,
            data_firma: todayISO(),
            data_scadenza: $('pPrivacyScadenza').value || addMonthsISO(24),
            file_url: fileUrl,
          });
          toast('Paziente e consenso privacy salvati.');
        } else {
          toast('Paziente creato. Carica il consenso da Consensi quando pronto.');
        }
      } else {
        DB.updatePatient(editingCf, data);
        toast('Paziente aggiornato.');
      }
      closeModal('modalPaziente');
      renderPazienti($('searchPazienti').value);
      renderDashboard();
    } catch (err) {
      console.error(err);
      toast('Errore nel salvataggio.');
    }
  });

  $('filtroVisite').addEventListener('change', renderVisite);
  $('btnNuovaVisita').addEventListener('click', () => {
    fillVisitaSelect();
    openModal('modalVisita');
  });

  $('tbodyVisite').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-visita]');
    if (!btn) return;
    DB.updateVisitStatus(Number(btn.dataset.visita), btn.dataset.stato);
    toast(`Visita aggiornata: ${btn.dataset.stato}`);
    renderVisite();
    renderDashboard();
  });

  $('formVisita').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    data.data_ora = data.data_ora.replace('T', ' ');
    DB.createVisit(data);
    closeModal('modalVisita');
    toast('Visita creata.');
    renderVisite();
    renderDashboard();
  });

  $('filtroConsensi').addEventListener('change', renderConsensi);
  $('btnNuovoConsenso').addEventListener('click', () => openConsensoModal('create'));

  $('tbodyConsensi').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-consenso]');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    if (btn.dataset.consenso === 'modifica') openConsensoModal('modifica', id);
    if (btn.dataset.consenso === 'rinnova') openConsensoModal('rinnova', id);
    if (btn.dataset.consenso === 'revoca') {
      if (!confirm('Revocare questo consenso? Lo stato passerà a REVOCATO.')) return;
      DB.revokeConsent(id);
      toast('Consenso revocato.');
      renderConsensi();
      renderDashboard();
    }
  });

  $('formConsenso').addEventListener('submit', async (e) => {
    e.preventDefault();
    const mode = $('consensoMode').value;
    const id = Number($('consensoId').value);
    try {
      const fileUrl = await readFileAsStoredUrl($('cFile').files[0]);
      if (mode === 'create') {
        DB.createConsent({
          codice_fiscale: $('cPaziente').value,
          tipo: $('cTipo').value,
          data_firma: $('cFirma').value,
          data_scadenza: $('cScadenza').value,
          file_url: fileUrl,
        });
        toast('Consenso privacy caricato.');
      } else if (mode === 'modifica') {
        DB.updateConsent(id, {
          tipo: $('cTipo').value,
          data_firma: $('cFirma').value,
          data_scadenza: $('cScadenza').value,
          file_url: fileUrl,
        });
        toast('Consenso aggiornato.');
      } else if (mode === 'rinnova') {
        const mesi = Number($('cMesi').value) || 24;
        DB.renewConsent(id, mesi, fileUrl);
        toast(`Consenso rinnovato per ${mesi} mesi.`);
      }
      closeModal('modalConsenso');
      renderConsensi();
      renderDashboard();
    } catch (err) {
      console.error(err);
      toast('Errore nel salvataggio del consenso.');
    }
  });

  $('cMesi').addEventListener('input', () => {
    if ($('consensoMode').value !== 'rinnova') return;
    const mesi = Number($('cMesi').value) || 24;
    $('cScadenza').value = addMonthsISO(mesi);
  });

  document.querySelectorAll('#reportPresets .preset-card').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentReportType = btn.dataset.report;
      applyReportTypeUI();
      generaReport();
    });
  });

  $('btnGeneraReport').addEventListener('click', generaReport);
  $('reportAnno').addEventListener('change', generaReport);
  $('reportMese').addEventListener('change', generaReport);
  $('reportPaziente').addEventListener('change', generaReport);

  $('btnExportCsv').addEventListener('click', () => {
    if (!lastReportRows.length) {
      toast('Nessun dato da esportare.');
      return;
    }
    const csv = DB.exportReportCsv(lastReportRows, lastReportHeaders);
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ilcammino-report-${currentReportType}-${$('reportAnno').value || 'privacy'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('CSV scaricato.');
  });

  $('btnResetDb').addEventListener('click', () => {
    if (!confirm('Ripristinare i dati demo iniziali? Le modifiche andranno perse (le impostazioni restano).')) return;
    DB.resetDatabase(true);
    applyBranding();
    toast('Dati di esempio ripristinati.');
    switchPanel('dashboard');
  });

  $('formStudio').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    DB.setSettings({
      org_eyebrow: fd.get('org_eyebrow'),
      org_name: fd.get('org_name'),
      org_subtitle: fd.get('org_subtitle'),
      operator_name: fd.get('operator_name'),
    });
    applyBranding();
    toast('Anagrafica studio salvata.');
  });

  $('formCredenziali').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const login_user = String(fd.get('login_user') || '').trim().toLowerCase();
    const login_pass = String(fd.get('login_pass') || '');
    if (!login_user || !login_pass) {
      toast('Utente e password obbligatori.');
      return;
    }
    DB.setSettings({ login_user, login_pass });
    applyBranding();
    toast('Credenziali aggiornate.');
  });

  $('btnExportBackup').addEventListener('click', () => {
    const json = DB.exportBackup();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ilcammino-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Backup scaricato.');
  });

  $('inputImportBackup').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!confirm('Il backup sostituirà i dati attuali. Continuare?')) return;
    try {
      const text = await file.text();
      DB.importBackup(text);
      applyBranding();
      renderManutenzione();
      renderDashboard();
      toast('Backup ripristinato.');
    } catch (err) {
      console.error(err);
      toast('Backup non valido o illeggibile.');
    }
  });

  $('btnResetSeed').addEventListener('click', () => {
    if (!confirm('Ripristinare solo i dati di esempio? Le impostazioni (nome e login) restano.')) return;
    DB.resetDatabase(true);
    applyBranding();
    renderManutenzione();
    toast('Dati di esempio ripristinati.');
  });
}

const AUTH_KEY = 'ilcammino_demo_auth';

function isLoggedIn() {
  return sessionStorage.getItem(AUTH_KEY) === '1';
}

function setLoggedIn(value) {
  if (value) sessionStorage.setItem(AUTH_KEY, '1');
  else sessionStorage.removeItem(AUTH_KEY);
}

function showLogin() {
  applyBranding();
  $('loginScreen').classList.remove('hidden');
  $('app').classList.add('hidden');
  $('loader').classList.add('hidden');
  $('loginError').classList.add('hidden');
  $('loginPass').value = '';
  $('loginUser').value = DB.getSetting('login_user') || 'demo';
  setTimeout(() => $('loginUser').focus(), 50);
}

function enterApp() {
  $('loginScreen').classList.add('hidden');
  $('loader').classList.add('hidden');
  $('app').classList.remove('hidden');
  applyBranding();
  bindEvents();
  renderDashboard();
  toast('Accesso effettuato');
}

function bindLogin() {
  $('formLogin').addEventListener('submit', (e) => {
    e.preventDefault();
    const user = $('loginUser').value.trim().toLowerCase();
    const pass = $('loginPass').value;
    const expectedUser = String(DB.getSetting('login_user') || '').trim().toLowerCase();
    const expectedPass = String(DB.getSetting('login_pass') || '');
    if (user === expectedUser && pass === expectedPass) {
      setLoggedIn(true);
      enterApp();
      return;
    }
    $('loginError').classList.remove('hidden');
    $('loginPass').focus();
    $('loginPass').select();
  });

  $('btnLogout').addEventListener('click', () => {
    setLoggedIn(false);
    showLogin();
    toast('Sessione terminata');
  });
}

async function boot() {
  $('loader').classList.remove('hidden');
  try {
    await DB.initDatabase();
    bindLogin();
    if (isLoggedIn()) enterApp();
    else showLogin();
  } catch (err) {
    console.error(err);
    $('loader').innerHTML = `
      <div class="loader-card">
        <h1>Errore caricamento</h1>
        <p>Impossibile avviare il database SQLite locale.</p>
        <p style="color:#b42318;font-size:0.9rem">${String(err && err.message ? err.message : err)}</p>
      </div>`;
  }
}

boot();

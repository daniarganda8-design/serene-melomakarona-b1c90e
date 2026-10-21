import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUTPUT = path.join(ROOT, 'assets', 'data', 'partidos.json');

const CLUB_URL = 'https://www.elbalondemadrid.es/club/16661228';
const SEASON_RE = /2026\s*\/\s*(?:27|2027)/i;

const EXPECTED_TEAMS = [
  'Masculina|Tercera División',
  'Masculina|Juvenil A',
  'Masculina|Juvenil B',
  'Masculina|Cadete Autonómica',
  'Masculina|Cadete B',
  'Masculina|Infantil Preferente',
  'Masculina|Infantil B',
  'Masculina|Alevín A',
  'Masculina|Alevín B',
  'Masculina|Benjamín A',
  'Masculina|Prebenjamín A',
  'Femenina|Juvenil A',
  'Femenina|Cadete A',
  'Femenina|Cadete B',
  'Femenina|Infantil A',
  'Femenina|Alevín A'
];

// Grupos 2026/27 ya comprobados. Tienen prioridad frente al descubrimiento automático.
const FIXED = [
  {
    competition:'26738221', group:'26771028',
    competitionName:'TERCERA DIVISIÓN DE FÚTBOL SALA',
    officialTeamName:'CD RIVAS FUTSAL - YOUFIRST SMART FINACE',
    team:'Tercera División', section:'Masculina'
  },
  {
    competition:'26749998', group:'26814437',
    competitionName:'PRIMERA DIVISION AUTONOMICA JUVENIL SALA',
    officialTeamName:"CD RIVAS FUTSAL - YOUFIRST SMART FINACE 'A'",
    team:'Juvenil A', section:'Masculina'
  },
  {
    competition:'26738220', group:'26878012',
    competitionName:'PREFERENTE JUVENIL SALA',
    officialTeamName:"CD RIVAS FUTSAL - YOUFIRST SMART FINACE 'B'",
    team:'Juvenil B', section:'Masculina'
  },
  {
    competition:'26738292', group:'26738293',
    competitionName:'PRIMERA DIVISION AUTONOMICA CADETE SALA',
    officialTeamName:"CD RIVAS FUTSAL - YOUFIRST SMART FINACE 'A'",
    team:'Cadete Autonómica', section:'Masculina'
  },
  {
    competition:'26750003', group:'26877982',
    competitionName:'PREFERENTE CADETE SALA',
    officialTeamName:"CD RIVAS FUTSAL - YOUFIRST SMART FINACE 'B'",
    team:'Cadete B', section:'Masculina'
  },
  {
    competition:'26738249', group:'26738251',
    competitionName:'PREFERENTE INFANTIL SALA',
    officialTeamName:"CD RIVAS FUTSAL - YOUFIRST SMART FINACE 'A'",
    team:'Infantil Preferente', section:'Masculina'
  },
  {
    competition: '26750015',
    group: '28125503',
    competitionName: 'PRIMERA INFANTIL SALA',
    officialTeamName: "CD RIVAS FUTSAL - YOUFIRST SMART FINACE 'B'",
    team: 'Infantil B',
    section: 'Masculina'
  },
  {
    competition: '26750017',
    group: '28105877',
    competitionName: 'ALEVIN SALA',
    officialTeamName: "CD RIVAS FUTSAL - YOUFIRST SMART FINACE 'A'",
    team: 'Alevín A',
    section: 'Masculina'
  },
  {
    competition: '26750017',
    group: '27597476',
    competitionName: 'ALEVIN SALA',
    officialTeamName: "CD RIVAS FUTSAL - YOUFIRST SMART FINACE 'B'",
    team: 'Alevín B',
    section: 'Masculina'
  },
  {
    competition: '26738225',
    group: '28202550',
    competitionName: 'BENJAMIN INICIACION SALA',
    officialTeamName: 'CD RIVAS FUTSAL - YOUFIRST SMART FINACE',
    team: 'Benjamín A',
    section: 'Masculina'
  },
  {
    competition: 'ID_PENDIENTE',
    group: 'ID_PENDIENTE',
    competitionName: 'PREBENJAMIN SALA',
    officialTeamName: 'CD RIVAS FUTSAL - YOUFIRST SMART FINACE',
    team: 'Prebenjamín A',
    section: 'Masculina'
  },

  // Femenino
  {
    competition: '26750020',
    group: '28163764',
    competitionName: 'JUVENIL FEMENINO SALA',
    officialTeamName: 'CD RIVAS FUTSAL - YOUFIRST SMART FINACE',
    team: 'Juvenil A',
    section: 'Femenina'
  },
  {
    competition: '26738222',
    group: '28165770',
    competitionName: 'CADETE FEMENINO SALA',
    officialTeamName: "CD RIVAS FUTSAL - YOUFIRST SMART FINACE 'A'",
    team: 'Cadete A',
    section: 'Femenina'
  },
  {
    competition: '26738222',
    group: '28165724',
    competitionName: 'CADETE FEMENINO SALA',
    officialTeamName: "CD RIVAS FUTSAL - YOUFIRST SMART FINACE 'B'",
    team: 'Cadete B',
    section: 'Femenina'
  },
  {
    competition: '26738223',
    group: '28169452',
    competitionName: 'INFANTIL FEMENINO SALA',
    officialTeamName: 'CD RIVAS FUTSAL - YOUFIRST SMART FINACE',
    team: 'Infantil A',
    section: 'Femenina'
  },
  {
    competition: '26750025',
    group: '28170761',
    competitionName: 'ALEVIN FEMENINO SALA',
    officialTeamName: 'CD RIVAS FUTSAL - YOUFIRST SMART FINACE',
    team: 'Alevín A',
    section: 'Femenina'
  }

];

function stripAccents(value='') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function norm(value='') {
  return stripAccents(value).toUpperCase()
    .replace(/[“”]/g,'"').replace(/[‘’]/g,"'")
    .replace(/\s+/g,' ').trim();
}
function isRivas(value='') {
  return /(?:CDB?|C\.?D\.?)\s+RIVAS\s+FUTSAL/i.test(String(value));
}
function suffix(value='') {
  return norm(value).match(/(?:^|\s)'?([A-Z])'?\s*$/)?.[1] || null;
}

function identifyTeam(text, officialTeamName) {
  const c = norm(text);
  const s = suffix(officialTeamName);
  const female = /FEMENIN/.test(c);

  if (female) {
    if (/JUVENIL/.test(c)) return { team:'Juvenil A', section:'Femenina' };
    if (/CADETE/.test(c)) return { team: s === 'B' ? 'Cadete B' : 'Cadete A', section:'Femenina' };
    if (/INFANTIL/.test(c)) return { team:'Infantil A', section:'Femenina' };
    if (/ALEVIN/.test(c)) return { team:'Alevín A', section:'Femenina' };
    return null;
  }

  if (/TERCERA/.test(c)) return { team:'Tercera División', section:'Masculina' };
  if (/PREBENJAMIN/.test(c)) return { team:'Prebenjamín A', section:'Masculina' };
  if (/BENJAMIN/.test(c)) return { team:'Benjamín A', section:'Masculina' };
  if (/JUVENIL/.test(c)) return { team:s === 'B' ? 'Juvenil B' : 'Juvenil A', section:'Masculina' };
  if (/CADETE/.test(c)) return { team:s === 'B' ? 'Cadete B' : 'Cadete Autonómica', section:'Masculina' };
  if (/INFANTIL/.test(c)) return { team:s === 'B' ? 'Infantil B' : 'Infantil Preferente', section:'Masculina' };
  if (/ALEVIN/.test(c)) return { team:s === 'B' ? 'Alevín B' : 'Alevín A', section:'Masculina' };
  return null;
}

function dedupeSources(list) {
  const map = new Map();
  for (const source of list) {
    const key = `${source.section}|${source.team}`;
    if (!map.has(key)) map.set(key, source);
  }
  return [...map.values()];
}



function findDate(text = '') {
  const value = String(text).toLowerCase();

  // Formatos: 24/10/2026, 24-10-2026, 24/10 o 24-10
  const numeric = value.match(
    /\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/
  );

  if (numeric) {
    const day = Number(numeric[1]);
    const month = Number(numeric[2]);
    let year;

    if (numeric[3]) {
      year = Number(numeric[3]);
      if (year < 100) year += 2000;
    } else {
      year = month <= 6 ? 2027 : 2026;
    }

    const date = new Date(Date.UTC(year, month - 1, day));

    if (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    ) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Formatos: 24 de octubre de 2026
  const months = {
    enero: 1,
    febrero: 2,
    marzo: 3,
    abril: 4,
    mayo: 5,
    junio: 6,
    julio: 7,
    agosto: 8,
    septiembre: 9,
    setiembre: 9,
    octubre: 10,
    noviembre: 11,
    diciembre: 12
  };

  const written = value.match(
    /\b(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?:\s+de\s+(\d{4}))?\b/i
  );

  if (written) {
    const day = Number(written[1]);
    const month = months[written[2]];
    let year = written[3] ? Number(written[3]) : new Date().getFullYear();

    // Si no aparece el año, orientar la fecha a la temporada 2026/27.
    if (!written[3] && month <= 6 && new Date().getMonth() >= 6) {
      year++;
    }

    const date = new Date(Date.UTC(year, month - 1, day));

    if (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    ) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  return null;
}


function findTime(text='') {
  const m = String(text).match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  return m ? `${String(m[1]).padStart(2,'0')}:${m[2]}` : null;
}
function findRound(text='') {
  const m = String(text).match(/JORNADA\s*(?:N[º°.]?\s*)?(\d+)/i);
  return m ? Number(m[1]) : null;
}
function findScore(text='') {
  for (const line of String(text).split(/\n+/)) {
    const m = line.trim().match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})$/);
    if (m) return `${m[1]} - ${m[2]}`;
  }
  return null;
}
function findVenue(text='') {
  return String(text).split(/\n+/).map(x=>x.trim()).find(
    line => /PABELL|POLID|P\.M\.|PARQUE|MUNICIPAL|INSTALACI|CAMPO/i.test(line) && !isRivas(line)
  ) || null;
}
function plausibleOpponent(line='') {
  const n = norm(line);
  if (!line || line.length > 180 || isRivas(line)) return false;
  if (/^(JORNADA|ACTUAL|FECHA|HORA|LUGAR|CAMPO|LOCALIDAD|RESULTADOS|CLASIFICACION|CALENDARIO|TEMPORADA|VER CLASIFICACION)/.test(n)) return false;
  if (/^\d+$/.test(n) || /^\d{1,2}:\d{2}$/.test(n) || /^\d{1,2}[\/-]\d{1,2}[\/-]\d{4}$/.test(n) || /^\d{1,2}\s*[-–]\s*\d{1,2}$/.test(n)) return false;
  return (line.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g) || []).length >= 4;
}

function makeFixture(source, data) {
  return {
    round:data.round || null, date:data.date || null, time:data.time || null,
    home:data.home, away:data.away, score:data.score || null, venue:data.venue || null,
    competition:source.competition, group:source.group,
    competitionName:source.competitionName, officialTeamName:source.officialTeamName,
    team:source.team, section:source.section,
    sourceUrl:`https://www.elbalondemadrid.es/competicion/${source.competition}/grupo/${source.group}/jornadas`,
    rffmUrl:`https://www.rffm.es/competicion/calendario?competicion=${source.competition}&grupo=${source.group}&temporada=22&tipojuego=3`
  };
}

function parseCompLink(href='') {
  const m = String(href).match(/\/competicion\/(\d+)\/grupo\/(\d+)/i);
  return m ? { competition:m[1], group:m[2] } : null;
}

function candidateScore(candidate) {
  const text = norm(`${candidate.text}\n${candidate.context}`);
  let score = 0;
  if (SEASON_RE.test(candidate.context || '')) score += 20;
  if (/\/JORNADAS(?:[?#/]|$)/i.test(candidate.href)) score += 8;
  if (/\/CLASIFICACION(?:[?#/]|$)/i.test(candidate.href)) score += 5;
  if (/TERCERA|JUVENIL|CADETE|INFANTIL|ALEVIN|BENJAMIN|PREBENJAMIN|FEMENIN/.test(text)) score += 5;
  if (/FUTSAL|SALA/.test(text)) score += 3;
  return score;
}

async function discoverSources(context) {
  const page = await context.newPage();
  await page.goto(CLUB_URL, { waitUntil:'domcontentloaded', timeout:45000 });
  await page.waitForLoadState('networkidle', { timeout:12000 }).catch(()=>{});
  await page.waitForTimeout(900);

  const links = await page.locator('a[href*="/equipo/"]').evaluateAll(elements => [
    ...new Set(elements.map(el => el.href).filter(Boolean))
  ]);
  await page.close();

  const found = [];

  for (const url of links.slice(0,60)) {
    const teamPage = await context.newPage();
    try {
      await teamPage.goto(url, { waitUntil:'domcontentloaded', timeout:35000 });
      await teamPage.waitForLoadState('networkidle', { timeout:8000 }).catch(()=>{});
      await teamPage.waitForTimeout(350);

      const data = await teamPage.evaluate(() => {
        const bodyText = document.body?.innerText || '';
        const h1 = document.querySelector('h1')?.innerText?.trim() || '';
        const title = document.title || '';
        const candidates = [...document.querySelectorAll('a[href*="/competicion/"][href*="/grupo/"]')].map(link => {
          let node = link;
          let context = '';
          for (let i=0; i<5 && node; i++, node=node.parentElement) {
            const text = (node.innerText || '').trim();
            if (text.length > context.length && text.length < 2500) context = text;
          }
          return { href:link.href, text:(link.innerText || '').trim(), context };
        });
        return { bodyText, h1, title, candidates };
      });

      if (!data.h1 || !isRivas(data.h1)) continue;
      if (!SEASON_RE.test(`${data.title}\n${data.bodyText}`)) continue;

      const candidates = data.candidates
        .map(c => ({ ...c, ids:parseCompLink(c.href) }))
        .filter(c => c.ids)
        .sort((a,b) => candidateScore(b) - candidateScore(a));

      let selected = null;
      let category = null;

      for (const candidate of candidates) {
        const guessed = identifyTeam(`${candidate.text}\n${candidate.context}\n${data.title}`, data.h1);
        if (guessed) {
          selected = candidate;
          category = guessed;
          break;
        }
      }

      if (!selected || !category) continue;

      found.push({
        competition:selected.ids.competition,
        group:selected.ids.group,
        competitionName:(selected.context || selected.text || category.team).split('\n')[0].trim(),
        officialTeamName:data.h1,
        ...category
      });
    } catch (err) {
      console.log(`No se pudo leer ${url}: ${err.message}`);
    } finally {
      await teamPage.close();
    }
  }

  // Los grupos fijos válidos tienen prioridad.
  return dedupeSources([...FIXED, ...found]);
}

function parseBodyFallback(source, pageText) {
  const lines = String(pageText).split(/\n+/).map(x=>x.trim()).filter(Boolean);

  for (let i=0; i<lines.length; i++) {
    if (!isRivas(lines[i])) continue;

    for (let distance=1; distance<=8; distance++) {
      for (const idx of [i-distance, i+distance]) {
        if (idx < 0 || idx >= lines.length) continue;
        const rival = lines[idx];
        if (!plausibleOpponent(rival)) continue;

        const start = Math.max(0, Math.min(i,idx)-8);
        const end = Math.min(lines.length, Math.max(i,idx)+9);
        const context = lines.slice(start,end).join('\n');
        const rivasHome = i < idx;

        return makeFixture(source, {
          round:findRound(context),
          date:findDate(context),
          time:findTime(context),
          home:rivasHome ? lines[i] : rival, away:rivasHome ? rival : lines[i],
          score:findScore(context), venue:findVenue(context)
        });
      }
    }
  }
  return null;
}

async function extractCalendar(page, source) {
  const url = `https://www.elbalondemadrid.es/competicion/${source.competition}/grupo/${source.group}/jornadas`;

  await page.goto(url, { waitUntil:'domcontentloaded', timeout:45000 });
  await page.waitForLoadState('networkidle', { timeout:15000 }).catch(()=>{});
  await page.waitForFunction(
    () => !/Cargando jornada/i.test(document.body?.innerText || ''),
    null,
    { timeout:20000 }
  ).catch(()=>{});
  await page.waitForTimeout(1000);

  const pageText = await page.locator('body').innerText().catch(()=> '');
  const pageTitle = await page.title().catch(()=> '');
  const seasonValid = SEASON_RE.test(`${pageTitle}\n${pageText}`);

  if (!seasonValid) {
    return { fixtures:[], mode:'stale-season', chars:pageText.length, seasonValid:false };
  }

  const cards = await page.evaluate(() => {
    const unique = values => [...new Set(values.map(v=>v.trim()).filter(Boolean))];
    const rivasAnchors = [...document.querySelectorAll('a[href*="/equipo/"]')]
      .filter(a => /RIVAS\s+FUTSAL/i.test(a.innerText || ''));
    const out = [];

    for (const anchor of rivasAnchors) {
      let node = anchor;
      for (let depth=0; depth<9 && node; depth++, node=node.parentElement) {
        const teams = unique([...node.querySelectorAll('a[href*="/equipo/"]')].map(a=>a.innerText || ''));
        const text = (node.innerText || '').trim();
        if (teams.length >= 2 && teams.length <= 4 && text.length > 0 && text.length < 2200) {
          out.push({ text, teams });
          break;
        }
      }
    }

    const seen = new Set();
    return out.filter(card => {
      const key = `${card.teams.join('|')}|${card.text}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  });

  console.log(
    'TEXTO ORIGINAL DEL PARTIDO:',
    source.team,
    JSON.stringify(cards[0]?.text ?? 'SIN TARJETA')
  );

  const fixtures = [];

  for (const card of cards) {
    const teams = [...new Set(card.teams)];
    const rivasIndex = teams.findIndex(isRivas);
    const rivalIndex = teams.findIndex((team,index) => index !== rivasIndex && !isRivas(team));
    if (rivasIndex < 0 || rivalIndex < 0) continue;

    const rivas = teams[rivasIndex];
    const rival = teams[rivalIndex];
    const rivasHome = rivasIndex < rivalIndex;

    fixtures.push(makeFixture(source, {
      round:findRound(card.text),
      date:findDate(card.text),
      time:findTime(card.text),
      home:rivasHome ? rivas : rival,
      away:rivasHome ? rival : rivas,
      score:findScore(card.text),
      venue:findVenue(card.text)
    }));
  }

  if (fixtures.length) {
    return { fixtures, mode:'rendered-dom', chars:pageText.length, seasonValid:true };
  }

  const fallback = parseBodyFallback(source, pageText);
  return {
    fixtures:fallback ? [fallback] : [],
    mode:fallback ? 'rendered-text' : 'no-fixture',
    chars:pageText.length,
    seasonValid:true
  };
}

function dedupeFixtures(fixtures) {
  const map = new Map();
  for (const f of fixtures) {
    const key = `${f.section}|${f.team}|${f.round}|${f.date}|${norm(f.home)}|${norm(f.away)}`;
    if (!map.has(key)) map.set(key,f);
  }
  return [...map.values()];
}

function selectMatches(fixtures) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const byTeam = new Map();

  for (const fixture of fixtures) {
    const key = `${fixture.section}|${fixture.team}`;
    if (!byTeam.has(key)) byTeam.set(key,[]);
    byTeam.get(key).push(fixture);
  }

  const upcoming = [];
  const results = [];

  for (const list of byTeam.values()) {
    const future = list.filter(f =>
      f.date && new Date(`${f.date}T12:00:00`) >= today
    ).sort((a,b) => a.date.localeCompare(b.date) || (a.round||0)-(b.round||0));
    if (future[0]) upcoming.push(future[0]);

    const past = list.filter(f =>
      f.date && f.score && new Date(`${f.date}T12:00:00`) < today
    ).sort((a,b) => b.date.localeCompare(a.date) || (b.round||0)-(a.round||0));
    if (past[0]) results.push(past[0]);
  }

  upcoming.sort((a,b) => (a.date||'').localeCompare(b.date||'') || a.team.localeCompare(b.team,'es'));
  results.sort((a,b) => (b.date||'').localeCompare(a.date||''));

  return { upcoming, results, detectedTeams:[...byTeam.keys()] };
}

async function readPrevious() {
  try {
    return JSON.parse(await fs.readFile(OUTPUT,'utf8'));
  } catch {
    return null;
  }
}

const browser = await chromium.launch({ headless:true });
const context = await browser.newContext({ locale:'es-ES', timezoneId:'Europe/Madrid' });

try {
  const sources = await discoverSources(context);
  const sourceKeys = sources.map(s => `${s.section}|${s.team}`);
  const missingTeams = EXPECTED_TEAMS.filter(team => !sourceKeys.includes(team));

  const allFixtures = [];
  const teamDiagnostics = {};

  for (const source of sources) {
    const page = await context.newPage();
    try {
      const result = await extractCalendar(page, source);
      allFixtures.push(...result.fixtures);

      teamDiagnostics[`${source.section} ${source.team}`] = {
        mode:result.mode,
        fixtures:result.fixtures.length,
        chars:result.chars,
        seasonValid:result.seasonValid !== false,
        competition:source.competition,
        group:source.group
      };

      console.log(`${source.section} ${source.team}: ${result.fixtures.length} partido(s) [${result.mode}]`);
    } catch (err) {
      teamDiagnostics[`${source.section} ${source.team}`] = {
        mode:'error',
        error:err.message,
        competition:source.competition,
        group:source.group
      };
      console.error(`${source.section} ${source.team}: ${err.message}`);
    } finally {
      await page.close();
    }
  }

  

  const fixtures = dedupeFixtures(allFixtures);
  if (!fixtures.length) {
    throw new Error('No se ha detectado ningún partido. Se conserva el JSON anterior.');
  }

  // DIAGNÓSTICO DE PARTIDOS
  console.log(
    'DIAGNÓSTICO DE PARTIDOS:',
    JSON.stringify(
      fixtures.map(f => ({
        equipo: f.team,
        local: f.home,
        visitante: f.away,
        fecha: f.date,
        jornada: f.round,
        resultado: f.score
      })),
      null,
      2
    )
  );

  console.log(
    'PARTIDOS CON FECHA:',
    fixtures.filter(f => f.date).length,
    'de',
    fixtures.length
  );

  const selected = selectMatches(fixtures);
  const upcomingKeys = new Set(selected.upcoming.map(f => `${f.section}|${f.team}`));
  const sourceKeysSet = new Set(sourceKeys);

  const pendingTeams = EXPECTED_TEAMS
    .filter(key => !upcomingKeys.has(key))
    .map(key => {
      const [section,team] = key.split('|');
      const diagnostic = teamDiagnostics[`${section} ${team}`];

      let reason = 'Calendario 2026/27 pendiente de publicación.';
      if (diagnostic?.mode === 'stale-season') {
        reason = 'La categoría localizada corresponde todavía a otra temporada. Esperando calendario 2026/27.';
      } else if (sourceKeysSet.has(key)) {
        reason = 'La categoría está localizada, pero la próxima jornada todavía no está publicada.';
      }

      return { section, team, reason };
    });

  const payload = {
    upcoming:selected.upcoming,
    results:selected.results,
    pendingTeams,
    sourceTeams:sourceKeys,
    detectedTeams:selected.detectedTeams,
    updatedAt:new Date().toISOString(),
    source:'Calendarios públicos RFFM',
    diagnostics:{
      scraper:'playwright-cloudflare-v3',
      sources:sources.length,
      fixtures:fixtures.length,
      expectedTeams:EXPECTED_TEAMS.length,
      pendingTeams:pendingTeams.length,
      missingTeams,
      teams:teamDiagnostics
    }
  };

  const previous = await readPrevious();
  const previousCore = previous ? JSON.stringify({
    upcoming:previous.upcoming,
    results:previous.results,
    pendingTeams:previous.pendingTeams,
    sourceTeams:previous.sourceTeams,
    detectedTeams:previous.detectedTeams
  }) : null;

  const newCore = JSON.stringify({
    upcoming:payload.upcoming,
    results:payload.results,
    pendingTeams:payload.pendingTeams,
    sourceTeams:payload.sourceTeams,
    detectedTeams:payload.detectedTeams
  });

  if (previousCore === newCore) {
    console.log('No hay cambios en partidos ni calendarios pendientes.');
  } else {
    await fs.mkdir(path.dirname(OUTPUT), { recursive:true });
    await fs.writeFile(OUTPUT, JSON.stringify(payload,null,2) + '\n', 'utf8');
    console.log(`JSON actualizado: ${OUTPUT}`);
  }

  console.log(`Partidos encontrados: ${fixtures.length}`);
  console.log(`Próximos: ${payload.upcoming.length}`);
  console.log(`Pendientes: ${payload.pendingTeams.length}`);
  console.log(`Equipos con fuente: ${sources.length}/${EXPECTED_TEAMS.length}`);
} finally {
  await context.close();
  await browser.close();
}

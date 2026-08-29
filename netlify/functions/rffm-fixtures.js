'use strict';

const SEASON = 22; // 2026/27
const TYPE = 3;    // fútbol sala
const CLUB_PAGE = 'https://www.elbalondemadrid.es/club/16661228';

const FIXED = [
  {
    competition:'26738221',
    group:'26771028',
    competitionName:'TERCERA DIVISIÓN DE FÚTBOL SALA',
    officialTeamName:'CD RIVAS FUTSAL - YOUFIRST SMART FINACE',
    team:'Tercera División',
    section:'Masculina'
  },
  {
    competition:'26749998',
    group:'26814437',
    competitionName:'PRIMERA DIVISION AUTONOMICA JUVENIL SALA',
    officialTeamName:"CD RIVAS FUTSAL - YOUFIRST SMART FINACE 'A'",
    team:'Juvenil A',
    section:'Masculina'
  },
  {
    competition:'26738220',
    group:'26878012',
    competitionName:'PREFERENTE JUVENIL SALA',
    officialTeamName:"CD RIVAS FUTSAL - YOUFIRST SMART FINACE 'B'",
    team:'Juvenil B',
    section:'Masculina'
  },
  {
    competition:'26738292',
    group:'26738293',
    competitionName:'PRIMERA DIVISION AUTONOMICA CADETE SALA',
    officialTeamName:"CD RIVAS FUTSAL - YOUFIRST SMART FINACE 'A'",
    team:'Cadete Autonómica',
    section:'Masculina'
  },
  {
    competition:'26750003',
    group:'26877982',
    competitionName:'PREFERENTE CADETE SALA',
    officialTeamName:"CD RIVAS FUTSAL - YOUFIRST SMART FINACE 'B'",
    team:'Cadete B',
    section:'Masculina'
  }
];

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/151.0.0.0 Safari/537.36';

function decode(s='') {
  return String(s)
    .replace(/&nbsp;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'")
    .replace(/&aacute;/gi,'á')
    .replace(/&eacute;/gi,'é')
    .replace(/&iacute;/gi,'í')
    .replace(/&oacute;/gi,'ó')
    .replace(/&uacute;/gi,'ú')
    .replace(/&ntilde;/gi,'ñ')
    .replace(/&Aacute;/g,'Á')
    .replace(/&Eacute;/g,'É')
    .replace(/&Iacute;/g,'Í')
    .replace(/&Oacute;/g,'Ó')
    .replace(/&Uacute;/g,'Ú')
    .replace(/&Ntilde;/g,'Ñ');
}

function stripAccents(s='') {
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'');
}

function norm(s='') {
  return stripAccents(decode(s))
    .toUpperCase()
    .replace(/[“”]/g,'"')
    .replace(/[‘’]/g,"'")
    .replace(/\s+/g,' ')
    .trim();
}

function plain(html='') {
  return decode(
    String(html)
      .replace(/<script[\s\S]*?<\/script>/gi,' ')
      .replace(/<style[\s\S]*?<\/style>/gi,' ')
      .replace(
        /<(br|\/p|\/div|\/li|\/section|\/article|\/h[1-6]|\/tr|\/td|\/span|\/a)>/gi,
        '\n'
      )
      .replace(/<[^>]+>/g,' ')
  );
}

function lines(html='') {
  return plain(html)
    .split(/\n+/)
    .map(s => s.replace(/\s+/g,' ').trim())
    .filter(Boolean);
}

function isRivas(s='') {
  return /\b(?:CDB?|C\.?D\.?)\s+RIVAS\s+FUTSAL\b/i.test(String(s));
}

function suffix(s='') {
  return norm(s).match(/(?:^|\s)'?([A-Z])'?\s*$/)?.[1] || null;
}

function canonical(s='') {
  return norm(s)
    .replace(/^CDB?\.?\s+/,'CD ')
    .replace(/\s*-\s*YOUFIRST\s+SMART\s+FIN(?:A|A)CE\b/g,'')
    .replace(
      /\s*-\s*YOUFIRST\b.*?(?=(?:\s+'[A-Z]'\s*$)|$)/g,
      ''
    )
    .replace(/\s+/g,' ')
    .trim();
}

function sameRivas(a,b) {
  if (!isRivas(a) || !isRivas(b)) return false;

  const ca = canonical(a);
  const cb = canonical(b);

  if (ca === cb) return true;

  const sa = suffix(a);
  const sb = suffix(b);

  return (
    sa === sb &&
    ca.replace(/\s+'?[A-Z]'?$/,'') ===
    cb.replace(/\s+'?[A-Z]'?$/,'')
  );
}

function identity(competitionName, officialTeamName) {
  const c = norm(competitionName);
  const s = suffix(officialTeamName);
  const female = /FEMENIN/.test(c);

  if (female) {
    if (/JUVENIL/.test(c))
      return {team:'Juvenil A', section:'Femenina'};

    if (/CADETE/.test(c) && s !== 'B')
      return {team:'Cadete A', section:'Femenina'};

    if (/INFANTIL/.test(c))
      return {team:'Infantil A', section:'Femenina'};

    if (/ALEVIN/.test(c))
      return {team:'Alevín A', section:'Femenina'};

    return null;
  }

  if (/TERCERA/.test(c))
    return {team:'Tercera División', section:'Masculina'};

  if (/JUVENIL/.test(c) && /AUTONOMICA/.test(c) && s !== 'B')
    return {team:'Juvenil A', section:'Masculina'};

  if (/JUVENIL/.test(c) && s === 'B')
    return {team:'Juvenil B', section:'Masculina'};

  if (/CADETE/.test(c) && /AUTONOMICA/.test(c) && s !== 'B')
    return {team:'Cadete Autonómica', section:'Masculina'};

  if (/CADETE/.test(c) && s === 'B')
    return {team:'Cadete B', section:'Masculina'};

  if (/INFANTIL/.test(c) && /PREFERENTE/.test(c) && s !== 'B')
    return {team:'Infantil Preferente', section:'Masculina'};

  if (/INFANTIL/.test(c) && s === 'B')
    return {team:'Infantil B', section:'Masculina'};

  if (/ALEVIN/.test(c) && s === 'A')
    return {team:'Alevín A', section:'Masculina'};

  if (/ALEVIN/.test(c) && s === 'B')
    return {team:'Alevín B', section:'Masculina'};

  if (/PREBENJAMIN/.test(c))
    return {team:'Prebenjamín A', section:'Masculina'};

  if (/BENJAMIN/.test(c))
    return {team:'Benjamín A', section:'Masculina'};

  return null;
}

function extractCookies(headers) {
  let raw = [];

  if (typeof headers.getSetCookie === 'function') {
    raw = headers.getSetCookie();
  }

  if (!raw.length) {
    const h = headers.get('set-cookie');
    if (h) raw = [h];
  }

  return raw
    .map(v => v.split(';')[0])
    .filter(Boolean)
    .join('; ');
}

async function fetchWithTimeout(
  url,
  options={},
  timeoutMs=8500
) {
  const controller = new AbortController();

  const timer = setTimeout(
    () => controller.abort(),
    timeoutMs
  );

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

function hasRealCalendar(html='') {
  const text = plain(html);

  return (
    html.trim().length > 350 &&
    /CD\s+RIVAS\s+FUTSAL/i.test(text) &&
    /JORNADA\s*\d+/i.test(text)
  );
}

async function fetchFederationHtml(source) {

  const legacy =
    `https://www.ffmadrid.es/pnfg/NPcd/NFG_VisCalendario_Vis` +
    `?CodJornada=1` +
    `&cod_primaria=1000120` +
    `&codcompeticion=${encodeURIComponent(source.competition)}` +
    `&codgrupo=${encodeURIComponent(source.group)}` +
    `&codtemporada=${SEASON}`;

  const modern =
    `https://www.rffm.es/competicion/calendario` +
    `?competicion=${encodeURIComponent(source.competition)}` +
    `&grupo=${encodeURIComponent(source.group)}` +
    `&jornada=1` +
    `&temporada=${SEASON}` +
    `&tipojuego=${TYPE}`;

  const headers = {
    'user-agent': UA,
    'accept':
      'text/html,application/xhtml+xml,' +
      'application/xml;q=0.9,*/*;q=0.8',
    'accept-language': 'es-ES,es;q=0.9,en;q=0.7',
    'referer': 'https://www.rffm.es/'
  };

  let first = await fetchWithTimeout(
    legacy,
    {
      headers,
      redirect:'follow'
    },
    7500
  );

  let body = await first.text();
  let cookie = extractCookies(first.headers);

  if (hasRealCalendar(body)) {
    return {
      html:body,
      url:legacy,
      mode:'legacy-direct'
    };
  }

  if (cookie) {
    const second = await fetchWithTimeout(
      legacy,
      {
        headers:{
          ...headers,
          cookie
        },
        redirect:'follow'
      },
      7500
    );

    body = await second.text();

    if (hasRealCalendar(body)) {
      return {
        html:body,
        url:legacy,
        mode:'legacy-session'
      };
    }
  }

  const modernFirst = await fetchWithTimeout(
    modern,
    {
      headers,
      redirect:'follow'
    },
    8500
  );

  let modernBody = await modernFirst.text();
  let modernCookie = extractCookies(
    modernFirst.headers
  );

  if (hasRealCalendar(modernBody)) {
    return {
      html:modernBody,
      url:modern,
      mode:'modern-direct'
    };
  }

  if (modernCookie) {

    const modernSecond =
      await fetchWithTimeout(
        modern,
        {
          headers:{
            ...headers,
            cookie:modernCookie
          },
          redirect:'follow'
        },
        8500
      );

    modernBody =
      await modernSecond.text();

    if (hasRealCalendar(modernBody)) {
      return {
        html:modernBody,
        url:modern,
        mode:'modern-session'
      };
    }
  }

  if (modernBody.trim().length > 350) {
    return {
      html:modernBody,
      url:modern,
      mode:'modern-no-fixtures'
    };
  }

  throw new Error(
    `RFFM devolvió contenido vacío para ${source.team}`
  );
}

async function fetchText(
  url,
  timeoutMs=6000
) {

  const r =
    await fetchWithTimeout(
      url,
      {
        headers:{
          'user-agent':UA,
          'accept':
            'text/html,application/xhtml+xml,*/*;q=0.8'
        },
        redirect:'follow'
      },
      timeoutMs
    );

  if (!r.ok) {
    throw new Error(`${r.status}`);
  }

  return await r.text();
}

async function discoverExtraSources() {

  try {

    const clubHtml =
      await fetchText(
        CLUB_PAGE,
        5000
      );

    const ids = [
      ...clubHtml.matchAll(
        /href=["']\/equipo\/(\d+)["']/gi
      )
    ].map(m => m[1]);

    const unique =
      [...new Set(ids)].slice(0,30);

    const pages =
      await Promise.allSettled(
        unique.map(async id => {

          const html =
            await fetchText(
              `https://www.elbalondemadrid.es/equipo/${id}`,
              4500
            );

          const title =
            decode(
              html.match(
                /<title[^>]*>([\s\S]*?)<\/title>/i
              )?.[1] || ''
            )
            .replace(/<[^>]+>/g,' ')
            .replace(/\s+/g,' ')
            .trim();

          if (
            !/2026\/27|2026\/2027/i.test(title)
          ) {
            return null;
          }

          const teamName =
            decode(
              (
                html.match(
                  /<h1[^>]*>([\s\S]*?)<\/h1>/i
                )?.[1] || ''
              )
              .replace(/<[^>]+>/g,' ')
            )
            .replace(/\s+/g,' ')
            .trim();

          const link =
            html.match(
              /href=["']\/competicion\/(\d+)\/grupo\/(\d+)\/(?:clasificacion|jornadas)["']/i
            );

          if (
            !link ||
            !teamName ||
            !isRivas(teamName)
          ) {
            return null;
          }

          const competitionName =
            (
              title.split(
                /2026\/27|2026\/2027/i
              )[0] || ''
            )
            .replace(
              /^Plantilla de .*? — /i,
              ''
            )
            .replace(
              /\s*·\s*El Balón.*$/i,
              ''
            )
            .trim();

          const idn =
            identity(
              competitionName,
              teamName
            );

          if (!idn) {
            return null;
          }

          return {
            competition:link[1],
            group:link[2],
            competitionName,
            officialTeamName:teamName,
            ...idn
          };
        })
      );

    return pages
      .map(
        x =>
          x.status === 'fulfilled'
            ? x.value
            : null
      )
      .filter(Boolean);

  } catch (_) {

    return [];
  }
}

function looksLikeTeam(line) {

  const n = norm(line);

  if (!line || line.length > 190)
    return false;

  if (
    /^(JORNADA|FECHA|HORA|LUGAR|CALENDARIO|CLASIFICACION|RESULTADOS|VER ACTA|DESCANSO|TEMPORADA)/
      .test(n)
  ) {
    return false;
  }

  if (
    /^\d{1,2}:\d{2}H?$/.test(n) ||
    /^\d{2}[\/-]\d{2}[\/-]\d{4}$/.test(n) ||
    /^\d+\s*-\s*\d+$/.test(n)
  ) {
    return false;
  }

  const letters =
    (
      line.match(
        /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g
      ) || []
    ).length;

  return (
    letters >= 4 &&
    (
      isRivas(line) ||
      /FUTSAL|F\.S\.|\bFS\b|SALA|CLUB|CDE|C\.D\.|INTER|TORREJON|MOSTOLES|ALCORCON|ARGANDA|PINTO|COSLADA|VALLECAS|PARAISO|PILARISTAS|VILLALBA|SAN FERNANDO|MORAL|LEGANES/i
        .test(line) ||
      line === line.toUpperCase()
    )
  );
}

function getRound(text='') {

  const m =
    String(text)
      .match(
        /JORNADA\s*(?:N[º°.]?\s*)?(\d+)/i
      );

  return m
    ? Number(m[1])
    : null;
}

function getDate(text='') {

  const m =
    String(text)
      .match(
        /\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/
      );

  if (!m)
    return null;

  return (
    `${m[3]}-` +
    `${String(m[2]).padStart(2,'0')}-` +
    `${String(m[1]).padStart(2,'0')}`
  );
}

function cellText(cell='') {

  return decode(
    String(cell)
      .replace(
        /<script[\s\S]*?<\/script>/gi,
        ' '
      )
      .replace(
        /<style[\s\S]*?<\/style>/gi,
        ' '
      )
      .replace(
        /<br\s*\/?>/gi,
        ' '
      )
      .replace(
        /<[^>]+>/g,
        ' '
      )
  )
  .replace(/\s+/g,' ')
  .trim();
}

function makeFixture(
  source,
  {
    round,
    date,
    time,
    home,
    away,
    score,
    venue
  }
) {

  return {
    round:round || null,
    date:date || null,
    time:time || null,
    home,
    away,
    score:score || null,
    venue:venue || null,

    competition:source.competition,
    group:source.group,
    competitionName:source.competitionName,

    officialTeamName:
      source.officialTeamName,

    team:source.team,
    section:source.section,

    rffmUrl:
      `https://www.rffm.es/competicion/calendario` +
      `?competicion=${source.competition}` +
      `&grupo=${source.group}` +
      `&temporada=${SEASON}` +
      `&tipojuego=${TYPE}`
  };
}

function findTime(text='') {

  const m =
    String(text)
      .match(
        /\b([01]?\d|2[0-3]):([0-5]\d)\b/
      );

  return m
    ? `${String(m[1]).padStart(2,'0')}:${m[2]}`
    : null;
}

function findScore(text='') {

  const m =
    String(text)
      .match(
        /\b(\d{1,2})\s*[-–]\s*(\d{1,2})\b/
      );

  return m
    ? `${m[1]} - ${m[2]}`
    : null;
}

function parseCalendar(
  html,
  source
) {

  const out = [];

  let activeRound = null;
  let activeDate = null;

  const rows = [
    ...String(html)
      .matchAll(
        /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi
      )
  ].map(m => m[1]);

  for (const rowHtml of rows) {

    const rowText =
      cellText(rowHtml);

    activeRound =
      getRound(rowText) ||
      activeRound;

    activeDate =
      getDate(rowText) ||
      activeDate;

    if (!isRivas(rowText))
      continue;

    const cells = [
      ...rowHtml.matchAll(
        /<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi
      )
    ]
      .map(m => cellText(m[1]))
      .filter(Boolean);

    if (!cells.length)
      continue;

    const teamCells =
      cells
        .map(
          (text,i) => ({text,i})
        )
        .filter(
          x => looksLikeTeam(x.text)
        );

    let ri =
      teamCells.findIndex(
        x =>
          sameRivas(
            x.text,
            source.officialTeamName
          )
      );

    if (ri < 0) {
      ri =
        teamCells.findIndex(
          x => isRivas(x.text)
        );
    }

    if (ri < 0)
      continue;

    const rv =
      teamCells[ri];

    const rivals =
      teamCells.filter(
        (x,i) =>
          i !== ri &&
          !isRivas(x.text)
      );

    if (!rivals.length)
      continue;

    rivals.sort(
      (a,b) =>
        Math.abs(a.i-rv.i) -
        Math.abs(b.i-rv.i)
    );

    const rival =
      rivals[0];

    const rivasHome =
      rv.i < rival.i;

    const date =
      getDate(rowText) ||
      activeDate;

    const round =
      getRound(rowText) ||
      activeRound;

    const venueCell =
      cells.find(
        c =>
          /POLID|PABELL|P\.M\.|PARQUE|CAMPO|INSTALACI|RIVAS\s*-|MUNICIPAL/i
            .test(c) &&
          !isRivas(c)
      );

    out.push(
      makeFixture(
        source,
        {
          round,
          date,
          time:findTime(rowText),

          home:
            rivasHome
              ? rv.text
              : rival.text,

          away:
            rivasHome
              ? rival.text
              : rv.text,

          score:
            findScore(rowText),

          venue:
            venueCell || null
        }
      )
    );
  }

  if (out.length)
    return out;

  const ls =
    lines(html);

  const meta = [];

  activeRound = null;
  activeDate = null;

  for (
    let i=0;
    i<ls.length;
    i++
  ) {

    const r =
      getRound(ls[i]);

    const d =
      getDate(ls[i]);

    if (r)
      activeRound = r;

    if (d)
      activeDate = d;

    meta[i] = {
      round:activeRound,
      date:activeDate
    };
  }

  const teams =
    ls
      .map(
        (line,i) => ({line,i})
      )
      .filter(
        x => looksLikeTeam(x.line)
      );

  for (
    let t=0;
    t<teams.length;
    t++
  ) {

    if (
      !sameRivas(
        teams[t].line,
        source.officialTeamName
      ) &&
      !isRivas(
        teams[t].line
      )
    ) {
      continue;
    }

    const rv =
      teams[t];

    const candidates = [];

    for (
      let j=Math.max(0,t-2);
      j<=Math.min(
        teams.length-1,
        t+2
      );
      j++
    ) {

      if (
        j === t ||
        isRivas(
          teams[j].line
        )
      ) {
        continue;
      }

      candidates.push(
        teams[j]
      );
    }

    if (!candidates.length)
      continue;

    candidates.sort(
      (a,b) =>
        Math.abs(a.i-rv.i) -
        Math.abs(b.i-rv.i)
    );

    const rival =
      candidates[0];

    if (
      Math.abs(
        rival.i-rv.i
      ) > 14
    ) {
      continue;
    }

    const lo =
      Math.max(
        0,
        Math.min(
          rv.i,
          rival.i
        ) - 8
      );

    const hi =
      Math.min(
        ls.length,
        Math.max(
          rv.i,
          rival.i
        ) + 9
      );

    const around =
      ls
        .slice(lo,hi)
        .join(' ');

    let round =
      meta[rv.i]?.round ||
      getRound(around);

    let date =
      meta[rv.i]?.date ||
      getDate(around);

    if (!date) {

      for (
        let k=lo;
        k<hi;
        k++
      ) {

        const d =
          getDate(ls[k]);

        if (d) {
          date = d;
          break;
        }
      }
    }

    const rivasHome =
      rv.i < rival.i;

    const venueLine =
      ls
        .slice(lo,hi)
        .find(
          c =>
            /POLID|PABELL|P\.M\.|PARQUE|CAMPO|INSTALACI|MUNICIPAL/i
              .test(c) &&
            !isRivas(c)
        );

    out.push(
      makeFixture(
        source,
        {
          round,
          date,
          time:
            findTime(around),

          home:
            rivasHome
              ? rv.line
              : rival.line,

          away:
            rivasHome
              ? rival.line
              : rv.line,

          score:
            findScore(around),

          venue:
            venueLine || null
        }
      )
    );
  }

  return out;
}

function dedupeSources(list) {

  const m =
    new Map();

  for (const s of list) {

    const k =
      `${s.section}|${s.team}`;

    if (!m.has(k))
      m.set(k,s);
  }

  return [...m.values()];
}

function dedupeFixtures(list) {

  const m =
    new Map();

  for (const f of list) {

    const k =
      `${f.section}|` +
      `${f.team}|` +
      `${f.round}|` +
      `${f.date}|` +
      `${canonical(f.home)}|` +
      `${canonical(f.away)}`;

    if (!m.has(k))
      m.set(k,f);
  }

  return [...m.values()];
}

async function buildPayload() {

  const extra =
    await Promise.race([
      discoverExtraSources(),
      new Promise(
        r =>
          setTimeout(
            () => r([]),
            6000
          )
      )
    ]);

  const sources =
    dedupeSources([
      ...extra,
      ...FIXED
    ]);

  const calendarResults =
    await Promise.allSettled(
      sources.map(
        async source => {

          const page =
            await fetchFederationHtml(
              source
            );

          return {
            source,
            page,
            fixtures:
              parseCalendar(
                page.html,
                source
              )
          };
        }
      )
    );

  let all = [];
  let ok = 0;
  let failed = 0;

  const modes = {};
  const errors = [];

  for (
    const r of calendarResults
  ) {

    if (
      r.status === 'fulfilled'
    ) {

      ok++;

      all.push(
        ...r.value.fixtures
      );

      modes[
        r.value.source.team
      ] =
        r.value.page.mode;

    } else {

      failed++;

      errors.push(
        String(
          r.reason?.message ||
          r.reason
        )
      );
    }
  }

  all =
    dedupeFixtures(all);

  const today =
    new Date();

  today.setHours(
    0,0,0,0
  );

  const byTeam =
    new Map();

  for (const f of all) {

    const k =
      `${f.section}|${f.team}`;

    if (!byTeam.has(k))
      byTeam.set(k,[]);

    byTeam
      .get(k)
      .push(f);
  }

  const upcoming = [];
  const results = [];

  for (
    const list of
    byTeam.values()
  ) {

    const future =
      list
        .filter(
          f =>
            f.date &&
            new Date(
              `${f.date}T12:00:00`
            ) >= today
        )
        .sort(
          (a,b) =>
            a.date.localeCompare(
              b.date
            ) ||
            (a.round || 0) -
            (b.round || 0)
        );

    if (future[0])
      upcoming.push(
        future[0]
      );

    const past =
      list
        .filter(
          f =>
            f.date &&
            new Date(
              `${f.date}T12:00:00`
            ) < today &&
            f.score
        )
        .sort(
          (a,b) =>
            b.date.localeCompare(
              a.date
            ) ||
            (b.round || 0) -
            (a.round || 0)
        );

    if (past[0])
      results.push(
        past[0]
      );
  }

  upcoming.sort(
    (a,b) =>
      (a.date || '')
        .localeCompare(
          b.date || ''
        ) ||
      a.team.localeCompare(
        b.team,
        'es'
      )
  );

  results.sort(
    (a,b) =>
      (b.date || '')
        .localeCompare(
          a.date || ''
        )
  );

  return {
    upcoming,
    results,

    sourceTeams:
      sources.map(
        s =>
          `${s.section}|${s.team}`
      ),

    detectedTeams:
      [...byTeam.keys()],

    updatedAt:
      new Date().toISOString(),

    source:'RFFM',

    diagnostics:{
      sources:sources.length,
      calendarsOk:ok,
      calendarsFailed:failed,
      fixtures:all.length,
      modes,
      parser:
        'v17-real-calendar-modern-fallback',
      errors:
        errors.slice(0,5)
    }
  };
}

exports.handler =
  async function() {

    try {

      const data =
        await buildPayload();

      return {
        statusCode:200,

        headers:{
          'content-type':
            'application/json; charset=utf-8',

          'cache-control':
            'public, max-age=300, s-maxage=900',

          'access-control-allow-origin':
            '*'
        },

        body:
          JSON.stringify(data)
      };

    } catch (err) {

      return {
        statusCode:500,

        headers:{
          'content-type':
            'application/json; charset=utf-8',

          'cache-control':
            'no-store'
        },

        body:
          JSON.stringify({
            error:
              'No se ha podido sincronizar con RFFM.',

            detail:
              String(
                err?.message ||
                err
              )
          })
      };
    }
};

exports._test = {
  parseCalendar,
  identity,
  sameRivas,
  canonical
};

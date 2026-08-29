import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');

const OUTPUT = path.join(
  ROOT,
  'assets',
  'data',
  'partidos.json'
);

const CLUB_URL =
  'https://www.elbalondemadrid.es/club/16661228';

const SEASON_RE =
  /2026\s*\/\s*(?:27|2027)/i;

const FIXED = [
  {
    competition: '26738221',
    group: '26771028',
    competitionName:
      'TERCERA DIVISIÓN DE FÚTBOL SALA',
    officialTeamName:
      'CD RIVAS FUTSAL - YOUFIRST SMART FINACE',
    team: 'Tercera División',
    section: 'Masculina'
  },
  {
    competition: '26749998',
    group: '26814437',
    competitionName:
      'PRIMERA DIVISION AUTONOMICA JUVENIL SALA',
    officialTeamName:
      "CD RIVAS FUTSAL - YOUFIRST SMART FINACE 'A'",
    team: 'Juvenil A',
    section: 'Masculina'
  },
  {
    competition: '26738220',
    group: '26878012',
    competitionName:
      'PREFERENTE JUVENIL SALA',
    officialTeamName:
      "CD RIVAS FUTSAL - YOUFIRST SMART FINACE 'B'",
    team: 'Juvenil B',
    section: 'Masculina'
  },
  {
    competition: '26738292',
    group: '26738293',
    competitionName:
      'PRIMERA DIVISION AUTONOMICA CADETE SALA',
    officialTeamName:
      "CD RIVAS FUTSAL - YOUFIRST SMART FINACE 'A'",
    team: 'Cadete Autonómica',
    section: 'Masculina'
  },
  {
    competition: '26750003',
    group: '26877982',
    competitionName:
      'PREFERENTE CADETE SALA',
    officialTeamName:
      "CD RIVAS FUTSAL - YOUFIRST SMART FINACE 'B'",
    team: 'Cadete B',
    section: 'Masculina'
  }
];

function stripAccents(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function norm(value = '') {
  return stripAccents(value)
    .toUpperCase()
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function isRivas(value = '') {
  return /(?:CDB?|C\.?D\.?)\s+RIVAS\s+FUTSAL/i.test(
    String(value)
  );
}

function suffix(value = '') {
  return (
    norm(value).match(
      /(?:^|\s)'?([A-Z])'?\s*$/
    )?.[1] || null
  );
}

function identity(
  competitionName,
  officialTeamName
) {
  const c = norm(competitionName);
  const s = suffix(officialTeamName);
  const female = /FEMENIN/.test(c);

  if (female) {
    if (/JUVENIL/.test(c)) {
      return {
        team: 'Juvenil A',
        section: 'Femenina'
      };
    }

    if (/CADETE/.test(c)) {
      return {
        team: 'Cadete A',
        section: 'Femenina'
      };
    }

    if (/INFANTIL/.test(c)) {
      return {
        team: 'Infantil A',
        section: 'Femenina'
      };
    }

    if (/ALEVIN/.test(c)) {
      return {
        team: 'Alevín A',
        section: 'Femenina'
      };
    }

    return null;
  }

  if (/TERCERA/.test(c)) {
    return {
      team: 'Tercera División',
      section: 'Masculina'
    };
  }

  if (
    /JUVENIL/.test(c) &&
    /AUTONOMICA/.test(c) &&
    s !== 'B'
  ) {
    return {
      team: 'Juvenil A',
      section: 'Masculina'
    };
  }

  if (
    /JUVENIL/.test(c) &&
    s === 'B'
  ) {
    return {
      team: 'Juvenil B',
      section: 'Masculina'
    };
  }

  if (
    /CADETE/.test(c) &&
    /AUTONOMICA/.test(c) &&
    s !== 'B'
  ) {
    return {
      team: 'Cadete Autonómica',
      section: 'Masculina'
    };
  }

  if (
    /CADETE/.test(c) &&
    s === 'B'
  ) {
    return {
      team: 'Cadete B',
      section: 'Masculina'
    };
  }

  if (
    /INFANTIL/.test(c) &&
    /PREFERENTE/.test(c) &&
    s !== 'B'
  ) {
    return {
      team: 'Infantil Preferente',
      section: 'Masculina'
    };
  }

  if (
    /INFANTIL/.test(c) &&
    s === 'B'
  ) {
    return {
      team: 'Infantil B',
      section: 'Masculina'
    };
  }

  if (
    /ALEVIN/.test(c) &&
    s === 'A'
  ) {
    return {
      team: 'Alevín A',
      section: 'Masculina'
    };
  }

  if (
    /ALEVIN/.test(c) &&
    s === 'B'
  ) {
    return {
      team: 'Alevín B',
      section: 'Masculina'
    };
  }

  if (/PREBENJAMIN/.test(c)) {
    return {
      team: 'Prebenjamín A',
      section: 'Masculina'
    };
  }

  if (/BENJAMIN/.test(c)) {
    return {
      team: 'Benjamín A',
      section: 'Masculina'
    };
  }

  return null;
}

function dedupeSources(list) {
  const map = new Map();

  for (const source of list) {
    const key =
      `${source.section}|${source.team}`;

    if (!map.has(key)) {
      map.set(key, source);
    }
  }

  return [...map.values()];
}

function findDate(text = '') {
  const match = String(text).match(
    /\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/
  );

  if (!match) {
    return null;
  }

  return (
    `${match[3]}-` +
    `${String(match[2]).padStart(2, '0')}-` +
    `${String(match[1]).padStart(2, '0')}`
  );
}

function findTime(text = '') {
  const match = String(text).match(
    /\b([01]?\d|2[0-3]):([0-5]\d)\b/
  );

  return match
    ? `${String(match[1]).padStart(2, '0')}:${match[2]}`
    : null;
}

function findRound(text = '') {
  const match = String(text).match(
    /JORNADA\s*(?:N[º°.]?\s*)?(\d+)/i
  );

  return match
    ? Number(match[1])
    : null;
}

function findScore(text = '') {
  const lines = String(text).split(/\n+/);

  for (const line of lines) {
    const match = line
      .trim()
      .match(
        /^(\d{1,2})\s*[-–]\s*(\d{1,2})$/
      );

    if (match) {
      return `${match[1]} - ${match[2]}`;
    }
  }

  return null;
}

function findVenue(text = '') {
  return (
    String(text)
      .split(/\n+/)
      .map(x => x.trim())
      .find(
        line =>
          /PABELL|POLID|P\.M\.|PARQUE|MUNICIPAL|INSTALACI|CAMPO/i.test(
            line
          ) &&
          !isRivas(line)
      ) || null
  );
}

function plausibleOpponent(line = '') {
  const n = norm(line);

  if (!line || line.length > 180) {
    return false;
  }

  if (isRivas(line)) {
    return false;
  }

  if (
    /^(JORNADA|ACTUAL|FECHA|HORA|LUGAR|CAMPO|LOCALIDAD|RESULTADOS|CLASIFICACION|CALENDARIO|TEMPORADA|VER CLASIFICACION)/.test(
      n
    )
  ) {
    return false;
  }

  if (
    /^\d+$/.test(n) ||
    /^\d{1,2}:\d{2}$/.test(n) ||
    /^\d{1,2}[\/-]\d{1,2}[\/-]\d{4}$/.test(
      n
    ) ||
    /^\d{1,2}\s*[-–]\s*\d{1,2}$/.test(n)
  ) {
    return false;
  }

  const letters =
    (
      line.match(
        /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g
      ) || []
    ).length;

  return letters >= 4;
}

function makeFixture(source, data) {
  return {
    round: data.round || null,
    date: data.date || null,
    time: data.time || null,
    home: data.home,
    away: data.away,
    score: data.score || null,
    venue: data.venue || null,

    competition: source.competition,
    group: source.group,
    competitionName:
      source.competitionName,
    officialTeamName:
      source.officialTeamName,
    team: source.team,
    section: source.section,

    sourceUrl:
      `https://www.elbalondemadrid.es/competicion/` +
      `${source.competition}/grupo/` +
      `${source.group}/jornadas`,

    rffmUrl:
      `https://www.rffm.es/competicion/calendario` +
      `?competicion=${source.competition}` +
      `&grupo=${source.group}` +
      `&temporada=22` +
      `&tipojuego=3`
  };
}

function parseBodyFallback(
  source,
  pageText
) {
  const lines = String(pageText)
    .split(/\n+/)
    .map(x => x.trim())
    .filter(Boolean);

  for (
    let i = 0;
    i < lines.length;
    i++
  ) {
    if (!isRivas(lines[i])) {
      continue;
    }

    for (
      let distance = 1;
      distance <= 8;
      distance++
    ) {
      for (
        const idx of [
          i - distance,
          i + distance
        ]
      ) {
        if (
          idx < 0 ||
          idx >= lines.length
        ) {
          continue;
        }

        const rival = lines[idx];

        if (
          !plausibleOpponent(rival)
        ) {
          continue;
        }

        const start = Math.max(
          0,
          Math.min(i, idx) - 8
        );

        const end = Math.min(
          lines.length,
          Math.max(i, idx) + 9
        );

        const context = lines
          .slice(start, end)
          .join('\n');

        const rivasHome =
          i < idx;

        return makeFixture(
          source,
          {
            round:
              findRound(context),
            date:
              findDate(context),
            time:
              findTime(context),

            home:
              rivasHome
                ? lines[i]
                : rival,

            away:
              rivasHome
                ? rival
                : lines[i],

            score:
              findScore(context),

            venue:
              findVenue(context)
          }
        );
      }
    }
  }

  return null;
}

async function discoverSources(
  context
) {
  const page =
    await context.newPage();

  await page.goto(
    CLUB_URL,
    {
      waitUntil:
        'domcontentloaded',
      timeout: 45000
    }
  );

  await page.waitForTimeout(1200);

  const links =
    await page
      .locator(
        'a[href*="/equipo/"]'
      )
      .evaluateAll(
        elements => [
          ...new Set(
            elements
              .map(
                element =>
                  element.href
              )
              .filter(Boolean)
          )
        ]
      );

  await page.close();

  const found = [];

  for (
    const url of links.slice(
      0,
      50
    )
  ) {
    const teamPage =
      await context.newPage();

    try {
      await teamPage.goto(
        url,
        {
          waitUntil:
            'domcontentloaded',
          timeout: 35000
        }
      );

      await teamPage.waitForTimeout(
        500
      );

      const bodyText =
        await teamPage
          .locator('body')
          .innerText()
          .catch(() => '');

      if (
        !SEASON_RE.test(
          bodyText
        )
      ) {
        continue;
      }

      const officialTeamName =
        (
          await teamPage
            .locator('h1')
            .first()
            .innerText()
            .catch(() => '')
        ).trim();

      if (
        !isRivas(
          officialTeamName
        )
      ) {
        continue;
      }

      const title =
        await teamPage.title();

      const titleMatch =
        title.match(
          /—\s*(.*?)\s+2026\s*\/\s*(?:27|2027)/i
        );

      const competitionName =
        (
          titleMatch?.[1] || ''
        ).trim();

      if (!competitionName) {
        continue;
      }

      const hrefs =
        await teamPage
          .locator(
            'a[href*="/competicion/"][href*="/grupo/"]'
          )
          .evaluateAll(
            elements =>
              elements
                .map(
                  element =>
                    element.href
                )
                .filter(Boolean)
          );

      const href =
        hrefs.find(
          x =>
            /\/jornadas(?:[?#/]|$)/i.test(
              x
            )
        ) ||
        hrefs.find(
          x =>
            /\/clasificacion(?:[?#/]|$)/i.test(
              x
            )
        ) ||
        hrefs[0];

      if (!href) {
        continue;
      }

      const match =
        href.match(
          /\/competicion\/(\d+)\/grupo\/(\d+)/i
        );

      if (!match) {
        continue;
      }

      const category =
        identity(
          competitionName,
          officialTeamName
        );

      if (!category) {
        continue;
      }

      found.push({
        competition: match[1],
        group: match[2],
        competitionName,
        officialTeamName,
        ...category
      });

    } catch (error) {

      console.log(
        `No se pudo leer ${url}: ${error.message}`
      );

    } finally {

      await teamPage.close();
    }
  }

  return dedupeSources([
    ...found,
    ...FIXED
  ]);
}

async function extractCalendar(
  page,
  source
) {
  const url =
    `https://www.elbalondemadrid.es/competicion/` +
    `${source.competition}/grupo/` +
    `${source.group}/jornadas`;

  await page.goto(
    url,
    {
      waitUntil:
        'domcontentloaded',
      timeout: 45000
    }
  );

  await page
    .waitForLoadState(
      'networkidle',
      {
        timeout: 15000
      }
    )
    .catch(() => {});

  await page
    .waitForFunction(
      () =>
        !/Cargando jornada/i.test(
          document.body.innerText
        ),
      null,
      {
        timeout: 20000
      }
    )
    .catch(() => {});

  await page.waitForTimeout(1200);

  const pageText =
    await page
      .locator('body')
      .innerText()
      .catch(() => '');

  const cards =
    await page.evaluate(
      () => {
        const unique =
          values => [
            ...new Set(
              values
                .map(
                  value =>
                    value.trim()
                )
                .filter(Boolean)
            )
          ];

        const rivasAnchors = [
          ...document.querySelectorAll(
            'a[href*="/equipo/"]'
          )
        ].filter(
          anchor =>
            /RIVAS\s+FUTSAL/i.test(
              anchor.innerText || ''
            )
        );

        const cards = [];

        for (
          const anchor
          of rivasAnchors
        ) {
          let node = anchor;

          for (
            let depth = 0;
            depth < 9 && node;
            depth++,
            node =
              node.parentElement
          ) {
            const teamLinks =
              unique(
                [
                  ...node.querySelectorAll(
                    'a[href*="/equipo/"]'
                  )
                ].map(
                  element =>
                    element.innerText || ''
                )
              );

            const text =
              (
                node.innerText || ''
              ).trim();

            if (
              teamLinks.length >= 2 &&
              teamLinks.length <= 4 &&
              text.length > 0 &&
              text.length < 2200
            ) {
              cards.push({
                text,
                teams: teamLinks
              });

              break;
            }
          }
        }

        const seen =
          new Set();

        return cards.filter(
          card => {
            const key =
              `${card.teams.join('|')}|${card.text}`;

            if (seen.has(key)) {
              return false;
            }

            seen.add(key);
            return true;
          }
        );
      }
    );

  const fixtures = [];

  for (const card of cards) {
    const teams =
      [...new Set(card.teams)];

    const rivasIndex =
      teams.findIndex(
        team =>
          /(?:CDB?|C\.?D\.?)\s+RIVAS\s+FUTSAL/i.test(
            team
          )
      );

    const rivalIndex =
      teams.findIndex(
        (team, index) =>
          index !== rivasIndex &&
          !/(?:CDB?|C\.?D\.?)\s+RIVAS\s+FUTSAL/i.test(
            team
          )
      );

    if (
      rivasIndex < 0 ||
      rivalIndex < 0
    ) {
      continue;
    }

    const rivas =
      teams[rivasIndex];

    const rival =
      teams[rivalIndex];

    const rivasHome =
      rivasIndex < rivalIndex;

    fixtures.push(
      makeFixture(
        source,
        {
          round:
            findRound(card.text) ||
            findRound(pageText),

          date:
            findDate(card.text) ||
            findDate(pageText),

          time:
            findTime(card.text),

          home:
            rivasHome
              ? rivas
              : rival,

          away:
            rivasHome
              ? rival
              : rivas,

          score:
            findScore(card.text),

          venue:
            findVenue(card.text)
        }
      )
    );
  }

  if (fixtures.length) {
    return {
      fixtures,
      mode: 'rendered-dom',
      chars: pageText.length
    };
  }

  const fallback =
    parseBodyFallback(
      source,
      pageText
    );

  return {
    fixtures:
      fallback
        ? [fallback]
        : [],

    mode:
      fallback
        ? 'rendered-text'
        : 'no-fixture',

    chars:
      pageText.length
  };
}

function dedupeFixtures(
  fixtures
) {
  const map = new Map();

  for (
    const fixture
    of fixtures
  ) {
    const key =
      `${fixture.section}|` +
      `${fixture.team}|` +
      `${fixture.round}|` +
      `${fixture.date}|` +
      `${norm(fixture.home)}|` +
      `${norm(fixture.away)}`;

    if (!map.has(key)) {
      map.set(
        key,
        fixture
      );
    }
  }

  return [...map.values()];
}

function selectMatches(
  fixtures
) {
  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  const byTeam =
    new Map();

  for (
    const fixture
    of fixtures
  ) {
    const key =
      `${fixture.section}|${fixture.team}`;

    if (!byTeam.has(key)) {
      byTeam.set(
        key,
        []
      );
    }

    byTeam
      .get(key)
      .push(fixture);
  }

  const upcoming = [];
  const results = [];

  for (
    const list
    of byTeam.values()
  ) {
    const future =
      list
        .filter(
          fixture =>
            fixture.date &&
            new Date(
              `${fixture.date}T12:00:00`
            ) >= today
        )
        .sort(
          (a, b) =>
            a.date.localeCompare(
              b.date
            ) ||
            (a.round || 0) -
            (b.round || 0)
        );

    if (future[0]) {
      upcoming.push(
        future[0]
      );
    }

    const past =
      list
        .filter(
          fixture =>
            fixture.date &&
            fixture.score &&
            new Date(
              `${fixture.date}T12:00:00`
            ) < today
        )
        .sort(
          (a, b) =>
            b.date.localeCompare(
              a.date
            )
        );

    if (past[0]) {
      results.push(
        past[0]
      );
    }
  }

  upcoming.sort(
    (a, b) =>
      (a.date || '').localeCompare(
        b.date || ''
      )
  );

  return {
    upcoming,
    results,
    detectedTeams:
      [...byTeam.keys()]
  };
}

async function readPrevious() {
  try {
    return JSON.parse(
      await fs.readFile(
        OUTPUT,
        'utf8'
      )
    );
  } catch {
    return null;
  }
}

const browser =
  await chromium.launch({
    headless: true
  });

const context =
  await browser.newContext({
    locale: 'es-ES',
    timezoneId:
      'Europe/Madrid'
  });

try {

  const sources =
    await discoverSources(
      context
    );

  console.log(
    `Equipos encontrados: ${sources.length}`
  );

  const allFixtures = [];
  const teamDiagnostics = {};

  for (
    const source
    of sources
  ) {
    const page =
      await context.newPage();

    try {

      const result =
        await extractCalendar(
          page,
          source
        );

      allFixtures.push(
        ...result.fixtures
      );

      teamDiagnostics[
        `${source.section} ${source.team}`
      ] = {
        mode:
          result.mode,
        fixtures:
          result.fixtures.length,
        chars:
          result.chars
      };

      console.log(
        `${source.section} ${source.team}: ` +
        `${result.fixtures.length} partido(s)`
      );

    } catch (error) {

      teamDiagnostics[
        `${source.section} ${source.team}`
      ] = {
        mode: 'error',
        error:
          error.message
      };

      console.error(
        `${source.team}: ${error.message}`
      );

    } finally {

      await page.close();
    }
  }

  const fixtures =
    dedupeFixtures(
      allFixtures
    );

  if (
    fixtures.length === 0
  ) {
    throw new Error(
      'No se ha detectado ningún partido. ' +
      'Se conserva el JSON anterior.'
    );
  }

  const selected =
    selectMatches(
      fixtures
    );

  const payload = {
    upcoming:
      selected.upcoming,

    results:
      selected.results,

    sourceTeams:
      sources.map(
        source =>
          `${source.section}|${source.team}`
      ),

    detectedTeams:
      selected.detectedTeams,

    updatedAt:
      new Date().toISOString(),

    source:
      'Calendarios públicos RFFM',

    diagnostics: {
      scraper:
        'playwright-cloudflare-v1',
      sources:
        sources.length,
      fixtures:
        fixtures.length,
      teams:
        teamDiagnostics
    }
  };

  const previous =
    await readPrevious();

  const previousCore =
    previous
      ? JSON.stringify({
          upcoming:
            previous.upcoming,
          results:
            previous.results,
          sourceTeams:
            previous.sourceTeams,
          detectedTeams:
            previous.detectedTeams
        })
      : null;

  const newCore =
    JSON.stringify({
      upcoming:
        payload.upcoming,
      results:
        payload.results,
      sourceTeams:
        payload.sourceTeams,
      detectedTeams:
        payload.detectedTeams
    });

  if (
    previousCore === newCore
  ) {
    console.log(
      'No hay cambios en los partidos.'
    );

    process.exit(0);
  }

  await fs.mkdir(
    path.dirname(OUTPUT),
    {
      recursive: true
    }
  );

  await fs.writeFile(
    OUTPUT,
    JSON.stringify(
      payload,
      null,
      2
    ) + '\n',
    'utf8'
  );

  console.log(
    `JSON actualizado: ${OUTPUT}`
  );

  console.log(
    `Partidos encontrados: ${fixtures.length}`
  );

  console.log(
    `Próximos: ${payload.upcoming.length}`
  );

} finally {

  await context.close();
  await browser.close();
}

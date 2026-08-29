'use strict';

const SEASON = 22; // Temporada 2026/27
const TYPE = 3;    // Fútbol sala

const CLUB_PAGE =
  'https://www.elbalondemadrid.es/club/16661228';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/151.0.0.0 Safari/537.36';


/* ==========================================================
   EQUIPOS QUE YA TENEMOS IDENTIFICADOS
   ========================================================== */

const FIXED = [

  {
    competition: '26738221',
    group: '26771028',
    competitionName: 'TERCERA DIVISIÓN DE FÚTBOL SALA',
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


/* ==========================================================
   TEXTO
   ========================================================== */

function decode(text = '') {

  return String(text)

    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")

    .replace(/&aacute;/gi, 'á')
    .replace(/&eacute;/gi, 'é')
    .replace(/&iacute;/gi, 'í')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&uacute;/gi, 'ú')
    .replace(/&ntilde;/gi, 'ñ')

    .replace(/&Aacute;/g, 'Á')
    .replace(/&Eacute;/g, 'É')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&Ntilde;/g, 'Ñ');
}


function stripAccents(text = '') {

  return String(text)

    .normalize('NFD')

    .replace(
      /[\u0300-\u036f]/g,
      ''
    );
}


function norm(text = '') {

  return stripAccents(
    decode(text)
  )

    .toUpperCase()

    .replace(/[“”]/g, '"')

    .replace(/[‘’]/g, "'")

    .replace(/\s+/g, ' ')

    .trim();
}


function plain(html = '') {

  return decode(

    String(html)

      .replace(
        /<script[\s\S]*?<\/script>/gi,
        ' '
      )

      .replace(
        /<style[\s\S]*?<\/style>/gi,
        ' '
      )

      .replace(
        /<(br|\/p|\/div|\/li|\/section|\/article|\/h[1-6]|\/tr|\/td|\/span|\/a)>/gi,
        '\n'
      )

      .replace(
        /<[^>]+>/g,
        ' '
      )

  );
}


function textLines(html = '') {

  return plain(html)

    .split(/\n+/)

    .map(
      line =>
        line
          .replace(/\s+/g, ' ')
          .trim()
    )

    .filter(Boolean);
}


function isRivas(text = '') {

  return (
    /(?:CDB?|C\.?D\.?)\s+RIVAS\s+FUTSAL/i
  ).test(
    String(text)
  );
}


function suffix(text = '') {

  return (
    norm(text)
      .match(
        /(?:^|\s)'?([A-Z])'?\s*$/
      )?.[1]
    ||
    null
  );
}


/* ==========================================================
   CATEGORÍAS
   ========================================================== */

function identity(
  competitionName,
  officialTeamName
) {

  const c =
    norm(competitionName);

  const s =
    suffix(officialTeamName);

  const female =
    /FEMENIN/.test(c);


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


/* ==========================================================
   FETCH
   ========================================================== */

async function fetchWithTimeout(
  url,
  options = {},
  timeout = 8000
) {

  const controller =
    new AbortController();


  const timer =
    setTimeout(
      () => controller.abort(),
      timeout
    );


  try {

    return await fetch(
      url,
      {
        ...options,
        signal: controller.signal
      }
    );

  } finally {

    clearTimeout(timer);
  }
}


function cookiesFromResponse(headers) {

  let cookies = [];


  if (
    typeof headers.getSetCookie ===
    'function'
  ) {

    cookies =
      headers.getSetCookie();
  }


  if (!cookies.length) {

    const raw =
      headers.get('set-cookie');

    if (raw) {

      cookies = [raw];
    }
  }


  return cookies

    .map(
      value =>
        value.split(';')[0]
    )

    .filter(Boolean)

    .join('; ');
}


/* ==========================================================
   SESIÓN RFFM
   ========================================================== */

async function createRffmSession() {

  const response =
    await fetchWithTimeout(

      'https://www.rffm.es/',

      {

        headers: {

          'user-agent':
            UA,

          'accept':
            'text/html,application/xhtml+xml,*/*;q=0.8',

          'accept-language':
            'es-ES,es;q=0.9'

        },

        redirect:
          'follow'
      },

      7000
    );


  return cookiesFromResponse(
    response.headers
  );
}


/* ==========================================================
   PÁGINA OFICIAL DE UNA JORNADA
   ========================================================== */

async function fetchRound(
  source,
  round,
  cookie
) {

  const url =

    'https://www.rffm.es/pnfg/NPcd/NFG_CmpJornada'

    +

    `?cod_primaria=1000120`

    +

    `&CodCompeticion=${source.competition}`

    +

    `&CodGrupo=${source.group}`

    +

    `&CodTemporada=${SEASON}`

    +

    `&CodJornada=${round}`

    +

    `&Sch_Tipo_Juego=${TYPE}`;


  const response =
    await fetchWithTimeout(

      url,

      {

        headers: {

          'user-agent':
            UA,

          'accept':
            'text/html,application/xhtml+xml,*/*;q=0.8',

          'accept-language':
            'es-ES,es;q=0.9',

          'referer':
            'https://www.rffm.es/',

          ...(cookie
            ? { cookie }
            : {})
        },

        redirect:
          'follow'
      },

      8000
    );


  if (!response.ok) {

    throw new Error(
      `RFFM ${response.status}`
    );
  }


  return {
    html:
      await response.text(),

    url
  };
}


/* ==========================================================
   FECHA / HORA / RESULTADO
   ========================================================== */

function getDate(text = '') {

  const m =
    String(text).match(

      /\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/

    );


  if (!m) {

    return null;
  }


  return (

    `${m[3]}-`

    +

    `${String(m[2]).padStart(2, '0')}-`

    +

    `${String(m[1]).padStart(2, '0')}`

  );
}


function getTime(text = '') {

  const m =
    String(text).match(

      /\b([01]?\d|2[0-3]):([0-5]\d)\b/

    );


  return m

    ? `${String(m[1]).padStart(2, '0')}:${m[2]}`

    : null;
}


function scoreFromCells(cells) {

  const score =
    cells.find(

      cell =>
        /^\s*\d{1,2}\s*[-–]\s*\d{1,2}\s*$/
          .test(cell)

    );


  return score

    ? score
        .replace(/–/g, '-')
        .replace(/\s+/g, ' ')
        .trim()

    : null;
}


/* ==========================================================
   PARSER DE UNA JORNADA NFG
   ========================================================== */

function cleanCell(html = '') {

  return decode(

    String(html)

      .replace(
        /<br\s*\/?>/gi,
        ' '
      )

      .replace(
        /<[^>]+>/g,
        ' '
      )

  )

    .replace(/\s+/g, ' ')

    .trim();
}


function looksLikeTeam(text = '') {

  const value =
    norm(text);


  if (!value) {

    return false;
  }


  if (text.length > 180) {

    return false;
  }


  if (
    /^(JORNADA|RESULTADOS|FECHA|HORA|CAMPO|LOCALIDAD|CLASIFICACION|CALENDARIO)/
      .test(value)
  ) {

    return false;
  }


  if (
    /^\d+$/.test(value) ||
    /^\d{1,2}:\d{2}$/.test(value) ||
    /^\d{1,2}[\/-]\d{1,2}[\/-]\d{4}$/
      .test(value) ||
    /^\d{1,2}\s*[-–]\s*\d{1,2}$/
      .test(value)
  ) {

    return false;
  }


  return (
    isRivas(text) ||
    /FUTSAL|FUTBOL SALA|\bF\.?S\.?\b|C\.?D\.?|CDE|CLUB|INTER|MOSTOLES|TORREJON|ARGANDA|PINTO|COSLADA|VALLECAS|PILARISTAS|LEGANES|ALCORCON|SAN FERNANDO/i
      .test(text)
  );
}


function parseRound(
  html,
  source,
  round
) {

  const fixtures = [];


  const rows = [

    ...String(html).matchAll(

      /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi

    )

  ];


  for (const row of rows) {

    const rowHtml =
      row[1];


    const rowText =
      cleanCell(rowHtml);


    if (!isRivas(rowText)) {

      continue;
    }


    const cells = [

      ...rowHtml.matchAll(

        /<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi

      )

    ]

      .map(
        match =>
          cleanCell(match[1])
      )

      .filter(Boolean);


    if (!cells.length) {

      continue;
    }


    const teams =
      cells.filter(
        looksLikeTeam
      );


    const rivasIndex =
      teams.findIndex(
        team =>
          isRivas(team)
      );


    if (
      rivasIndex < 0 ||
      teams.length < 2
    ) {

      continue;
    }


    const rivas =
      teams[rivasIndex];


    let rival = null;


    if (rivasIndex > 0) {

      rival =
        teams[rivasIndex - 1];
    }


    if (
      !rival ||
      isRivas(rival)
    ) {

      rival =
        teams.find(
          team =>
            !isRivas(team)
        );
    }


    if (!rival) {

      continue;
    }


    const teamPositions =
      cells
        .map(
          (cell, index) => ({
            cell,
            index
          })
        )
        .filter(
          item =>
            looksLikeTeam(item.cell)
        );


    const rivasPosition =
      teamPositions.find(
        item =>
          isRivas(item.cell)
      );


    const rivalPosition =
      teamPositions.find(
        item =>
          item.cell === rival
      );


    const rivasHome =
      (
        rivasPosition &&
        rivalPosition
      )

        ? rivasPosition.index <
          rivalPosition.index

        : rivasIndex === 0;


    const date =
      getDate(rowText);


    const time =
      getTime(rowText);


    const score =
      scoreFromCells(cells);


    const venue =
      cells.find(

        cell =>
          /PABELL|POLID|P\.M\.|PARQUE|MUNICIPAL|CAMPO|INSTALACI/i
            .test(cell)

          &&

          !isRivas(cell)
      )

      || null;


    fixtures.push({

      round,

      date,

      time,

      home:
        rivasHome
          ? rivas
          : rival,

      away:
        rivasHome
          ? rival
          : rivas,

      score,

      venue,

      team:
        source.team,

      section:
        source.section,

      competition:
        source.competition,

      group:
        source.group,

      competitionName:
        source.competitionName,

      officialTeamName:
        source.officialTeamName,

      rffmUrl:
        `https://www.rffm.es/competicion/calendario` +
        `?competicion=${source.competition}` +
        `&grupo=${source.group}` +
        `&temporada=${SEASON}` +
        `&tipojuego=${TYPE}`

    });
  }


  /*
   * Fallback por texto,
   * por si RFFM cambia la tabla.
   */

  if (!fixtures.length) {

    const lines =
      textLines(html);


    const rivasIndexes = [];


    for (
      let i = 0;
      i < lines.length;
      i++
    ) {

      if (
        isRivas(lines[i])
      ) {

        rivasIndexes.push(i);
      }
    }


    for (
      const index
      of rivasIndexes
    ) {

      const before =
        lines[index - 1] || '';

      const after =
        lines[index + 1] || '';


      let rival = null;
      let rivasHome = true;


      if (
        looksLikeTeam(before) &&
        !isRivas(before)
      ) {

        rival = before;
        rivasHome = false;

      } else if (
        looksLikeTeam(after) &&
        !isRivas(after)
      ) {

        rival = after;
        rivasHome = true;
      }


      if (!rival) {

        continue;
      }


      const start =
        Math.max(
          0,
          index - 8
        );


      const end =
        Math.min(
          lines.length,
          index + 9
        );


      const context =
        lines
          .slice(start, end)
          .join(' ');


      const date =
        getDate(context);


      const time =
        getTime(context);


      fixtures.push({

        round,

        date,

        time,

        home:
          rivasHome
            ? lines[index]
            : rival,

        away:
          rivasHome
            ? rival
            : lines[index],

        score:
          null,

        venue:
          lines
            .slice(start, end)
            .find(
              line =>
                /PABELL|POLID|P\.M\.|PARQUE|MUNICIPAL/i
                  .test(line)
            )
          || null,

        team:
          source.team,

        section:
          source.section,

        competition:
          source.competition,

        group:
          source.group,

        competitionName:
          source.competitionName,

        officialTeamName:
          source.officialTeamName,

        rffmUrl:
          `https://www.rffm.es/competicion/calendario` +
          `?competicion=${source.competition}` +
          `&grupo=${source.group}` +
          `&temporada=${SEASON}` +
          `&tipojuego=${TYPE}`

      });
    }
  }


  return fixtures;
}


/* ==========================================================
   DESCUBRIR OTROS EQUIPOS DEL CLUB
   ========================================================== */

async function fetchText(
  url,
  timeout = 5000
) {

  const response =
    await fetchWithTimeout(

      url,

      {

        headers: {

          'user-agent': UA,

          'accept':
            'text/html,application/xhtml+xml,*/*;q=0.8'
        },

        redirect: 'follow'
      },

      timeout
    );


  if (!response.ok) {

    throw new Error(
      `${response.status}`
    );
  }


  return await response.text();
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

        /\/equipo\/(\d+)/gi

      )

    ].map(
      match => match[1]
    );


    const unique =
      [...new Set(ids)]
        .slice(0, 40);


    const responses =
      await Promise.allSettled(

        unique.map(

          async id => {

            const html =
              await fetchText(

                `https://www.elbalondemadrid.es/equipo/${id}`,

                5000
              );


            const pageText =
              plain(html)
                .replace(/\s+/g, ' ')
                .trim();


            if (
              !/2026\/27|2026\/2027/i
                .test(pageText)
            ) {

              return null;
            }


            const teamName =

              cleanCell(

                html.match(

                  /<h1[^>]*>([\s\S]*?)<\/h1>/i

                )?.[1]

                ||

                ''

              );


            if (
              !teamName ||
              !isRivas(teamName)
            ) {

              return null;
            }


            const link =
              html.match(

                /\/competicion\/(\d+)\/grupo\/(\d+)/i

              );


            if (!link) {

              return null;
            }


            let competitionName =

              decode(

                html.match(

                  /<title[^>]*>([\s\S]*?)<\/title>/i

                )?.[1]

                ||

                ''

              );


            competitionName =
              competitionName

                .replace(
                  /<[^>]+>/g,
                  ' '
                )

                .replace(
                  /^Plantilla de .*?—/i,
                  ''
                )

                .replace(
                  /2026\/27.*$/i,
                  ''
                )

                .replace(/\s+/g, ' ')

                .trim();


            if (!competitionName) {

              return null;
            }


            const category =
              identity(
                competitionName,
                teamName
              );


            if (!category) {

              return null;
            }


            return {

              competition:
                link[1],

              group:
                link[2],

              competitionName,

              officialTeamName:
                teamName,

              ...category
            };
          }
        )
      );


    return responses

      .map(

        result =>
          result.status === 'fulfilled'
            ? result.value
            : null

      )

      .filter(Boolean);

  } catch (_) {

    return [];
  }
}


/* ==========================================================
   FUENTES SIN DUPLICADOS
   ========================================================== */

function dedupeSources(list) {

  const map =
    new Map();


  for (const source of list) {

    const key =
      `${source.section}|${source.team}`;


    if (!map.has(key)) {

      map.set(
        key,
        source
      );
    }
  }


  return [
    ...map.values()
  ];
}


/* ==========================================================
   OBTENER PRÓXIMO PARTIDO
   ========================================================== */

async function getTeamMatches(
  source,
  cookie
) {

  /*
   * Primero Jornada 1.
   */

  const first =
    await fetchRound(
      source,
      1,
      cookie
    );


  const firstFixtures =
    parseRound(
      first.html,
      source,
      1
    );


  /*
   * Antes de empezar la liga,
   * la Jornada 1 ya es el próximo partido.
   */

  const today =
    new Date();

  today.setHours(
    0, 0, 0, 0
  );


  const firstWithDate =
    firstFixtures.find(
      fixture =>
        fixture.date
    );


  if (firstWithDate) {

    const firstDate =
      new Date(
        `${firstWithDate.date}T12:00:00`
      );


    if (
      firstDate >= today
    ) {

      return {
        fixtures:
          firstFixtures,

        checkedRounds:
          [1]
      };
    }
  }


  /*
   * Si la liga ya empezó:
   * calculamos aproximadamente
   * en qué jornada debemos estar
   * y consultamos alrededor.
   */

  let estimated = 1;


  if (firstWithDate) {

    const firstDate =
      new Date(
        `${firstWithDate.date}T12:00:00`
      );


    const difference =
      today.getTime() -
      firstDate.getTime();


    estimated =
      1 +
      Math.floor(
        difference /
        (7 * 24 * 60 * 60 * 1000)
      );
  }


  estimated =
    Math.max(
      1,
      Math.min(
        estimated,
        40
      )
    );


  const rounds =
    new Set([1]);


  for (
    let offset = -4;
    offset <= 5;
    offset++
  ) {

    const round =
      estimated + offset;


    if (
      round >= 1 &&
      round <= 40
    ) {

      rounds.add(round);
    }
  }


  const roundList =
    [...rounds];


  const pages =
    await Promise.allSettled(

      roundList

        .filter(
          round => round !== 1
        )

        .map(

          async round => {

            const page =
              await fetchRound(
                source,
                round,
                cookie
              );


            return {

              round,

              fixtures:
                parseRound(
                  page.html,
                  source,
                  round
                )
            };
          }
        )
    );


  let fixtures =
    [...firstFixtures];


  for (const result of pages) {

    if (
      result.status ===
      'fulfilled'
    ) {

      fixtures.push(
        ...result.value.fixtures
      );
    }
  }


  return {

    fixtures,

    checkedRounds:
      roundList
  };
}


/* ==========================================================
   CONSTRUIR JSON FINAL
   ========================================================== */

async function buildPayload() {

  const extra =
    await Promise.race([

      discoverExtraSources(),

      new Promise(
        resolve =>
          setTimeout(
            () => resolve([]),
            6000
          )
      )
    ]);


  const sources =
    dedupeSources([
      ...extra,
      ...FIXED
    ]);


  /*
   * Una única sesión RFFM
   * para todas las categorías.
   */

  const cookie =
    await createRffmSession();


  const responses =
    await Promise.allSettled(

      sources.map(

        async source => {

          const data =
            await getTeamMatches(
              source,
              cookie
            );


          return {

            source,

            ...data
          };
        }
      )
    );


  const allFixtures = [];

  const errors = [];

  const modes = {};

  const checkedRounds = {};


  let calendarsOk = 0;
  let calendarsFailed = 0;


  for (const result of responses) {

    if (
      result.status ===
      'fulfilled'
    ) {

      calendarsOk++;


      const source =
        result.value.source;


      const key =
        `${source.section} ${source.team}`;


      modes[key] =
        'RFFM-NFG-CmpJornada';


      checkedRounds[key] =
        result.value.checkedRounds;


      allFixtures.push(
        ...result.value.fixtures
      );

    } else {

      calendarsFailed++;


      errors.push(

        String(

          result.reason?.message

          ||

          result.reason

        )
      );
    }
  }


  /*
   * Quitar duplicados.
   */

  const fixtureMap =
    new Map();


  for (const fixture of allFixtures) {

    const key =

      `${fixture.section}|` +

      `${fixture.team}|` +

      `${fixture.round}|` +

      `${fixture.date}|` +

      `${fixture.home}|` +

      `${fixture.away}`;


    if (
      !fixtureMap.has(key)
    ) {

      fixtureMap.set(
        key,
        fixture
      );
    }
  }


  const fixtures =
    [...fixtureMap.values()];


  const today =
    new Date();

  today.setHours(
    0, 0, 0, 0
  );


  const byTeam =
    new Map();


  for (const fixture of fixtures) {

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
    const teamFixtures
    of byTeam.values()
  ) {

    const future =
      teamFixtures

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
            )

            ||

            (a.round || 0) -
            (b.round || 0)

        );


    if (future[0]) {

      upcoming.push(
        future[0]
      );
    }


    const past =
      teamFixtures

        .filter(

          fixture =>
            fixture.date &&

            new Date(
              `${fixture.date}T12:00:00`
            ) < today &&

            fixture.score

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

      (a.date || '')
        .localeCompare(
          b.date || ''
        )

  );


  results.sort(

    (a, b) =>

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

        source =>
          `${source.section}|${source.team}`

      ),


    detectedTeams:
      [...byTeam.keys()],


    updatedAt:
      new Date()
        .toISOString(),


    source:
      'RFFM',


    diagnostics: {

      sources:
        sources.length,

      calendarsOk,

      calendarsFailed,

      fixtures:
        fixtures.length,

      session:
        cookie
          ? 'JSESSIONID/cookie obtenida'
          : 'sin cookie',

      modes,

      checkedRounds,

      parser:
        'v19-rffm-nfg-cmpjornada',

      errors:
        errors.slice(
          0,
          10
        )
    }
  };
}


/* ==========================================================
   NETLIFY
   ========================================================== */

exports.handler =
  async function () {

    try {

      const data =
        await buildPayload();


      return {

        statusCode:
          200,


        headers: {

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


    } catch (error) {

      return {

        statusCode:
          500,


        headers: {

          'content-type':
            'application/json; charset=utf-8',

          'cache-control':
            'no-store'
        },


        body:
          JSON.stringify({

            error:
              'No se han podido obtener los partidos de RFFM.',

            detail:
              String(
                error?.message ||
                error
              ),

            parser:
              'v19-rffm-nfg-cmpjornada'
          })
      };
    }
  };

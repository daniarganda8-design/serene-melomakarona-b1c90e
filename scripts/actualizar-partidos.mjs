import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const CLUB_URL =
  'https://www.elbalondemadrid.es/club/16661228';

const OUTPUT =
  path.resolve('netlify/functions/partidos.json');

const SEASON_RE =
  /2026\s*\/\s*(?:27|2027)/i;


/*
 * Equipos que ya conocemos.
 *
 * Sirven de respaldo.
 * El programa intenta descubrir además
 * automáticamente el resto de equipos.
 */
const FIXED = [

  {
    competition: '26738221',
    group: '26771028',

    competitionName:
      'TERCERA DIVISIÓN DE FÚTBOL SALA',

    officialTeamName:
      'CD RIVAS FUTSAL - YOUFIRST SMART FINACE',

    team:
      'Tercera División',

    section:
      'Masculina'
  },

  {
    competition: '26749998',
    group: '26814437',

    competitionName:
      'PRIMERA DIVISION AUTONOMICA JUVENIL SALA',

    officialTeamName:
      "CD RIVAS FUTSAL - YOUFIRST SMART FINACE 'A'",

    team:
      'Juvenil A',

    section:
      'Masculina'
  },

  {
    competition: '26738220',
    group: '26878012',

    competitionName:
      'PREFERENTE JUVENIL SALA',

    officialTeamName:
      "CD RIVAS FUTSAL - YOUFIRST SMART FINACE 'B'",

    team:
      'Juvenil B',

    section:
      'Masculina'
  },

  {
    competition: '26738292',
    group: '26738293',

    competitionName:
      'PRIMERA DIVISION AUTONOMICA CADETE SALA',

    officialTeamName:
      "CD RIVAS FUTSAL - YOUFIRST SMART FINACE 'A'",

    team:
      'Cadete Autonómica',

    section:
      'Masculina'
  },

  {
    competition: '26750003',
    group: '26877982',

    competitionName:
      'PREFERENTE CADETE SALA',

    officialTeamName:
      "CD RIVAS FUTSAL - YOUFIRST SMART FINACE 'B'",

    team:
      'Cadete B',

    section:
      'Masculina'
  }

];


/* =========================================================
   TEXTO
   ========================================================= */

function stripAccents(value = '') {

  return String(value)

    .normalize('NFD')

    .replace(
      /[\u0300-\u036f]/g,
      ''
    );
}


function norm(value = '') {

  return stripAccents(value)

    .toUpperCase()

    .replace(
      /[“”]/g,
      '"'
    )

    .replace(
      /[‘’]/g,
      "'"
    )

    .replace(
      /\s+/g,
      ' '
    )

    .trim();
}


function isRivas(value = '') {

  return (
    /(?:CDB?|C\.?D\.?)\s+RIVAS\s+FUTSAL/i
  ).test(
    String(value)
  );
}


function suffix(value = '') {

  return (
    norm(value)

      .match(
        /(?:^|\s)'?([A-Z])'?\s*$/
      )?.[1]

    ||

    null
  );
}


/* =========================================================
   IDENTIFICAR CADA EQUIPO
   ========================================================= */

function identity(
  competitionName,
  officialTeamName
) {

  const c =
    norm(
      competitionName
    );

  const s =
    suffix(
      officialTeamName
    );

  const female =
    /FEMENIN/.test(c);


  /*
   * FEMENINO
   */

  if (female) {

    if (
      /JUVENIL/.test(c)
    ) {

      return {
        team:
          'Juvenil A',

        section:
          'Femenina'
      };
    }


    if (
      /CADETE/.test(c)
    ) {

      return {
        team:
          'Cadete A',

        section:
          'Femenina'
      };
    }


    if (
      /INFANTIL/.test(c)
    ) {

      return {
        team:
          'Infantil A',

        section:
          'Femenina'
      };
    }


    if (
      /ALEVIN/.test(c)
    ) {

      return {
        team:
          'Alevín A',

        section:
          'Femenina'
      };
    }


    return null;
  }


  /*
   * MASCULINO
   */

  if (
    /TERCERA/.test(c)
  ) {

    return {
      team:
        'Tercera División',

      section:
        'Masculina'
    };
  }


  if (
    /JUVENIL/.test(c)
    &&
    /AUTONOMICA/.test(c)
    &&
    s !== 'B'
  ) {

    return {
      team:
        'Juvenil A',

      section:
        'Masculina'
    };
  }


  if (
    /JUVENIL/.test(c)
    &&
    s === 'B'
  ) {

    return {
      team:
        'Juvenil B',

      section:
        'Masculina'
    };
  }


  if (
    /CADETE/.test(c)
    &&
    /AUTONOMICA/.test(c)
    &&
    s !== 'B'
  ) {

    return {
      team:
        'Cadete Autonómica',

      section:
        'Masculina'
    };
  }


  if (
    /CADETE/.test(c)
    &&
    s === 'B'
  ) {

    return {
      team:
        'Cadete B',

      section:
        'Masculina'
    };
  }


  if (
    /INFANTIL/.test(c)
    &&
    /PREFERENTE/.test(c)
    &&
    s !== 'B'
  ) {

    return {
      team:
        'Infantil Preferente',

      section:
        'Masculina'
    };
  }


  if (
    /INFANTIL/.test(c)
    &&
    s === 'B'
  ) {

    return {
      team:
        'Infantil B',

      section:
        'Masculina'
    };
  }


  if (
    /ALEVIN/.test(c)
    &&
    s === 'A'
  ) {

    return {
      team:
        'Alevín A',

      section:
        'Masculina'
    };
  }


  if (
    /ALEVIN/.test(c)
    &&
    s === 'B'
  ) {

    return {
      team:
        'Alevín B',

      section:
        'Masculina'
    };
  }


  if (
    /PREBENJAMIN/.test(c)
  ) {

    return {
      team:
        'Prebenjamín A',

      section:
        'Masculina'
    };
  }


  if (
    /BENJAMIN/.test(c)
  ) {

    return {
      team:
        'Benjamín A',

      section:
        'Masculina'
    };
  }


  return null;
}


/* =========================================================
   QUITAR EQUIPOS REPETIDOS
   ========================================================= */

function dedupeSources(list) {

  const map =
    new Map();


  for (
    const source
    of list
  ) {

    const key =
      `${source.section}|${source.team}`;


    if (
      !map.has(key)
    ) {

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


/* =========================================================
   FECHAS
   ========================================================= */

function findDate(text = '') {

  const m =
    String(text)

      .match(

        /\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/

      );


  if (
    !m
  ) {

    return null;
  }


  return (

    `${m[3]}-`

    +

    `${String(
      m[2]
    ).padStart(
      2,
      '0'
    )}-`

    +

    `${String(
      m[1]
    ).padStart(
      2,
      '0'
    )}`

  );
}


function findTime(text = '') {

  const m =
    String(text)

      .match(

        /\b([01]?\d|2[0-3]):([0-5]\d)\b/

      );


  return m

    ? `${String(
        m[1]
      ).padStart(
        2,
        '0'
      )}:${m[2]}`

    : null;
}


function findRound(text = '') {

  const m =
    String(text)

      .match(

        /JORNADA\s*(?:N[º°.]?\s*)?(\d+)/i

      );


  return m

    ? Number(m[1])

    : null;
}


function findScore(text = '') {

  for (
    const line
    of String(text).split(/\n+/)
  ) {

    const m =
      line

        .trim()

        .match(

          /^(\d{1,2})\s*[-–]\s*(\d{1,2})$/

        );


    if (
      m
    ) {

      return (
        `${m[1]} - ${m[2]}`
      );
    }

  }


  return null;
}


function findVenue(text = '') {

  return (

    String(text)

      .split(/\n+/)

      .map(
        x => x.trim()
      )

      .find(

        line =>

          /PABELL|POLID|P\.M\.|PARQUE|MUNICIPAL|INSTALACI|CAMPO/i

            .test(line)

          &&

          !isRivas(line)

      )

    ||

    null

  );
}


/* =========================================================
   POSIBLE RIVAL
   ========================================================= */

function plausibleOpponent(
  line = ''
) {

  const n =
    norm(line);


  if (
    !line
    ||
    line.length > 180
  ) {

    return false;
  }


  if (
    isRivas(line)
  ) {

    return false;
  }


  if (

    /^(JORNADA|ACTUAL|FECHA|HORA|LUGAR|CAMPO|LOCALIDAD|RESULTADOS|CLASIFICACION|CALENDARIO|TEMPORADA|FUTBOL SALA|VER CLASIFICACION)/

      .test(n)

  ) {

    return false;
  }


  if (

    /^\d+$/.test(n)

    ||

    /^\d{1,2}:\d{2}$/.test(n)

    ||

    /^\d{1,2}[\/-]\d{1,2}[\/-]\d{4}$/
      .test(n)

    ||

    /^\d{1,2}\s*[-–]\s*\d{1,2}$/
      .test(n)

  ) {

    return false;
  }


  return (

    (
      line.match(
        /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g
      )

      ||

      []

    ).length >= 4

  );
}


/* =========================================================
   CREAR PARTIDO
   ========================================================= */

function makeFixture(
  source,
  data
) {

  return {

    round:
      data.round || null,

    date:
      data.date || null,

    time:
      data.time || null,

    home:
      data.home,

    away:
      data.away,

    score:
      data.score || null,

    venue:
      data.venue || null,


    competition:
      source.competition,

    group:
      source.group,

    competitionName:
      source.competitionName,

    officialTeamName:
      source.officialTeamName,

    team:
      source.team,

    section:
      source.section,


    sourceUrl:

      `https://www.elbalondemadrid.es/competicion/`

      +

      `${source.competition}/grupo/`

      +

      `${source.group}/jornadas`,


    rffmUrl:

      `https://www.rffm.es/competicion/calendario`

      +

      `?competicion=${source.competition}`

      +

      `&grupo=${source.group}`

      +

      `&temporada=22`

      +

      `&tipojuego=3`

  };
}


/* =========================================================
   LEER TARJETA DE PARTIDO
   ========================================================= */

function parseCard(
  source,
  card,
  pageText
) {

  const teams = [

    ...new Set(

      (card.teams || [])

        .map(
          x => x.trim()
        )

        .filter(Boolean)

    )

  ];


  const rivasIndex =
    teams.findIndex(
      isRivas
    );


  if (
    rivasIndex < 0
  ) {

    return null;
  }


  const rivalIndex =

    teams.findIndex(

      (x, i) =>

        i !== rivasIndex

        &&

        !isRivas(x)

    );


  if (
    rivalIndex < 0
  ) {

    return null;
  }


  const rivas =
    teams[rivasIndex];


  const rival =
    teams[rivalIndex];


  const rivasHome =
    rivasIndex <
    rivalIndex;


  const context =
    card.text || '';


  return makeFixture(

    source,

    {

      round:

        findRound(
          context
        )

        ||

        findRound(
          pageText
        ),


      date:

        findDate(
          context
        )

        ||

        findDate(
          pageText
        ),


      time:

        findTime(
          context
        ),


      home:

        rivasHome

          ? rivas

          : rival,


      away:

        rivasHome

          ? rival

          : rivas,


      score:

        findScore(
          context
        ),


      venue:

        findVenue(
          context
        )

    }

  );
}


/* =========================================================
   PLAN B: LEER TEXTO
   ========================================================= */

function parseBodyFallback(
  source,
  pageText
) {

  const lines =

    String(pageText)

      .split(/\n+/)

      .map(
        x => x.trim()
      )

      .filter(Boolean);


  const pageDate =
    findDate(
      pageText
    );


  const pageRound =
    findRound(
      pageText
    );


  for (
    let i = 0;
    i < lines.length;
    i++
  ) {

    if (
      !isRivas(
        lines[i]
      )
    ) {

      continue;
    }


    for (
      let distance = 1;
      distance <= 8;
      distance++
    ) {

      for (
        const idx
        of [
          i - distance,
          i + distance
        ]
      ) {

        if (
          idx < 0
          ||
          idx >= lines.length
        ) {

          continue;
        }


        const rival =
          lines[idx];


        if (
          !plausibleOpponent(
            rival
          )
        ) {

          continue;
        }


        const lo =

          Math.max(

            0,

            Math.min(
              i,
              idx
            ) - 8

          );


        const hi =

          Math.min(

            lines.length,

            Math.max(
              i,
              idx
            ) + 9

          );


        const context =

          lines

            .slice(
              lo,
              hi
            )

            .join('\n');


        const rivasHome =
          i < idx;


        return makeFixture(

          source,

          {

            round:

              findRound(
                context
              )

              ||

              pageRound,


            date:

              findDate(
                context
              )

              ||

              pageDate,


            time:

              findTime(
                context
              ),


            home:

              rivasHome

                ? lines[i]

                : rival,


            away:

              rivasHome

                ? rival

                : lines[i],


            score:

              findScore(
                context
              ),


            venue:

              findVenue(
                context
              )

          }

        );

      }

    }

  }


  return null;
}


/* =========================================================
   DESCUBRIR EQUIPOS AUTOMÁTICAMENTE
   ========================================================= */

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

      timeout:
        45000

    }

  );


  await page.waitForTimeout(
    1200
  );


  const teamLinks =

    await page

      .locator(
        'a[href*="/equipo/"]'
      )

      .evaluateAll(

        links => [

          ...new Set(

            links

              .map(
                a => a.href
              )

              .filter(Boolean)

          )

        ]

      );


  await page.close();


  const found = [];


  /*
   * Entramos en cada equipo.
   */

  for (
    const url
    of teamLinks.slice(
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

          timeout:
            35000

        }

      );


      await teamPage.waitForTimeout(
        350
      );


      const bodyText =

        await teamPage

          .locator('body')

          .innerText()

          .catch(
            () => ''
          );


      /*
       * Solo temporada 26/27.
       */

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

            .catch(
              () => ''
            )

        )

        .trim();


      if (
        !isRivas(
          officialTeamName
        )
      ) {

        continue;
      }


      /*
       * Sacamos la competición
       * del título de la página.
       */

      const title =
        await teamPage.title();


      const titleMatch =

        title.match(

          /—\s*(.*?)\s+2026\s*\/\s*(?:27|2027)/i

        );


      const competitionName =

        (
          titleMatch?.[1]
          ||
          ''
        )

        .trim();


      if (
        !competitionName
      ) {

        continue;
      }


      /*
       * Buscar competición y grupo.
       */

      const hrefs =

        await teamPage

          .locator(
            'a[href*="/competicion/"][href*="/grupo/"]'
          )

          .evaluateAll(

            links =>

              links

                .map(
                  a => a.href
                )

                .filter(Boolean)

          );


      const href =

        hrefs.find(

          x =>
            /\/jornadas(?:[?#/]|$)/i
              .test(x)

        )

        ||

        hrefs.find(

          x =>
            /\/clasificacion(?:[?#/]|$)/i
              .test(x)

        )

        ||

        hrefs[0];


      if (
        !href
      ) {

        continue;
      }


      const m =

        href.match(

          /\/competicion\/(\d+)\/grupo\/(\d+)/i

        );


      if (
        !m
      ) {

        continue;
      }


      const category =

        identity(

          competitionName,

          officialTeamName

        );


      if (
        !category
      ) {

        continue;
      }


      found.push({

        competition:
          m[1],

        group:
          m[2],

        competitionName,

        officialTeamName,

        ...category

      });


    }

    catch (
      error
    ) {

      console.log(

        `No se pudo leer ${url}: ${error.message}`

      );

    }

    finally {

      await teamPage.close();

    }

  }


  /*
   * Los descubiertos automáticamente
   * tienen prioridad.
   *
   * FIXED es solo respaldo.
   */

  return dedupeSources(

    [

      ...found,

      ...FIXED

    ]

  );

}


/* =========================================================
   ABRIR CALENDARIO CON CHROMIUM REAL
   ========================================================= */

async function extractFromRenderedPage(
  page,
  source
) {

  /*
   * También vigilamos respuestas JSON.
   * Nos sirve como diagnóstico en caso
   * de que la web cambie.
   */

  const networkJson = [];


  const listener =

    async response => {

      try {

        const type =

          response.headers()[
            'content-type'
          ]

          ||

          '';


        if (
          !type.includes(
            'application/json'
          )
        ) {

          return;
        }


        const text =
          await response.text();


        if (

          text.length <=
          2000000

          &&

          /RIVAS\s+FUTSAL/i
            .test(text)

        ) {

          networkJson.push(
            text
          );

        }

      }

      catch {

        /*
         * Una respuesta de red puede
         * desaparecer antes de leerla.
         * No pasa nada.
         */

      }

    };


  page.on(
    'response',
    listener
  );


  const url =

    `https://www.elbalondemadrid.es/competicion/`

    +

    `${source.competition}/grupo/`

    +

    `${source.group}/jornadas`;


  try {

    /*
     * Aquí está la diferencia con las
     * versiones anteriores:
     *
     * abrimos Chromium de verdad.
     */

    await page.goto(

      url,

      {

        waitUntil:
          'domcontentloaded',

        timeout:
          45000

      }

    );


    /*
     * Esperar a JavaScript.
     */

    await page

      .waitForLoadState(

        'networkidle',

        {
          timeout:
            15000
        }

      )

      .catch(
        () => {}
      );


    /*
     * Si pone "Cargando jornada",
     * esperamos a que desaparezca.
     */

    await page

      .waitForFunction(

        () =>
          !/Cargando jornada/i
            .test(
              document.body.innerText
            ),

        null,

        {
          timeout:
            20000
        }

      )

      .catch(
        () => {}
      );


    /*
     * Un pequeño margen adicional
     * para React/JavaScript.
     */

    await page.waitForTimeout(
      1500
    );


    const pageText =

      await page

        .locator('body')

        .innerText()

        .catch(
          () => ''
        );


    /*
     * Buscamos los enlaces de los
     * equipos dentro de cada partido.
     */

    const cards =

      await page.evaluate(

        () => {

          const unique = arr => [

            ...new Set(

              arr

                .map(
                  x => x.trim()
                )

                .filter(Boolean)

            )

          ];


          const anchors = [

            ...document.querySelectorAll(

              'a[href*="/equipo/"]'

            )

          ].filter(

            a =>

              /RIVAS\s+FUTSAL/i

                .test(
                  a.innerText || ''
                )

          );


          const out = [];


          for (
            const anchor
            of anchors
          ) {

            let node =
              anchor;


            /*
             * Subir por el DOM hasta
             * encontrar la tarjeta que
             * contiene los dos equipos.
             */

            for (

              let depth = 0;

              depth < 8
              &&
              node;

              depth++,
              node =
                node.parentElement

            ) {

              const links =

                unique(

                  [

                    ...node.querySelectorAll(

                      'a[href*="/equipo/"]'

                    )

                  ].map(

                    a =>
                      a.innerText || ''

                  )

                );


              const text =

                (
                  node.innerText
                  ||
                  ''
                )

                .trim();


              /*
               * Una tarjeta normal debe
               * tener al menos los dos
               * equipos pero no decenas.
               */

              if (

                links.length >= 2

                &&

                links.length <= 4

                &&

                text.length > 0

                &&

                text.length < 2200

              ) {

                out.push({

                  text,

                  teams:
                    links

                });


                break;

              }

            }

          }


          /*
           * Quitar duplicados.
           */

          const seen =
            new Set();


          return out.filter(

            item => {

              const key =

                `${item.teams.join('|')}|${item.text}`;


              if (
                seen.has(key)
              ) {

                return false;
              }


              seen.add(key);

              return true;

            }

          );

        }

      );


    /*
     * Convertir tarjetas a partidos.
     */

    const fixtures =

      cards

        .map(

          card =>

            parseCard(

              source,

              card,

              pageText

            )

        )

        .filter(Boolean);


    if (
      fixtures.length
    ) {

      return {

        fixtures,

        mode:
          'rendered-dom',

        pageText,

        networkJsonCount:
          networkJson.length

      };

    }


    /*
     * Si el diseño cambia,
     * usamos texto renderizado.
     */

    const fallback =

      parseBodyFallback(

        source,

        pageText

      );


    if (
      fallback
    ) {

      return {

        fixtures:
          [fallback],

        mode:
          'rendered-text',

        pageText,

        networkJsonCount:
          networkJson.length

      };

    }


    /*
     * No hemos encontrado partido.
     */

    return {

      fixtures:
        [],

      mode:
        'no-fixture',

      pageText,

      networkJsonCount:
        networkJson.length

    };


  }

  finally {

    page.off(
      'response',
      listener
    );

  }

}


/* =========================================================
   QUITAR PARTIDOS DUPLICADOS
   ========================================================= */

function dedupeFixtures(
  list
) {

  const map =
    new Map();


  for (
    const f
    of list
  ) {

    const key =

      `${f.section}|`

      +

      `${f.team}|`

      +

      `${f.round}|`

      +

      `${f.date}|`

      +

      `${norm(f.home)}|`

      +

      `${norm(f.away)}`;


    if (
      !map.has(key)
    ) {

      map.set(
        key,
        f
      );

    }

  }


  return [
    ...map.values()
  ];

}


/* =========================================================
   PRÓXIMO PARTIDO Y ÚLTIMO RESULTADO
   ========================================================= */

function chooseUpcomingAndResults(
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


    if (
      !byTeam.has(key)
    ) {

      byTeam.set(
        key,
        []
      );

    }


    byTeam

      .get(key)

      .push(
        fixture
      );

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

          f =>

            f.date

            &&

            new Date(

              `${f.date}T12:00:00`

            )

            >=

            today

        )

        .sort(

          (a, b) =>

            a.date.localeCompare(
              b.date
            )

            ||

            (a.round || 0)

            -

            (b.round || 0)

        );


    if (
      future[0]
    ) {

      upcoming.push(
        future[0]
      );

    }


    const past =

      list

        .filter(

          f =>

            f.date

            &&

            f.score

            &&

            new Date(

              `${f.date}T12:00:00`

            )

            <

            today

        )

        .sort(

          (a, b) =>

            b.date.localeCompare(
              a.date
            )

            ||

            (b.round || 0)

            -

            (a.round || 0)

        );


    if (
      past[0]
    ) {

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

      ||

      a.team.localeCompare(
        b.team,
        'es'
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

    detectedTeams:

      [
        ...byTeam.keys()
      ]

  };

}


/* =========================================================
   ABRIR CHROMIUM
   ========================================================= */

const browser =

  await chromium.launch({

    headless:
      true

  });


const context =

  await browser.newContext({

    locale:
      'es-ES',

    timezoneId:
      'Europe/Madrid',

    userAgent:

      'Mozilla/5.0 ' +

      '(Windows NT 10.0; Win64; x64) ' +

      'AppleWebKit/537.36 ' +

      'Chrome/151.0.0.0 ' +

      'Safari/537.36'

  });


/* =========================================================
   EJECUCIÓN
   ========================================================= */

try {

  /*
   * Encontrar categorías.
   */

  const sources =

    await discoverSources(
      context
    );


  console.log(

    `Equipos detectados: ${sources.length}`

  );


  const allFixtures = [];

  const diagnostics = {};


  /*
   * Abrir calendario de cada equipo.
   */

  for (
    const source
    of sources
  ) {

    const page =
      await context.newPage();


    try {

      const result =

        await extractFromRenderedPage(

          page,

          source

        );


      allFixtures.push(

        ...result.fixtures

      );


      diagnostics[

        `${source.section} ${source.team}`

      ] = {

        mode:
          result.mode,

        fixtures:
          result.fixtures.length,

        hasRivasInPage:

          /RIVAS\s+FUTSAL/i

            .test(
              result.pageText
            ),

        hasJornadaInPage:

          /JORNADA\s*\d+/i

            .test(
              result.pageText
            ),

        bodyChars:
          result.pageText.length,

        jsonResponsesWithRivas:
          result.networkJsonCount

      };


      console.log(

        `${source.section} ${source.team}: `

        +

        `${result.fixtures.length} partido(s) `

        +

        `[${result.mode}]`

      );

    }

    catch (
      error
    ) {

      diagnostics[

        `${source.section} ${source.team}`

      ] = {

        mode:
          'error',

        error:
          error.message

      };


      console.log(

        `${source.section} ${source.team}: `

        +

        `ERROR ${error.message}`

      );

    }

    finally {

      await page.close();

    }

  }


  /*
   * Eliminar repetidos.
   */

  const fixtures =

    dedupeFixtures(
      allFixtures
    );


  /*
   * Próximo + último.
   */

  const selected =

    chooseUpcomingAndResults(
      fixtures
    );


  /*
   * JSON final.
   */

  const payload = {

    upcoming:
      selected.upcoming,

    results:
      selected.results,


    sourceTeams:

      sources.map(

        s =>
          `${s.section}|${s.team}`

      ),


    detectedTeams:

      selected.detectedTeams,


    updatedAt:

      new Date()
        .toISOString(),


    source:

      'Datos públicos RFFM vía El Balón de Madrid (navegador automático)',


    diagnostics: {

      scraper:
        'playwright-v1',

      sources:
        sources.length,

      fixtures:
        fixtures.length,

      teams:
        diagnostics

    }

  };


  /*
   * Guardar.
   */

  await fs.mkdir(

    path.dirname(
      OUTPUT
    ),

    {
      recursive:
        true
    }

  );


  await fs.writeFile(

    OUTPUT,

    `${JSON.stringify(
      payload,
      null,
      2
    )}\n`,

    'utf8'

  );


  console.log(
    `Guardado ${OUTPUT}`
  );


  console.log(

    `Próximos: ${payload.upcoming.length}`

    +

    ` | Resultados: ${payload.results.length}`

    +

    ` | Partidos leídos: ${fixtures.length}`

  );


}

finally {

  await context.close();

  await browser.close();

}

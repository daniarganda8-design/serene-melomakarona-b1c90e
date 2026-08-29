'use strict';

const SEASON = 22; // 2026/27
const TYPE = 3;    // Fútbol Sala

const CLUB_PAGE =
  'https://www.elbalondemadrid.es/club/16661228';

const NFG_HOSTS = [
  'https://www.rffm.es',
  'https://www.ffmadrid.es'
];

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/151.0.0.0 Safari/537.36';


/* ==========================================================
   EQUIPOS YA IDENTIFICADOS
   ========================================================== */

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


/* ==========================================================
   UTILIDADES DE TEXTO
   ========================================================== */

function decode(s = '') {

  return String(s)

    .replace(/&nbsp;/gi, ' ')

    .replace(/&amp;/gi, '&')

    .replace(/&quot;/gi, '"')

    .replace(
      /&#39;|&apos;/gi,
      "'"
    )

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


function stripAccents(s = '') {

  return String(s)

    .normalize('NFD')

    .replace(
      /[\u0300-\u036f]/g,
      ''
    );
}


function norm(s = '') {

  return stripAccents(
    decode(s)
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
      x =>
        x
          .replace(/\s+/g, ' ')
          .trim()
    )

    .filter(Boolean);
}


function isRivas(s = '') {

  return (
    /(?:CDB?|C\.?D\.?)\s+RIVAS\s+FUTSAL/i
  ).test(
    String(s)
  );
}


function suffix(s = '') {

  return (
    norm(s)
      .match(
        /(?:^|\s)'?([A-Z])'?\s*$/
      )?.[1]

    ||

    null
  );
}


function canonical(s = '') {

  return norm(s)

    .replace(
      /^CDB?\.\s+/,
      'CD '
    )

    .replace(
      /\s*-\s*YOUFIRST\s+SMART\s+FIN(?:A|A)CE\b/g,
      ''
    )

    .replace(
      /\s*-\s*YOUFIRST\b.*?(?=(?:\s+'[A-Z]'\s*$)|$)/g,
      ''
    )

    .replace(
      /\s+/g,
      ' '
    )

    .trim();
}


function sameRivas(a, b) {

  if (
    !isRivas(a) ||
    !isRivas(b)
  ) {

    return false;
  }


  const ca =
    canonical(a);

  const cb =
    canonical(b);


  if (
    ca === cb
  ) {

    return true;
  }


  const sa =
    suffix(a);

  const sb =
    suffix(b);


  return (

    sa === sb

    &&

    ca.replace(
      /\s+'?[A-Z]'?$/,
      ''
    )

    ===

    cb.replace(
      /\s+'?[A-Z]'?$/,
      ''
    )

  );
}


/* ==========================================================
   IDENTIFICAR CATEGORÍAS
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


  /* FEMENINO */

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


  /* MASCULINO */

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


/* ==========================================================
   FETCH
   ========================================================== */

async function fetchWithTimeout(
  url,
  options = {},
  timeoutMs = 8000
) {

  const controller =
    new AbortController();


  const timer =
    setTimeout(

      () =>
        controller.abort(),

      timeoutMs

    );


  try {

    return await fetch(

      url,

      {

        ...options,

        signal:
          controller.signal

      }

    );

  }

  finally {

    clearTimeout(
      timer
    );

  }

}


function baseHeaders(
  extra = {}
) {

  return {

    'user-agent':
      UA,

    'accept':

      'text/html,' +

      'application/xhtml+xml,' +

      'application/xml;q=0.9,' +

      '*/*;q=0.8',

    'accept-language':

      'es-ES,es;q=0.9,en;q=0.7',

    'cache-control':
      'no-cache',

    'pragma':
      'no-cache',

    ...extra

  };

}


/* ==========================================================
   LEER JSESSIONID
   ========================================================== */

function readJsession(
  headers
) {

  let values = [];


  if (
    typeof headers.getSetCookie ===
    'function'
  ) {

    values =
      headers.getSetCookie();

  }


  const combined =
    headers.get(
      'set-cookie'
    );


  if (
    combined
  ) {

    values.push(
      combined
    );

  }


  /*
   * Nos interesa la última
   * JSESSIONID recibida.
   */

  for (
    let i =
      values.length - 1;

    i >= 0;

    i--
  ) {

    const match =

      String(
        values[i]
      )

      .match(

        /JSESSIONID=([^;,\s]+)/i

      );


    if (
      match
    ) {

      return match[1];

    }

  }


  return null;

}


/* ==========================================================
   URL NFG
   ========================================================== */

function nfgRoundUrl(
  host,
  source,
  round
) {

  return (

    `${host}/pnfg/NPcd/NFG_CmpJornada`

    +

    `?cod_primaria=1000120`

    +

    `&CodCompeticion=${encodeURIComponent(
      source.competition
    )}`

    +

    `&CodGrupo=${encodeURIComponent(
      source.group
    )}`

    +

    `&CodTemporada=${SEASON}`

    +

    `&CodJornada=${round}`

    +

    `&Sch_Codigo_Delegacion=1`

    +

    `&Sch_Tipo_Juego=${TYPE}`

  );

}


/* ==========================================================
   CREAR SESIÓN NFG SIGUIENDO REDIRECCIONES
   ========================================================== */

async function bootstrapNfgSession(
  host,
  source
) {

  /*
   * El funcionamiento antiguo de NFG es:
   *
   * CmpJornada
   *      ↓
   * NLogin
   *      ↓
   * nueva JSESSIONID
   *
   * No utilizamos redirect:"follow" porque
   * necesitamos guardar las cookies de
   * CADA salto.
   */

  const seed =
    nfgRoundUrl(
      host,
      source,
      1
    );


  let currentUrl =
    seed;


  let jsession =
    null;


  const trace =
    [];


  for (
    let step = 0;
    step < 5;
    step++
  ) {

    const response =

      await fetchWithTimeout(

        currentUrl,

        {

          headers:

            baseHeaders({

              referer:

                step === 0

                  ? 'https://www.google.com/'

                  : seed,


              ...(jsession

                ? {

                    cookie:
                      `JSESSIONID=${jsession}`

                  }

                : {})

            }),


          redirect:
            'manual'

        },

        7000

      );


    /*
     * Recoger JSESSIONID del salto.
     */

    const newSession =
      readJsession(
        response.headers
      );


    if (
      newSession
    ) {

      jsession =
        newSession;

    }


    const location =
      response.headers.get(
        'location'
      );


    trace.push({

      step:
        step + 1,

      status:
        response.status,

      hasJsession:
        Boolean(jsession),

      location:

        location

          ? String(location)
              .slice(0, 180)

          : null

    });


    /*
     * Seguimos nosotros mismos
     * la redirección.
     */

    if (

      response.status >= 300

      &&

      response.status < 400

      &&

      location

    ) {

      currentUrl =

        new URL(
          location,
          currentUrl
        ).href;


      continue;

    }


    break;

  }


  return {

    host,

    cookie:

      jsession

        ? `JSESSIONID=${jsession}`

        : '',

    hasCookie:
      Boolean(jsession),

    trace

  };

}


/* ==========================================================
   COMPROBAR SI RFFM RECHAZÓ COOKIE
   ========================================================== */

function pageLooksRejected(
  html = ''
) {

  const text =
    norm(
      plain(html)
    );


  return (

    !String(html).trim()

    ||

    /NO SE HA ACEPTADO EL COOKIE/
      .test(text)

    ||

    (
      String(html).length < 350

      &&

      !/RIVAS|JORNADA/
        .test(text)
    )

  );

}


/* ==========================================================
   PEDIR JORNADA NFG CON LA SESIÓN OBTENIDA
   ========================================================== */

async function fetchNfgRound(
  host,
  source,
  round,
  cookie
) {

  const url =
    nfgRoundUrl(
      host,
      source,
      round
    );


  const response =

    await fetchWithTimeout(

      url,

      {

        headers:

          baseHeaders({

            referer:
              'https://www.google.com/',


            ...(cookie

              ? {
                  cookie
                }

              : {})

          }),


        /*
         * Otra vez manual:
         * si responde 302 sabremos
         * que la sesión no ha servido.
         */

        redirect:
          'manual'

      },

      8000

    );


  const body =
    await response.text();


  return {

    url,

    status:
      response.status,

    location:
      response.headers.get(
        'location'
      ),

    contentType:
      response.headers.get(
        'content-type'
      ) || '',

    body,

    bytes:
      body.length,

    containsRivas:
      isRivas(
        plain(body)
      ),

    containsJornada:

      /JORNADA\s*\d+/i
        .test(
          plain(body)
        ),

    rejected:
      pageLooksRejected(
        body
      )

  };

}


/* ==========================================================
   RESPALDO: PÁGINA MODERNA RFFM
   ========================================================== */

async function fetchModernRound(
  source,
  round
) {

  const url =

    `https://www.rffm.es/competicion/calendario`

    +

    `?competicion=${encodeURIComponent(
      source.competition
    )}`

    +

    `&grupo=${encodeURIComponent(
      source.group
    )}`

    +

    `&jornada=${round}`

    +

    `&temporada=${SEASON}`

    +

    `&tipojuego=${TYPE}`;


  const response =

    await fetchWithTimeout(

      url,

      {

        headers:

          baseHeaders({

            referer:
              'https://www.rffm.es/'

          }),

        redirect:
          'follow'

      },

      8000

    );


  const body =
    await response.text();


  return {

    url,

    status:
      response.status,

    body,

    bytes:
      body.length,

    containsRivas:
      isRivas(
        plain(body)
      ),

    containsJornada:

      /JORNADA\s*\d+/i
        .test(
          plain(body)
        )

  };

}


/* ==========================================================
   JORNADA / FECHA / HORA / RESULTADO
   ========================================================== */

function getRound(
  text = ''
) {

  const match =

    String(text)

      .match(

        /JORNADA\s*(?:N[º°.]?\s*)?(\d+)/i

      );


  return match

    ? Number(match[1])

    : null;

}


function getDate(
  text = ''
) {

  const match =

    String(text)

      .match(

        /\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/

      );


  if (
    !match
  ) {

    return null;

  }


  return (

    `${match[3]}-`

    +

    `${String(
      match[2]
    ).padStart(
      2,
      '0'
    )}-`

    +

    `${String(
      match[1]
    ).padStart(
      2,
      '0'
    )}`

  );

}


function getTime(
  text = ''
) {

  const match =

    String(text)

      .match(

        /\b([01]?\d|2[0-3]):([0-5]\d)\b/

      );


  return match

    ? `${String(
        match[1]
      ).padStart(
        2,
        '0'
      )}:${match[2]}`

    : null;

}


function getScore(
  text = ''
) {

  const match =

    String(text)

      .match(

        /(?:^|\s)(\d{1,2})\s*[-–]\s*(\d{1,2})(?:\s|$)/

      );


  return match

    ? `${match[1]} - ${match[2]}`

    : null;

}


function cleanCell(
  html = ''
) {

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

    .replace(
      /\s+/g,
      ' '
    )

    .trim();

}


/* ==========================================================
   ¿PARECE UN EQUIPO?
   ========================================================== */

function plausibleTeam(
  text = ''
) {

  const n =
    norm(text);


  if (
    !text
    ||
    text.length > 190
  ) {

    return false;

  }


  if (

    /^(JORNADA|FECHA|HORA|LUGAR|CAMPO|LOCALIDAD|CALENDARIO|CLASIFICACION|RESULTADOS|VER ACTA|ACTA|DESCANSO|TEMPORADA|PABELLON|POLIDEPORTIVO|INSTALACION)/

      .test(n)

  ) {

    return false;

  }


  if (
    /^\d+$/.test(n)
  ) {

    return false;

  }


  if (
    /^\d{1,2}:\d{2}$/.test(n)
  ) {

    return false;

  }


  if (

    /^\d{1,2}[\/-]\d{1,2}[\/-]\d{4}$/
      .test(n)

  ) {

    return false;

  }


  if (

    /^\d{1,2}\s*[-–]\s*\d{1,2}$/
      .test(n)

  ) {

    return false;

  }


  const letters =

    (
      text.match(

        /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g

      )

      ||

      []

    ).length;


  return (
    letters >= 4
  );

}


/* ==========================================================
   CREAR PARTIDO
   ========================================================== */

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


    rffmUrl:

      `https://www.rffm.es/competicion/calendario`

      +

      `?competicion=${source.competition}`

      +

      `&grupo=${source.group}`

      +

      `&temporada=${SEASON}`

      +

      `&tipojuego=${TYPE}`

  };

}


/* ==========================================================
   LEER UNA JORNADA
   ========================================================== */

function parseRound(
  html,
  source,
  forcedRound = null
) {

  const fixtures = [];


  const allText =
    plain(html);


  const globalRound =

    forcedRound

    ||

    getRound(
      allText
    );


  const globalDate =
    getDate(
      allText
    );


  /*
   * PRIMER MÉTODO:
   * tablas HTML.
   */

  const rows = [

    ...String(html)
      .matchAll(

        /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi

      )

  ].map(
    match =>
      match[1]
  );


  for (
    const rowHtml
    of rows
  ) {

    const rowText =
      cleanCell(
        rowHtml
      );


    if (
      !isRivas(
        rowText
      )
    ) {

      continue;

    }


    const cells = [

      ...rowHtml.matchAll(

        /<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi

      )

    ]

      .map(
        match =>
          cleanCell(
            match[1]
          )
      )

      .filter(Boolean);


    if (
      !cells.length
    ) {

      continue;

    }


    const candidateCells =

      cells

        .map(

          (text, index) => ({

            text,

            index

          })

        )

        .filter(

          item =>
            plausibleTeam(
              item.text
            )

        );


    let rivasPos =

      candidateCells.find(

        item =>

          sameRivas(

            item.text,

            source.officialTeamName

          )

      );


    if (
      !rivasPos
    ) {

      rivasPos =

        candidateCells.find(

          item =>
            isRivas(
              item.text
            )

        );

    }


    if (
      !rivasPos
    ) {

      continue;

    }


    const rivals =

      candidateCells

        .filter(

          item =>

            !isRivas(
              item.text
            )

            &&

            item.text !==
            rivasPos.text

        )

        .sort(

          (a, b) =>

            Math.abs(
              a.index -
              rivasPos.index
            )

            -

            Math.abs(
              b.index -
              rivasPos.index
            )

        );


    if (
      !rivals.length
    ) {

      continue;

    }


    const rivalPos =
      rivals[0];


    const rivasHome =

      rivasPos.index <
      rivalPos.index;


    const venue =

      cells.find(

        cell =>

          /PABELL|POLID|P\.M\.|PARQUE|MUNICIPAL|INSTALACI|CAMPO/i

            .test(cell)

          &&

          !isRivas(cell)

      )

      ||

      null;


    fixtures.push(

      makeFixture(

        source,

        {

          round:

            getRound(
              rowText
            )

            ||

            globalRound,


          date:

            getDate(
              rowText
            )

            ||

            globalDate,


          time:
            getTime(
              rowText
            ),


          home:

            rivasHome

              ? rivasPos.text

              : rivalPos.text,


          away:

            rivasHome

              ? rivalPos.text

              : rivasPos.text,


          score:
            getScore(
              rowText
            ),


          venue

        }

      )

    );

  }


  if (
    fixtures.length
  ) {

    return fixtures;

  }


  /*
   * SEGUNDO MÉTODO:
   * texto de la página.
   */

  const lines =
    textLines(
      html
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


    const nearby = [];


    for (
      let distance = 1;
      distance <= 6;
      distance++
    ) {

      for (
        const pos
        of [
          i - distance,
          i + distance
        ]
      ) {

        if (
          pos < 0 ||
          pos >= lines.length
        ) {

          continue;

        }


        const line =
          lines[pos];


        if (
          isRivas(line)
        ) {

          continue;

        }


        if (
          !plausibleTeam(line)
        ) {

          continue;

        }


        if (

          /PABELL|POLID|MUNICIPAL|INSTALACI|CAMPO|LOCALIDAD|VER ACTA/i

            .test(
              norm(line)
            )

        ) {

          continue;

        }


        nearby.push({

          line,

          pos,

          distance

        });

      }


      if (
        nearby.length
      ) {

        break;

      }

    }


    if (
      !nearby.length
    ) {

      continue;

    }


    const rival =
      nearby[0];


    const start =

      Math.max(

        0,

        Math.min(
          i,
          rival.pos
        ) - 8

      );


    const end =

      Math.min(

        lines.length,

        Math.max(
          i,
          rival.pos
        ) + 9

      );


    const context =

      lines

        .slice(
          start,
          end
        )

        .join(' ');


    const rivasHome =
      i < rival.pos;


    const venue =

      lines

        .slice(
          start,
          end
        )

        .find(

          line =>

            /PABELL|POLID|P\.M\.|PARQUE|MUNICIPAL|INSTALACI|CAMPO/i

              .test(line)

            &&

            !isRivas(line)

        )

      ||

      null;


    fixtures.push(

      makeFixture(

        source,

        {

          round:

            getRound(
              context
            )

            ||

            globalRound,


          date:

            getDate(
              context
            )

            ||

            globalDate,


          time:
            getTime(
              context
            ),


          home:

            rivasHome

              ? lines[i]

              : rival.line,


          away:

            rivasHome

              ? rival.line

              : lines[i],


          score:
            getScore(
              context
            ),


          venue

        }

      )

    );

  }


  return fixtures;

}


/* ==========================================================
   DESCUBRIR EQUIPOS DEL CLUB
   ========================================================== */

async function fetchText(
  url,
  timeoutMs = 5000
) {

  const response =

    await fetchWithTimeout(

      url,

      {

        headers:
          baseHeaders(),

        redirect:
          'follow'

      },

      timeoutMs

    );


  if (
    !response.ok
  ) {

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
      match =>
        match[1]
    );


    const unique =

      [
        ...new Set(ids)
      ]

      .slice(
        0,
        40
      );


    const pages =

      await Promise.allSettled(

        unique.map(

          async id => {

            const html =

              await fetchText(

                `https://www.elbalondemadrid.es/equipo/${id}`,

                4500

              );


            const pageText =

              plain(html)

                .replace(
                  /\s+/g,
                  ' '
                )

                .trim();


            /*
             * Solo temporada 2026/27.
             */

            if (

              !/2026\/27|2026\/2027/i

                .test(
                  pageText
                )

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
              !teamName
              ||
              !isRivas(
                teamName
              )
            ) {

              return null;

            }


            const link =

              html.match(

                /\/competicion\/(\d+)\/grupo\/(\d+)/i

              );


            if (
              !link
            ) {

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

                .replace(
                  /\s+/g,
                  ' '
                )

                .trim();


            const category =

              identity(

                competitionName,

                teamName

              );


            if (
              !category
            ) {

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


    return pages

      .map(

        result =>

          result.status ===
          'fulfilled'

            ? result.value

            : null

      )

      .filter(Boolean);

  }

  catch (_) {

    return [];

  }

}


/* ==========================================================
   QUITAR DUPLICADOS
   ========================================================== */

function dedupeSources(
  list
) {

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


function dedupeFixtures(
  list
) {

  const map =
    new Map();


  for (
    const fixture
    of list
  ) {

    const key =

      `${fixture.section}|`

      +

      `${fixture.team}|`

      +

      `${fixture.round}|`

      +

      `${fixture.date}|`

      +

      `${canonical(
        fixture.home
      )}|`

      +

      `${canonical(
        fixture.away
      )}`;


    if (
      !map.has(key)
    ) {

      map.set(
        key,
        fixture
      );

    }

  }


  return [
    ...map.values()
  ];

}


/* ==========================================================
   JORNADAS A CONSULTAR
   ========================================================== */

function roundsToCheck() {

  /*
   * La mayoría de las ligas empiezan
   * a finales de septiembre.
   *
   * Consultamos pocas jornadas para
   * que Netlify no tarde demasiado.
   */

  const today =
    new Date();


  const seasonStart =

    new Date(
      '2026-09-19T12:00:00+02:00'
    );


  const weekMs =

    7 *
    24 *
    60 *
    60 *
    1000;


  let estimated =

    1

    +

    Math.floor(

      (
        today.getTime()

        -

        seasonStart.getTime()
      )

      /

      weekMs

    );


  estimated =

    Math.max(

      1,

      Math.min(
        40,
        estimated
      )

    );


  const rounds =
    new Set();


  if (
    estimated <= 2
  ) {

    [
      1,
      2,
      3
    ].forEach(

      round =>
        rounds.add(
          round
        )

    );

  }

  else {

    [

      estimated - 1,

      estimated,

      estimated + 1,

      estimated + 2

    ].forEach(

      round => {

        if (
          round >= 1
          &&
          round <= 40
        ) {

          rounds.add(
            round
          );

        }

      }

    );

  }


  return [
    ...rounds
  ];

}


/* ==========================================================
   CREAR SESIONES EN LOS DOS HOSTS
   ========================================================== */

async function getHostSessions(
  seedSource
) {

  const results = [];


  for (
    const host
    of NFG_HOSTS
  ) {

    try {

      results.push(

        await bootstrapNfgSession(

          host,

          seedSource

        )

      );

    }

    catch (error) {

      results.push({

        host,

        cookie:
          '',

        hasCookie:
          false,

        trace:
          [],

        error:

          String(

            error?.message

            ||

            error

          )

      });

    }

  }


  return results;

}


/* ==========================================================
   PARTIDOS DE UN EQUIPO
   ========================================================== */

async function getTeamMatches(
  source,
  sessions,
  rounds
) {

  const fixtures = [];

  const debug = [];


  for (
    const round
    of rounds
  ) {

    let foundForRound =
      false;


    /*
     * Primero probamos NFG
     * con la sesión obtenida.
     */

    for (
      const session
      of sessions
    ) {

      try {

        const page =

          await fetchNfgRound(

            session.host,

            source,

            round,

            session.cookie

          );


        const parsed =

          parseRound(

            page.body,

            source,

            round

          );


        debug.push({

          round,

          mode:
            `NFG ${session.host}`,

          status:
            page.status,

          bytes:
            page.bytes,

          containsRivas:
            page.containsRivas,

          containsJornada:
            page.containsJornada,

          rejected:
            page.rejected,

          parsed:
            parsed.length

        });


        if (
          parsed.length
        ) {

          fixtures.push(
            ...parsed
          );


          foundForRound =
            true;


          break;

        }

      }

      catch (error) {

        debug.push({

          round,

          mode:
            `NFG ${session.host}`,

          error:

            String(

              error?.message

              ||

              error

            )

        });

      }

    }


    if (
      foundForRound
    ) {

      continue;

    }


    /*
     * Si NFG no devuelve nada,
     * probamos la web moderna oficial.
     */

    try {

      const modern =

        await fetchModernRound(

          source,

          round

        );


      const parsed =

        parseRound(

          modern.body,

          source,

          round

        );


      debug.push({

        round,

        mode:
          'modern-rffm',

        status:
          modern.status,

        bytes:
          modern.bytes,

        containsRivas:
          modern.containsRivas,

        containsJornada:
          modern.containsJornada,

        parsed:
          parsed.length

      });


      if (
        parsed.length
      ) {

        fixtures.push(
          ...parsed
        );

      }

    }

    catch (error) {

      debug.push({

        round,

        mode:
          'modern-rffm',

        error:

          String(

            error?.message

            ||

            error

          )

      });

    }

  }


  return {

    fixtures:

      dedupeFixtures(
        fixtures
      ),

    debug

  };

}


/* ==========================================================
   RESPUESTA FINAL
   ========================================================== */

async function buildPayload() {

  const extra =

    await Promise.race(

      [

        discoverExtraSources(),

        new Promise(

          resolve =>

            setTimeout(

              () =>
                resolve([]),

              6000

            )

        )

      ]

    );


  const sources =

    dedupeSources(

      [

        ...extra,

        ...FIXED

      ]

    );


  const seedSource =

    sources[0]

    ||

    FIXED[0];


  /*
   * Creamos las sesiones antes
   * de pedir ninguna jornada.
   */

  const sessions =

    await getHostSessions(
      seedSource
    );


  const rounds =
    roundsToCheck();


  /*
   * Todos los equipos en paralelo.
   */

  const results =

    await Promise.allSettled(

      sources.map(

        async source => {

          const data =

            await getTeamMatches(

              source,

              sessions,

              rounds

            );


          return {

            source,

            ...data

          };

        }

      )

    );


  let all = [];

  let ok = 0;

  let failed = 0;


  const errors = [];

  const teamDebug = {};


  for (
    const result
    of results
  ) {

    if (
      result.status ===
      'fulfilled'
    ) {

      ok++;


      const key =

        `${result.value.source.section} `

        +

        `${result.value.source.team}`;


      teamDebug[key] =

        result.value.debug;


      all.push(

        ...result.value.fixtures

      );

    }

    else {

      failed++;


      errors.push(

        String(

          result.reason?.message

          ||

          result.reason

        )

      );

    }

  }


  all =

    dedupeFixtures(
      all
    );


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
    of all
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

  const finalResults = [];


  for (
    const fixtures
    of byTeam.values()
  ) {

    /*
     * Próximo partido.
     */

    const future =

      fixtures

        .filter(

          fixture =>

            fixture.date

            &&

            new Date(

              `${fixture.date}T12:00:00`

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


    /*
     * Último resultado.
     */

    const past =

      fixtures

        .filter(

          fixture =>

            fixture.date

            &&

            new Date(

              `${fixture.date}T12:00:00`

            )

            <

            today

            &&

            fixture.score

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

      finalResults.push(
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


  finalResults.sort(

    (a, b) =>

      (b.date || '')

        .localeCompare(
          a.date || ''
        )

  );


  return {

    upcoming,

    results:
      finalResults,


    sourceTeams:

      sources.map(

        source =>

          `${source.section}|${source.team}`

      ),


    detectedTeams:

      [
        ...byTeam.keys()
      ],


    updatedAt:

      new Date()
        .toISOString(),


    source:
      'RFFM',


    diagnostics: {

      sources:
        sources.length,

      calendarsOk:
        ok,

      calendarsFailed:
        failed,

      fixtures:
        all.length,

      roundsChecked:
        rounds,


      /*
       * IMPORTANTE:
       * NO mostramos el valor real de
       * JSESSIONID públicamente.
       */

      sessions:

        sessions.map(

          session => ({

            host:
              session.host,

            hasCookie:
              session.hasCookie,

            trace:
              session.trace,

            error:
              session.error || null

          })

        ),


      parser:

        'v20-nfg-manual-redirect-cookie',


      errors:

        errors.slice(
          0,
          10
        ),


      /*
       * Diagnóstico para saber exactamente
       * qué devuelve la Federación.
       */

      teamDebug:

        Object.fromEntries(

          Object.entries(
            teamDebug
          )

          .map(

            ([key, value]) => [

              key,

              value.slice(
                0,
                6
              )

            ]

          )

        )

    }

  };

}


/* ==========================================================
   NETLIFY FUNCTION
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

          JSON.stringify(
            data
          )

      };

    }

    catch (error) {

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

          JSON.stringify(

            {

              error:

                'No se han podido obtener los partidos.',


              detail:

                String(

                  error?.message

                  ||

                  error

                ),


              parser:

                'v20-nfg-manual-redirect-cookie'

            }

          )

      };

    }

  };


exports._test = {

  parseRound,

  identity,

  sameRivas,

  canonical,

  roundsToCheck

};

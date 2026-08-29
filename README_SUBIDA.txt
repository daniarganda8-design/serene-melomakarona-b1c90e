RIVAS FUTSAL v14 - PARTIDOS AUTOMÁTICOS SIN FUNCTIONS

Esta versión no usa Netlify Functions ni npm.
Los partidos se consultan mediante proxies estáticos de Netlify (_redirects), por lo que funciona al subir la carpeta con Netlify Drop.

SUBIDA:
1. Descomprime el ZIP.
2. Arrastra la carpeta completa al área de Deploys de tu proyecto Netlify.
3. Espera a que figure Published.
4. Abre /partidos.

La web consulta RFFM automáticamente. No hay partidos escritos a mano.


V16: corregido CodJornada=1 y parser RFFM compatible con filas de tabla y encabezados jornada/fecha separados.

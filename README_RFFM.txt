RIVAS FUTSAL · RFFM AUTOMÁTICO v15

Esta versión NO usa un proxy directo del navegador a RFFM.
La función de Netlify abre una sesión de servidor y conserva la cookie JSESSIONID antes de leer el calendario federativo.
Esto evita la pantalla en blanco que devolvía RFFM al usar un rewrite /rffm/*.

DESPLIEGUE:
1. Inicia sesión en Netlify.
2. En el proyecto actual > Deploys, arrastra ESTA CARPETA COMPLETA (descomprimida), no solo los HTML.
3. Netlify verá netlify.toml y construirá netlify/functions/rffm-fixtures.js.
4. Cuando figure Published, prueba:
   /.netlify/functions/rffm-fixtures
   Debe mostrar JSON.
5. Después abre /partidos.

No hay partidos de respaldo inventados: si RFFM no devuelve un equipo, no se muestra.


V16: corregido CodJornada=1 y parser RFFM compatible con filas de tabla y encabezados jornada/fecha separados.

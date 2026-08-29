# Rivas Futsal — Web 2026/27

Web responsive de Rivas Futsal preparada para Netlify.

## Publicación correcta en Netlify

Esta versión contiene una **Netlify Function** para sincronizar los partidos con los calendarios de la RFFM. Por eso debe subirse como **proyecto**, no como una carpeta HTML ya construida.

1. Inicia sesión en Netlify.
2. Arrastra este ZIP (o su carpeta descomprimida) al área de publicación de Netlify.
3. `netlify.toml` está en la raíz y contiene un build mínimo para que Netlify detecte y despliegue `netlify/functions/rffm-fixtures.mjs`.
4. Cuando termine el deploy, la portada y `partidos.html` consultarán la función automáticamente.

No hace falta editar jornadas, rivales ni resultados manualmente.

> Si se abre `index.html` haciendo doble clic en el ordenador, los partidos no pueden cargarse porque las Netlify Functions solo existen cuando la web está publicada.

## Partidos automáticos

La función:
- descubre los equipos actuales de CDB Rivas Futsal y sus IDs de competición/grupo;
- consulta los calendarios públicos oficiales de la RFFM 2026/27;
- solo acepta encuentros en los que aparezca el equipo exacto de Rivas;
- muestra el siguiente encuentro de cada equipo cuya jornada esté publicada;
- consulta jornada, fecha, rival y, cuando RFFM lo informa, hora y pabellón;
- no utiliza partidos escritos a mano ni inventa rivales;
- se actualiza de forma automática y usa caché de corta duración.

## Estructura de la web

- `index.html` — portada
- `club.html` — historia y valores
- `masculina.html` — sección masculina
- `femenina.html` — sección femenina
- `cuerpo-tecnico.html` — entrenadores y delegados
- `partidos.html` — próximos partidos y resultados
- `patrocinadores.html` — patrocinadores y colaboradores
- `assets/js/site-data.js` — equipos, patrocinadores y cuerpo técnico
- `netlify/functions/rffm-fixtures.mjs` — sincronización RFFM

La Tarjeta Rivas no tiene enlace público a sus ventajas; esas ventajas siguen siendo exclusivas de los titulares que acceden mediante el QR de su tarjeta.


V16: corregido CodJornada=1 y parser RFFM compatible con filas de tabla y encabezados jornada/fecha separados.

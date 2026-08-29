import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUTPUT = path.join(ROOT, 'assets', 'data', 'noticias.json');
const IMAGE_DIR = path.join(ROOT, 'assets', 'images', 'instagram');

const TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const USERNAME = 'cdrivasfutsal';
const LIMIT = 6;

if (!TOKEN) {
  throw new Error('Falta el secreto INSTAGRAM_ACCESS_TOKEN en GitHub Actions.');
}

const fields = [
  'id',
  'caption',
  'media_type',
  'media_url',
  'thumbnail_url',
  'permalink',
  'timestamp'
].join(',');

const endpoint = new URL('https://graph.instagram.com/me/media');
endpoint.searchParams.set('fields', fields);
endpoint.searchParams.set('limit', String(LIMIT));
endpoint.searchParams.set('access_token', TOKEN);

const apiResponse = await fetch(endpoint, {
  headers: { 'User-Agent': 'Rivas-Futsal-Website/1.0' }
});

if (!apiResponse.ok) {
  const body = await apiResponse.text();
  throw new Error(`Instagram API ${apiResponse.status}: ${body.slice(0, 500)}`);
}

const apiData = await apiResponse.json();
const media = Array.isArray(apiData.data) ? apiData.data.slice(0, LIMIT) : [];

if (!media.length) {
  throw new Error('Instagram no ha devuelto publicaciones. Se conserva el JSON anterior.');
}

const cleanCaption = (value = '') => String(value)
  .replace(/\s+/g, ' ')
  .trim();

const candidatePosts = media.map((item) => ({
  id: String(item.id),
  caption: cleanCaption(item.caption || ''),
  mediaType: item.media_type || 'IMAGE',
  permalink: item.permalink || `https://www.instagram.com/${USERNAME}/`,
  timestamp: item.timestamp || null,
  remoteImage: item.media_type === 'VIDEO'
    ? (item.thumbnail_url || item.media_url || null)
    : (item.media_url || item.thumbnail_url || null)
}));

const previous = await fs.readFile(OUTPUT, 'utf8')
  .then(JSON.parse)
  .catch(() => null);

const previousCore = JSON.stringify(
  Array.isArray(previous?.posts)
    ? previous.posts.map(({ id, caption, mediaType, permalink, timestamp }) => ({ id, caption, mediaType, permalink, timestamp }))
    : []
);

const newCore = JSON.stringify(
  candidatePosts.map(({ id, caption, mediaType, permalink, timestamp }) => ({ id, caption, mediaType, permalink, timestamp }))
);

if (previousCore === newCore) {
  console.log('No hay publicaciones nuevas en Instagram.');
  process.exit(0);
}

await fs.rm(IMAGE_DIR, { recursive: true, force: true });
await fs.mkdir(IMAGE_DIR, { recursive: true });

const extensionFromType = (contentType = '') => {
  if (/webp/i.test(contentType)) return 'webp';
  if (/png/i.test(contentType)) return 'png';
  if (/gif/i.test(contentType)) return 'gif';
  return 'jpg';
};

const posts = [];

for (const item of candidatePosts) {
  let localImage = 'assets/images/rivas-futsal-logo.jpg';

  if (item.remoteImage) {
    try {
      const imageResponse = await fetch(item.remoteImage, {
        headers: { 'User-Agent': 'Rivas-Futsal-Website/1.0' }
      });

      if (imageResponse.ok) {
        const contentType = imageResponse.headers.get('content-type') || '';
        const ext = extensionFromType(contentType);
        const filename = `${item.id}.${ext}`;
        const filePath = path.join(IMAGE_DIR, filename);
        const buffer = Buffer.from(await imageResponse.arrayBuffer());
        await fs.writeFile(filePath, buffer);
        localImage = `assets/images/instagram/${filename}`;
      }
    } catch (error) {
      console.warn(`No se pudo descargar la imagen ${item.id}: ${error.message}`);
    }
  }

  posts.push({
    id: item.id,
    caption: item.caption,
    mediaType: item.mediaType,
    permalink: item.permalink,
    timestamp: item.timestamp,
    image: localImage
  });
}

const payload = {
  username: USERNAME,
  posts,
  updatedAt: new Date().toISOString(),
  source: 'Instagram API',
  diagnostics: {
    scraper: 'instagram-api-v1',
    posts: posts.length
  }
};

await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
await fs.writeFile(OUTPUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');
console.log(`Instagram actualizado: ${posts.length} publicaciones.`);

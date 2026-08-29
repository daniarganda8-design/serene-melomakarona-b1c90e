(() => {
  const host = document.querySelector('[data-instagram-news]');
  if (!host) return;

  const status = document.querySelector('[data-instagram-status]');
  const IG_URL = 'https://www.instagram.com/cdrivasfutsal/';

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const normalizeInstagramUrl = (value = '') => {
    try {
      const url = new URL(value);
      if (!/^(www\.)?instagram\.com$/i.test(url.hostname)) return null;

      const match = url.pathname.match(/^\/(p|reel)\/([^/]+)\/?/i);
      if (!match) return null;

      return `https://www.instagram.com/${match[1].toLowerCase()}/${match[2]}/`;
    } catch {
      return null;
    }
  };

  const renderFallback = () => {
    host.innerHTML = `
      <div class="instagram-news__empty">
        No se han podido cargar las publicaciones en este momento.<br>
        Puedes ver toda la actualidad del club en
        <a href="${IG_URL}" target="_blank" rel="noopener">@cdrivasfutsal</a>.
      </div>`;
  };

  const ensureInstagramScript = () => new Promise((resolve, reject) => {
    if (window.instgrm?.Embeds) {
      resolve();
      return;
    }

    const existing = document.querySelector('script[data-rivas-instagram-embed]');
    if (existing) {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.instagram.com/embed.js';
    script.async = true;
    script.defer = true;
    script.dataset.rivasInstagramEmbed = 'true';
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });

  const embedCard = (post) => {
    const permalink = normalizeInstagramUrl(post.permalink);
    if (!permalink) return '';

    const safePermalink = escapeHtml(permalink);
    const label = post.type === 'reel' ? 'REEL' : 'PUBLICACIÓN';

    return `
      <article class="instagram-card instagram-card--embed reveal is-visible" style="overflow:hidden;">
        <div style="padding:10px 10px 0;min-height:480px;display:flex;justify-content:center;align-items:flex-start;overflow:hidden;">
          <blockquote
            class="instagram-media"
            data-instgrm-captioned
            data-instgrm-permalink="${safePermalink}"
            data-instgrm-version="14"
            style="background:#fff;border:0;border-radius:12px;box-shadow:none;margin:0;max-width:540px;min-width:0;width:100%;"
          ></blockquote>
        </div>
        <div class="instagram-card__body" style="padding-top:12px;">
          <div class="instagram-card__meta">
            <span>${label}</span>
            <span>@cdrivasfutsal</span>
          </div>
          <a class="instagram-card__link" href="${safePermalink}" target="_blank" rel="noopener">VER EN INSTAGRAM →</a>
        </div>
      </article>`;
  };

  const load = async () => {
    if (window.location.protocol === 'file:') {
      if (status) status.textContent = 'Las publicaciones se muestran al publicar la web.';
      renderFallback();
      return;
    }

    try {
      const response = await fetch('/assets/data/noticias.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const posts = Array.isArray(data.posts) ? data.posts.slice(0, 3) : [];
      const cards = posts.map(embedCard).filter(Boolean);

      if (!cards.length) {
        if (status) status.textContent = '';
        renderFallback();
        return;
      }

      host.innerHTML = cards.join('');
      if (status) status.textContent = 'Últimas publicaciones seleccionadas de @cdrivasfutsal';

      try {
        await ensureInstagramScript();
        window.instgrm?.Embeds?.process();
      } catch (error) {
        console.warn('Instagram no pudo cargar el script de incrustación:', error);
        if (status) status.textContent = 'Pulsa en cada tarjeta para ver la publicación en Instagram.';
      }
    } catch (error) {
      console.warn('No se pudieron cargar las noticias:', error);
      if (status) status.textContent = '';
      renderFallback();
    }
  };

  load();
})();

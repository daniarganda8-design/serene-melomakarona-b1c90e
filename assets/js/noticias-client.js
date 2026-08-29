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

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date).replace('.', '');
  };

  const card = (post) => {
    const caption = escapeHtml(post.caption || 'Nueva publicación de Rivas Futsal.');
    const permalink = escapeHtml(post.permalink || IG_URL);
    const image = escapeHtml(post.image || 'assets/images/rivas-futsal-logo.jpg');
    const date = escapeHtml(formatDate(post.timestamp));
    const mediaLabel = post.mediaType === 'VIDEO' ? 'Vídeo' : 'Publicación';

    return `
      <article class="instagram-card reveal is-visible">
        <a class="instagram-card__media" href="${permalink}" target="_blank" rel="noopener" aria-label="Ver publicación en Instagram">
          <img src="${image}" alt="Publicación de Rivas Futsal" loading="lazy">
        </a>
        <div class="instagram-card__body">
          <div class="instagram-card__meta">
            <span>${escapeHtml(mediaLabel)}</span>
            <span>${date}</span>
          </div>
          <p>${caption}</p>
          <a class="instagram-card__link" href="${permalink}" target="_blank" rel="noopener">VER PUBLICACIÓN →</a>
        </div>
      </article>`;
  };

  const renderFallback = () => {
    host.innerHTML = `
      <div class="instagram-news__empty">
        Las últimas publicaciones aparecerán aquí automáticamente.<br>
        Mientras tanto, puedes seguir toda la actualidad en
        <a href="${IG_URL}" target="_blank" rel="noopener">@cdrivasfutsal</a>.
      </div>`;
  };

  const load = async () => {
    if (window.location.protocol === 'file:') {
      if (status) status.textContent = 'Las noticias automáticas se activan al publicar la web.';
      renderFallback();
      return;
    }

    try {
      const response = await fetch('/assets/data/noticias.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const posts = Array.isArray(data.posts) ? data.posts.slice(0, 3) : [];

      if (!posts.length) {
        if (status) status.textContent = '';
        renderFallback();
        return;
      }

      host.innerHTML = posts.map(card).join('');
      if (status) {
        const updated = data.updatedAt ? formatDate(data.updatedAt) : '';
        status.textContent = updated ? `Actualizado automáticamente · ${updated}` : 'Actualizado automáticamente desde Instagram';
      }
    } catch (error) {
      console.warn('No se pudieron cargar las noticias de Instagram:', error);
      if (status) status.textContent = '';
      renderFallback();
    }
  };

  load();
})();

(() => {
  const body = document.body;
  const menuButton = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-nav]');

  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const open = body.classList.toggle('menu-open');
      menuButton.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      body.classList.remove('menu-open');
      menuButton.setAttribute('aria-expanded', 'false');
    }));
  }

  const header = document.querySelector('.site-header');
  const onScroll = () => header && header.classList.toggle('is-scrolled', window.scrollY > 14);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const data = window.RIVAS_DATA || {};

  const renderTeams = (selector, teams = []) => {
    const host = document.querySelector(selector);
    if (!host) return;
    host.innerHTML = teams.map((team, index) => `
      <article class="team-card reveal" style="--delay:${Math.min(index * 45, 360)}ms">
        <div class="team-card__stripe team-card__stripe--${team.tone || 'blue'}"></div>
        <div class="team-card__meta">
          <span>${team.group}</span>
          <span>RIVAS FUTSAL</span>
        </div>
        <h3>${team.name}</h3>
        ${team.alias ? `<div class="team-card__alias">${team.alias}</div>` : ''}
        <p>${team.level}</p>
        <div class="team-card__number">${String(index + 1).padStart(2, '0')}</div>
      </article>
    `).join('');
  };

  const renderPartners = (selector, partners = [], compact = false) => {
    const host = document.querySelector(selector);
    if (!host) return;
    host.innerHTML = partners.map((partner, index) => `
      <article class="partner-card ${compact ? 'partner-card--compact' : ''} reveal" style="--delay:${Math.min(index * 45, 360)}ms">
        <div class="partner-card__logo"><img src="${partner.image}" alt="${partner.name}" loading="lazy"></div>
        <div class="partner-card__body">
          <span>${partner.role}</span>
          <h3>${partner.name}</h3>
          ${partner.detail ? `<p>${partner.detail}</p>` : ''}
        </div>
      </article>
    `).join('');
  };

  renderTeams('[data-male-teams]', data.maleTeams);
  renderTeams('[data-female-teams]', data.femaleTeams);
  renderPartners('[data-sponsors]', data.sponsors);
  renderPartners('[data-collaborators]', data.collaborators, true);

  const initials = (name = '') => name
    .replace(/[‘’"']/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();

  const staffByTeam = new Map((data.technicalStaff || []).map(item => [`${item.section}:${item.team}`, item]));
  const renderStaffSection = (selector, teams = [], sectionName = '') => {
    const host = document.querySelector(selector);
    if (!host) return;
    host.innerHTML = teams.map((team, index) => {
      const entry = staffByTeam.get(`${sectionName === 'Sección femenina' ? 'Femenina' : 'Masculina'}:${team.name}`);
      const members = entry?.members || [];
      const alias = entry?.alias ? `<span class="staff-team__alias">${entry.alias}</span>` : '';
      const memberHtml = members.length ? members.map(member => `
        <div class="staff-person ${member.image ? 'staff-person--poster' : ''}">
          ${member.image ? `<div class="staff-person__poster"><img src="${member.image}" alt="${member.name}" loading="lazy"></div>` : `<div class="staff-person__avatar" aria-hidden="true">${initials(member.name)}</div>`}
          <div class="staff-person__copy">
            <span>${member.role}</span>
            <strong>${member.name}</strong>
          </div>
        </div>
      `).join('') : `
        <div class="staff-empty">
          <span>Staff por completar</span>
          <p>El equipo está preparado para incorporar aquí sus entrenadores y delegados cuando queden confirmados.</p>
        </div>`;
      return `
        <article class="staff-team reveal" style="--delay:${Math.min(index * 45, 360)}ms">
          <div class="staff-team__top">
            <div>
              <span class="staff-team__section">${sectionName}</span>
              <h3>${team.name}</h3>
            </div>
            ${alias}
          </div>
          <div class="staff-team__members">${memberHtml}</div>
        </article>`;
    }).join('');
  };

  renderStaffSection('[data-staff-male]', data.maleTeams || [], 'Sección masculina');
  renderStaffSection('[data-staff-female]', data.femaleTeams || [], 'Sección femenina');



  // Partidos: datos preparados automáticamente por GitHub Actions y publicados como JSON estático.
  let fixtureStore = { upcoming: [], results: [], pending: [] };
  let currentFixtureFilter = 'all';

  const formatFixtureDate = (iso) => {
    if (!iso) return 'Fecha por confirmar';
    const d = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat('es-ES', { weekday:'short', day:'2-digit', month:'short' })
      .format(d).replace('.', '').toUpperCase();
  };

  const cleanClubName = (name = '') => name
    .replace(/\s*-\s*YOUFIRST SMART FIN(?:A|A)CE/gi, '')
    .replace(/^CD\s+/i, '')
    .replace(/\s+'[ABCD]'$/i, '')
    .trim();

  const fixtureCard = (fixture) => {

  const isFemale =
    fixture.section === 'Femenina';

  const badgeBg =
    isFemale
      ? 'rgba(180, 30, 60, 0.16)'
      : 'rgba(28, 78, 216, 0.16)';

  const badgeColor =
    isFemale
      ? '#b41e3c'
      : '#1c4ed8';

  const borderColor =
    isFemale
      ? 'rgba(180, 30, 60, 0.28)'
      : 'rgba(28, 78, 216, 0.28)';

  return `
    <article
      class="fixture-card reveal is-visible"
      data-section="${fixture.section || ''}"
      style="border:1px solid ${borderColor};"
    >

      <div class="fixture-card__top">
        <span>${fixture.team || 'Equipo'}</span>
        <span>Jornada ${fixture.round ?? '-'}</span>
      </div>

      <div style="margin:.4rem 0 1rem;">
        <span
          style="
            display:inline-flex;
            align-items:center;
            gap:.35rem;
            padding:.42rem .75rem;
            border-radius:999px;
            font-size:.78rem;
            font-weight:800;
            letter-spacing:.04em;
            text-transform:uppercase;
            background:${badgeBg};
            color:${badgeColor};
          "
        >
          ${fixture.section || 'Sección'}
        </span>
      </div>

      <div class="fixture-card__teams">
        <div class="fixture-team">
          <span class="fixture-team__label">Local</span>
          <strong>${fixture.home || '-'}</strong>
        </div>

        <div class="fixture-team fixture-team--divider">VS</div>

        <div class="fixture-team">
          <span class="fixture-team__label">Visitante</span>
          <strong>${fixture.away || '-'}</strong>
        </div>
      </div>

      <div class="fixture-card__meta">
        <div>
          <span>Fecha</span>
          <strong>${fixture.date || 'Por confirmar'}</strong>
        </div>

        <div>
          <span>Hora</span>
          <strong>${fixture.time || 'Por confirmar'}</strong>
        </div>

        <div>
          <span>Competición</span>
          <strong>${fixture.competitionName || '-'}</strong>
        </div>
      </div>

      ${
        fixture.sourceUrl
          ? `
            <div style="margin-top:1rem;">
              <a
                href="${fixture.sourceUrl}"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver calendario oficial
              </a>
            </div>
          `
          : ''
      }

    </article>
  `;
};
  const pendingFixtureCard = (item) => `
    <article class="fixture-card fixture-card--pending reveal is-visible" data-section="${item.section || ''}">
      <div class="fixture-card__top">
        <span>${item.team || 'Rivas Futsal'}</span>
        <span>PENDIENTE</span>
      </div>
      <div class="fixture-pending">
        <span class="fixture-pending__eyebrow">PRÓXIMAMENTE</span>
        <strong>Calendario 2026/27</strong>
        <p>${item.reason || 'La próxima jornada todavía no está publicada.'}</p>
      </div>
    </article>`;

  const renderFixtures = () => {
    document.querySelectorAll('[data-next-matches]').forEach(host => {
      const limit = Number(host.dataset.limit || 99);
      const filtered = fixtureStore.upcoming
        .filter(f => currentFixtureFilter === 'all' || f.section === currentFixtureFilter)
        .slice(0, limit);

      host.innerHTML = filtered.length
        ? filtered.map(f => fixtureCard(f, false)).join('')
        : '<div class="fixture-empty">Todavía no hay próximos partidos publicados para este filtro.</div>';
    });

    document.querySelectorAll('[data-pending-teams]').forEach(host => {
      const filtered = fixtureStore.pending
        .filter(item => currentFixtureFilter === 'all' || item.section === currentFixtureFilter);

      host.innerHTML = filtered.length
        ? filtered.map(pendingFixtureCard).join('')
        : '<div class="fixture-empty">Todos los equipos de este filtro tienen ya su próxima jornada publicada.</div>';
    });

    document.querySelectorAll('[data-last-results]').forEach(host => {
      const filtered = fixtureStore.results
        .filter(f => currentFixtureFilter === 'all' || f.section === currentFixtureFilter)
        .slice(0, 8);

      host.innerHTML = filtered.length
        ? filtered.map(f => fixtureCard(f, true)).join('')
        : '<div class="fixture-empty">Los resultados aparecerán automáticamente cuando comience la competición.</div>';
    });
  };

  const loadFixtures = async () => {
    const hosts = document.querySelectorAll('[data-next-matches], [data-pending-teams], [data-last-results]');
    if (!hosts.length) return;

    const statusEls = document.querySelectorAll('[data-fixtures-status]');

    if (window.location.protocol === 'file:') {
      fixtureStore = { upcoming: [], results: [], pending: [] };
      statusEls.forEach(el => el.textContent = 'Los partidos automáticos se activan al publicar la web.');
      renderFixtures();
      return;
    }

    statusEls.forEach(el => el.textContent = 'Cargando calendarios 2026/27…');

    try {
      if (!window.RivasFixtures || typeof window.RivasFixtures.load !== 'function') {
        throw new Error('módulo de partidos no cargado');
      }

      const payload = await window.RivasFixtures.load();

      fixtureStore.upcoming = Array.isArray(payload.upcoming) ? payload.upcoming : [];
      fixtureStore.results = Array.isArray(payload.results) ? payload.results : [];
      fixtureStore.pending = Array.isArray(payload.pendingTeams) ? payload.pendingTeams : [];

      renderFixtures();

      const detectedCount = Array.isArray(payload.detectedTeams) ? payload.detectedTeams.length : 0;
      const sourceCount = Array.isArray(payload.sourceTeams) ? payload.sourceTeams.length : detectedCount;
      const pendingCount = fixtureStore.pending.length;

      statusEls.forEach(el => {
        if (fixtureStore.upcoming.length) {
          el.textContent = `${fixtureStore.upcoming.length} equipos con próximo partido · ${sourceCount} categorías localizadas${pendingCount ? ` · ${pendingCount} pendientes` : ''}`;
        } else {
          el.textContent = `Calendarios sincronizados · ${sourceCount} categorías localizadas${pendingCount ? ` · ${pendingCount} pendientes de jornada` : ''}`;
        }
      });

      document.querySelectorAll('[data-fixtures-updated]').forEach(el => {
        const stamp = payload.updatedAt
          ? new Date(payload.updatedAt).toLocaleString('es-ES', { dateStyle:'short', timeStyle:'short' })
          : '';

        el.textContent = `Fuente: calendarios públicos RFFM · actualización automática${stamp ? ` · ${stamp}` : ''}`;
      });
    } catch (err) {
      fixtureStore = { upcoming: [], results: [], pending: [] };
      const detail = String(err?.message || 'sin respuesta').slice(0, 120);
      statusEls.forEach(el => el.textContent = `No se han podido cargar los calendarios (${detail}).`);
      renderFixtures();
    }
  };

  document.querySelectorAll('[data-fixture-filters] [data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFixtureFilter = btn.dataset.filter || 'all';
      document.querySelectorAll('[data-fixture-filters] [data-filter]')
        .forEach(b => b.classList.toggle('is-active', b === btn));
      renderFixtures();
    });
  });

  loadFixtures();

  const currentPage = body.dataset.page;
  document.querySelectorAll('[data-page-link]').forEach(link => {
    if (link.dataset.pageLink === currentPage) link.classList.add('is-active');
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
})();

(() => {
  async function load() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch('/assets/data/partidos.json', {
        signal: controller.signal,
        cache: 'no-store',
        headers: { 'accept': 'application/json' }
      });

      const text = await res.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch (_) {
        throw new Error(`El archivo de partidos respondió ${res.status}, pero no devolvió JSON válido.`);
      }

      if (!res.ok) {
        throw new Error(data?.detail || data?.error || `Error ${res.status}`);
      }

      return data;
    } finally {
      clearTimeout(timer);
    }
  }

  window.RivasFixtures = { load };
})();

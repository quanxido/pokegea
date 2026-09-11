(() => {
  'use strict';

  const isFile = window.location.protocol === 'file:';
  const rawPath = window.location.pathname.replace(/\\/g, '/');

  function normalizePath(p) {
    let value = p.replace(/\/index\.html$/i, '/');
    value = value.replace(/\/emulator\.html$/i, '/emulator/');
    value = value.replace(/\/emulator\/index\.html$/i, '/emulator/');
    if (!value.endsWith('/')) value += '/';
    return value.replace(/\/\/+/g, '/');
  }

  function httpRoutes() {
    const path = normalizePath(rawPath);
    const emulatorMatch = path.match(/^(.*\/?)emulator\/$/i);
    const root = emulatorMatch ? emulatorMatch[1] : path;
    return {
      games: `${root}`,
      emulator: `${root}emulator/`
    };
  }

  function fileRoutes() {
    const dir = rawPath.endsWith('/') ? rawPath : rawPath.substring(0, rawPath.lastIndexOf('/') + 1);
    const inNestedEmulator = /\/emulator\/?$/i.test(rawPath) || /\/emulator\/index\.html$/i.test(rawPath);
    if (inNestedEmulator) return { games: '../index.html', emulator: './' };
    return { games: 'index.html', emulator: 'emulator.html' };
  }

  const routes = isFile ? fileRoutes() : httpRoutes();
  const currentPath = rawPath.toLowerCase();

  // Normalize direct legacy HTTP URLs before binding navigation.
  if (!isFile) {
    if (/\/emulator\.html$/i.test(currentPath) || /\/emulator\/index\.html$/i.test(currentPath)) {
      window.location.replace(routes.emulator);
      return;
    }
    if (/\/index\.html$/i.test(currentPath)) {
      window.location.replace(routes.games);
      return;
    }
  }

  document.querySelectorAll('a[data-route]').forEach((a) => {
    const target = a.dataset.route === 'emulator' ? routes.emulator : routes.games;
    a.href = target;
    a.addEventListener('click', (event) => {
      event.preventDefault();
      window.location.assign(target);
    });
  });

  window.POKEGearRoutes = routes;
})();

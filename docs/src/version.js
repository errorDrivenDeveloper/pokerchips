// Fingerprint the static app files so every change to the shipped app gets a
// new identifier without needing a build pipeline or a GitHub API request.
const files = [
  '../index.html', '../styles.css', '../version.json', './main.js', './version.js',
  './game/setup.js', './game/hand.js', './game/pots.js',
];
const label = document.querySelector('#app-version');
try {
  const contents = await Promise.all(files.map(async file => {
    const response = await fetch(new URL(file, import.meta.url));
    if (!response.ok) throw new Error('Version file unavailable');
    return response.text();
  }));
  const bytes = new TextEncoder().encode(contents.join('\n'));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const release = JSON.parse(contents[2]).version;
  if (!/^\d+\.\d+\.\d+$/.test(release)) throw new Error('Invalid release version');
  const build = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('').slice(0, 8);
  label.textContent = `Version ${release} · build ${build}`;
} catch {
  label.textContent = 'Version unavailable';
}

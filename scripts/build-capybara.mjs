import { readFile, writeFile, mkdir, stat, copyFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

// Downloads public licensed media into the Pages artifact, never into the Git repository.
const destination = path.resolve('dist/capybara/media');
await mkdir(destination, { recursive: true });
const manifest = JSON.parse(await readFile('public/capybara/media.json', 'utf8'));
const allowedHosts = new Set(['images.unsplash.com', 'upload.wikimedia.org']);
for (const item of manifest) {
  if (!allowedHosts.has(new URL(item.url).hostname) || !/^[\w-]+\.(jpg|webm)$/.test(item.file)) throw new Error('Invalid media manifest entry');
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(item.url, { signal: AbortSignal.timeout(120000), headers: { 'User-Agent': 'CapybaraClub/1.0 (educational website; github.com/Iohoilpotere/Test_GPT)' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${item.file}`);
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.startsWith(item.type) && contentType !== 'application/octet-stream') throw new Error(`Unexpected content type: ${contentType}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < 1000) throw new Error(`Empty or invalid media: ${item.file}`);
      await writeFile(path.join(destination, item.file), buffer);
      console.log(`MEDIA_OK ${item.file} ${buffer.length} bytes ${contentType}`);
      lastError = null; break;
    } catch (error) { lastError = error; console.warn(`Retry ${attempt + 1}: ${error.message}`); await new Promise(resolve => setTimeout(resolve, 2500 * (attempt + 1))); }
  }
  if (lastError) throw lastError;
}
// Prefer a real frame from the actual embedded video, with a licensed photo fallback.
try {
  execFileSync('ffmpeg', ['-y', '-ss', '5', '-i', path.join(destination, 'capybara-twins.webm'), '-frames:v', '1', '-vf', 'scale=1400:-1', '-q:v', '3', path.join(destination, 'video-poster.jpg')], { stdio: 'pipe', timeout: 30000 });
  console.log('POSTER_OK extracted video frame at 00:05');
} catch (_) { await copyFile(path.join(destination, 'family.jpg'), path.join(destination, 'video-poster.jpg')); console.log('POSTER_OK licensed family photograph fallback'); }
const html = await readFile('dist/capybara/index.html', 'utf8');
for (const file of ['styles.css', 'app.js', 'favicon.svg']) { const s = await stat(`dist/capybara/${file}`); if (!s.size) throw new Error(`Empty file: ${file}`); }
if (!html.includes('Capybara Club — Meno fretta. Più capybara.') || !html.includes('id="quiz"')) throw new Error('Missing site content');
console.log('CAPYBARA_BUILD_OK all site files and licensed media are present');
// On a rebuild, independently verify the previously deployed public version.
const publicURL = 'https://iohoilpotere.github.io/Test_GPT/capybara/';
try {
  const response = await fetch(publicURL + '?verify=' + Date.now(), { signal: AbortSignal.timeout(20000), headers: { 'Cache-Control': 'no-cache' } });
  const content = await response.text();
  const valid = response.ok && content.includes('Capybara Club — Meno fretta. Più capybara.');
  console.log(`PUBLIC_CHECK ${response.status} expected_content=${valid} ${publicURL}`);
  if (valid) {
    for (const item of manifest) {
      const mediaResponse = await fetch(publicURL + 'media/' + item.file, { method: 'HEAD', signal: AbortSignal.timeout(20000) });
      console.log(`PUBLIC_MEDIA_CHECK ${mediaResponse.status} ${item.file} bytes=${mediaResponse.headers.get('content-length')}`);
    }
  }
} catch (error) { console.log('PUBLIC_CHECK first deployment or network not ready: ' + error.message); }

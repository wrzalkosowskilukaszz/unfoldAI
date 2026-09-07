/*
 * Screenshots and print-to-PDF against the dev server, driven through headless
 * Chrome's DevTools protocol. Exists because the in-app browser pane never
 * repaints after a scroll, so anything below the fold — and every phone
 * screenshot — has to come from here. Also the only way to check what
 * "Save as PDF" actually prints.
 *
 *   node scripts/shot.mjs http://localhost:5173/ out.png --w=390 --h=844 --mobile
 *   node scripts/shot.mjs "http://localhost:5173/?b=b-zorka&s=8" out.pdf
 *
 * Flags: --w --h  viewport; --mobile  phone UA + touch; --dark  dark theme;
 *        --viewport  one screen instead of the full page (tall pages tile);
 *        --clear  empty localStorage (first-run); --noseed  leave storage alone;
 *        --seed=file  localStorage seed script (default scripts/seed-briefs.js,
 *        two briefs, one with survey findings); --eval=js  run before capture;
 *        --wait=ms  settle time after load.
 */
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [url, out, ...rest] = process.argv.slice(2);
const opt = Object.fromEntries(rest.map((a) => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return [m[1], m[2] ?? true]; }));
const W = Number(opt.w ?? 1440), H = Number(opt.h ?? 900), mobile = !!opt.mobile;
const port = 9333 + Math.floor(Math.random() * 500);
const profile = mkdtempSync(join(tmpdir(), 'shot-'));
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars', `--window-size=${W},${H}`, 'about:blank'],
  { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let info;
for (let i = 0; i < 50; i++) { try { info = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); break; } catch { await sleep(100); } }
const ws = new WebSocket(info.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const i = ++id; pending.set(i, (m) => m.error ? rej(new Error(method + ': ' + JSON.stringify(m.error))) : res(m.result)); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId: s } = await send('Target.attachToTarget', { targetId, flatten: true });
await send('Page.enable', {}, s); await send('Runtime.enable', {}, s);
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile }, s);
if (mobile) await send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' }, s);
if (opt.dark) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] }, s);
const origin = new URL(url).origin;
const nav = async (u) => { await send('Page.navigate', { url: u }, s); await sleep(1200); };
await nav(origin + '/privacy');
if (opt.clear) await send('Runtime.evaluate', { expression: 'localStorage.clear()' }, s);
if (!opt.noseed && !opt.clear) await send('Runtime.evaluate', { expression: readFileSync(opt.seed ?? new URL('./seed-briefs.js', import.meta.url), 'utf8') }, s);
if (opt.dark) await send('Runtime.evaluate', { expression: "localStorage.setItem('surveyvor-theme','dark')" }, s);
await nav(url);
await sleep(Number(opt.wait ?? 1500));
if (opt.eval) { const r = await send('Runtime.evaluate', { expression: opt.eval, awaitPromise: true, returnByValue: true }, s); console.log('eval:', JSON.stringify(r.result.value)); await sleep(800); }
if (out.endsWith('.pdf')) {
  const { data } = await send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true }, s);
  writeFileSync(out, Buffer.from(data, 'base64'));
} else {
  const { cssContentSize } = await send('Page.getLayoutMetrics', {}, s);
  const full = !opt.viewport;
  const height = full ? Math.min(Math.ceil(cssContentSize.height), 6000) : H;
  await send('Emulation.setDeviceMetricsOverride', { width: W, height, deviceScaleFactor: 1, mobile }, s);
  await sleep(400);
  const tiles = Math.max(1, Math.ceil(height / H));
  for (let t = 0; t < tiles; t++) {
    const y = t * H, h = Math.min(H, height - y);
    const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y, width: W, height: h, scale: 1 } }, s);
    const name = tiles === 1 ? out : out.replace(/\.png$/, `-${t + 1}.png`);
    writeFileSync(name, Buffer.from(data, 'base64'));
    console.log(name, W + 'x' + h, 'at y=' + y);
  }
}
ws.close(); chrome.kill();

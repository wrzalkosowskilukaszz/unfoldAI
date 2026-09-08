/*
 * The browser-testing checklist (.claude/skills/browser-testing), run through
 * headless Chrome's DevTools protocol — no MCP server needed. For each page:
 * console errors and warnings, failed network requests, heading order,
 * interactive elements without an accessible name, live regions, and the
 * Core Web Vitals the browser can report (LCP, CLS). Exits non-zero on a
 * console error, a failed request, or an unnamed control.
 *
 *   node scripts/browser-audit.mjs https://surveyvor.app [--mobile] [--clear]
 *
 * Seeds the same two test briefs as scripts/shot.mjs unless --clear.
 */
import { spawn } from 'node:child_process';
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const base = (process.argv[2] ?? 'http://localhost:5173').replace(/\/$/, '');
const opt = new Set(process.argv.slice(3));
const mobile = opt.has('--mobile');
const W = mobile ? 390 : 1440, H = mobile ? 844 : 900;

const pages = [
	['gallery', '/'],
	['basics', '/?b=b-zorka&s=1'],
	['section', '/?b=b-zorka&s=4'],
	['survey', '/?b=b-zorka&s=7'],
	['export', '/?b=b-zorka&s=8'],
	['import', '/?new=doc'],
	['privacy', '/privacy'],
	['terms', '/terms'],
	['404', '/does-not-exist']
];

const port = 9500 + Math.floor(Math.random() * 400);
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'audit-'))}`, '--no-first-run', `--window-size=${W},${H}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let info; for (let i = 0; i < 50; i++) { try { info = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); break; } catch { await sleep(100); } }
const ws = new WebSocket(info.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); const events = [];
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else if (m.method) events.push(m); };
const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const i = ++id; pending.set(i, (m) => m.error ? rej(new Error(method + ': ' + JSON.stringify(m.error))) : res(m.result)); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId: s } = await send('Target.attachToTarget', { targetId, flatten: true });
for (const d of ['Page', 'Runtime', 'Log', 'Network', 'Accessibility']) await send(`${d}.enable`, {}, s);
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile }, s);
if (mobile) await send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' }, s);

const waitLoad = () => new Promise((r) => { const h = ws.onmessage; ws.onmessage = (e) => { h(e); if (JSON.parse(e.data).method === 'Page.loadEventFired') { ws.onmessage = h; r(); } }; });

// Seed (or clear) storage on the origin first.
let p = waitLoad(); await send('Page.navigate', { url: base + '/privacy' }, s); await p; await sleep(300);
await send('Runtime.evaluate', { expression: opt.has('--clear') ? 'localStorage.clear(); sessionStorage.clear();' : readFileSync(new URL('./seed-briefs.js', import.meta.url), 'utf8') }, s);

const A11Y = `(() => {
  const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(h => h.offsetParent !== null).map(h => +h.tagName[1]);
  const skips = []; for (let i = 1; i < hs.length; i++) if (hs[i] > hs[i-1] + 1) skips.push(hs[i-1] + '→' + hs[i]);
  const name = (el) => (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title') || el.textContent || el.getAttribute('alt') || (el.labels && [...el.labels].map(l => l.textContent).join(' ')) || el.getAttribute('placeholder') || '').trim();
  const unnamed = [...document.querySelectorAll('button, a[href], input:not([type=hidden]), textarea, select, [role=button]')].filter(el => el.offsetParent !== null && !name(el)).map(el => el.outerHTML.slice(0, 80));
  const live = document.querySelectorAll('[aria-live], [role=status], [role=alert]').length;
  const imgsNoAlt = [...document.querySelectorAll('img')].filter(i => !i.hasAttribute('alt')).length;
  return { h1: hs.filter(h => h === 1).length, headings: hs.join(' '), skips, unnamed, live, imgsNoAlt };
})()`;
const VITALS = `new Promise(r => { let cls = 0, lcp = 0; try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); new PerformanceObserver(l => { const e = l.getEntries().at(-1); if (e) lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch {} setTimeout(() => r({ lcp: Math.round(lcp), cls: +cls.toFixed(3), domInteractive: Math.round(performance.timing.domInteractive - performance.timing.navigationStart) }), 600); })`;

let failures = 0;
for (const [name, path] of pages) {
	events.length = 0;
	p = waitLoad(); await send('Page.navigate', { url: base + path }, s); await p; await sleep(2200);
	const consoleErr = events.filter((m) => m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')).map((m) => `${m.params.type}: ${m.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 140)}`);
	const logErr = events.filter((m) => m.method === 'Log.entryAdded' && (m.params.entry.level === 'error' || m.params.entry.level === 'warning')).map((m) => `${m.params.entry.level}: ${m.params.entry.text.slice(0, 140)}`);
	const exceptions = events.filter((m) => m.method === 'Runtime.exceptionThrown').map((m) => 'exception: ' + (m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text).slice(0, 140));
	const bad = events.filter((m) => m.method === 'Network.responseReceived' && m.params.response.status >= 400).map((m) => `${m.params.response.status} ${m.params.response.url.replace(base, '')}`);
	const failed = events.filter((m) => m.method === 'Network.loadingFailed' && !m.params.canceled).map((m) => `failed ${m.params.errorText}`);
	const a11y = (await send('Runtime.evaluate', { expression: A11Y, returnByValue: true }, s)).result.value;
	const vit = (await send('Runtime.evaluate', { expression: VITALS, awaitPromise: true, returnByValue: true }, s)).result.value;
	const expected404 = name === '404';
	const own404 = (t) => expected404 && /status of 404/.test(t);
	const problems = [...consoleErr.filter((t) => !own404(t)), ...logErr.filter((t) => !own404(t)), ...exceptions, ...bad.filter((b) => !(expected404 && b.startsWith('404'))), ...failed];
	const a11yProblems = [...a11y.unnamed.map((u) => 'unnamed control: ' + u), ...(a11y.h1 !== 1 ? [`h1 count ${a11y.h1}`] : []), ...a11y.skips.map((k) => 'heading skip ' + k), ...(a11y.imgsNoAlt ? [`${a11y.imgsNoAlt} img without alt`] : [])];
	const ok = problems.length === 0 && a11yProblems.length === 0;
	if (!ok) failures++;
	console.log(`${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(8)} ${path.padEnd(22)} LCP ${String(vit.lcp).padStart(4)}ms  CLS ${vit.cls}  interactive ${vit.domInteractive}ms  headings [${a11y.headings}]  live regions ${a11y.live}`);
	for (const x of [...problems, ...a11yProblems]) console.log('       - ' + x);
}
console.log(failures ? `\n${failures} page(s) with findings` : '\nall pages clean');
ws.close(); chrome.kill();
process.exit(failures ? 1 : 0);

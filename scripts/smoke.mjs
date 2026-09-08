/*
 * Spends real money on purpose: runs the survey on fixed briefs against a
 * deployment and checks the shape of what comes back. Run after every deploy
 * that touches an API route or a prompt. About 5 cents per brief.
 *
 *   node scripts/smoke.mjs https://surveyvor.app
 *   node scripts/smoke.mjs http://localhost:5173
 */
const base = (process.argv[2] ?? 'https://surveyvor.app').replace(/\/$/, '');

const briefs = [
	{
		name: 'skincare launch (identity)',
		meta: { projectName: 'Skincare brand launch', clientName: 'New sustainable skincare brand', briefDate: '', launchDate: '', role: 'delivering', projectType: 'identity' },
		sections: {
			objectives: 'Brand: New sustainable skincare brand.\nObjective: Launch the brand and build awareness among young professionals.\nPositioning: Premium, but approachable.',
			audience: 'Young professionals.', brandEquity: '', deliverables: '', constraints: ''
		}
	},
	{
		name: 'sauce relaunch (campaign)',
		meta: { projectName: 'Zorka sauce range relaunch', clientName: 'Zorka Foods', briefDate: '2026-09-01', launchDate: '2026-11-15', role: 'delivering', projectType: 'campaign' },
		sections: {
			objectives: 'Relaunch the hot sauce range across Poland and Germany. Sales have flattened since 2024. The board wants "a premium feel" but retail buyers are asking for price promotions. Success is measured as +20% units in Q1.',
			audience: 'Home cooks 25-40 who already buy sriracha-style sauces. Key message: real chillies, nothing hidden.',
			channels: 'Instagram and TikTok paid, in-store shelf wobblers, maybe OOH in Warsaw. Media not booked yet.',
			deliverables: 'Hero film 30s, 6 social cut-downs, KV for shelf, 3 static posts per week for 8 weeks.',
			constraints: 'Budget 180k PLN all-in including media. Launch 15 November. Brand red must stay. Legal: no health claims.'
		}
	}
];

let failed = 0;
const check = (ok, msg) => { console.log(`  ${ok ? 'ok ' : 'FAIL'} ${msg}`); if (!ok) failed++; };

for (const b of briefs) {
	console.log(`\n${b.name} → ${base}`);
	const t0 = Date.now();
	const res = await fetch(`${base}/api/review-brief`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ meta: b.meta, sections: b.sections, helpHistory: [], decisions: [] }) });
	const secs = ((Date.now() - t0) / 1000).toFixed(1);
	check(res.status === 200, `status ${res.status} in ${secs}s`);
	if (res.status !== 200) { console.log('  ', (await res.text()).slice(0, 200)); continue; }
	const { findings } = await res.json();
	check(Array.isArray(findings) && findings.length >= 4 && findings.length <= 7, `${findings?.length} findings (4–7 expected)`);
	check(findings.some((f) => f.kind === 'clear'), 'at least one Marker (clear)');
	check(findings.filter((f) => f.kind !== 'clear').every((f) => f.question && Array.isArray(f.options) && f.options.length >= 2), 'every actionable finding has a question and options');
	check(findings.filter((f) => f.kind === 'contradiction').every((f) => f.evidence?.length > 0), 'every Tension quotes the brief');
	const brief = Object.values(b.sections).join('\n').toLowerCase();
	check(findings.every((f) => (f.evidence ?? []).every((q) => brief.replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').includes(q.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim()))), 'every quote really is in the brief');
	check(findings.every((f) => f.section === null || f.section === 'basics' || f.section in b.sections), 'every section reference is real');
	for (const f of findings) console.log(`    [${f.kind}] ${f.dimension}${f.section ? ` → ${f.section}` : ''}: ${f.title}`);
}
console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
process.exit(failed ? 1 : 0);

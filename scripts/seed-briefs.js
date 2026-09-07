// Test data for scripts/shot.mjs: two briefs, one mid-survey with findings. Runs inside the page.
(() => {
const now = new Date().toISOString();
const sec = (raw) => ({ raw, refined: null, accepted: false, status: 'idle', error: null });
const empty = () => Object.fromEntries(['objectives','audience','deliverables','constraints','content','brandEquity','channels','specs','manufacturing'].map(k => [k, sec('')]));
const b1 = {
  id: 'b-zorka', name: 'Zorka sauce range relaunch', nameManuallySet: false,
  createdAt: '2026-09-01T09:00:00Z', updatedAt: now, step: 7,
  meta: { projectName: 'Zorka sauce range relaunch', clientName: 'Zorka Foods', briefDate: '2026-09-01', launchDate: '2026-11-15', role: 'delivering', projectType: 'campaign' },
  sections: { ...empty(),
    objectives: sec('Zorka wants to relaunch its hot sauce range across Poland and Germany. Sales have flattened since 2024. The board wants "a premium feel" but the retail buyers are asking for price promotions. Success is measured as +20% units in Q1.\n\nThe range has six SKUs today and two more are planned for spring. The relaunch is meant to make the shelf block read as one family again, because the last three years of line extensions have each been designed by a different studio and the packs no longer look related. Distribution is strong in Biedronka and Lidl PL; the German listing is new and starts with Rewe in Q4.'),
    audience: sec('Home cooks 25-40 who already buy sriracha-style sauces. They care about heat level honesty and clean labels. Key message: real chillies, nothing hidden.\n\nSecondary: the existing buyer, mostly men 30-45 who treat it as a weekly staple and would notice if the recipe changed. They must not be alienated by the redesign.'),
    channels: sec('Instagram and TikTok paid, in-store shelf wobblers, maybe OOH in Warsaw. Media not booked yet. Need 15s and 6s cut-downs, 9:16 and 1:1.'),
    deliverables: sec('Hero film 30s, 6 social cut-downs, KV for shelf, 3 static posts per week for 8 weeks.\n\n- Hero film: 30s, 16:9 master plus 9:16 and 1:1 versions\n- Cut-downs: 15s x3, 6s x3\n- Key visual: adaptable to shelf wobbler, A1 poster and web banner\n- Social: 24 statics in total, two per week per platform'),
    constraints: sec('Budget 180k PLN all-in including media. Launch 15 November, must be in stores before Black Friday. Brand red must stay. Legal: no health claims.\n\nApprovals go through the marketing director and then the board, which meets monthly. Any talent must be non-union. Photography of the product must show the real bottle, not a render.')
  },
  helpHistory: [{ section: 'audience', question: 'Who buys it today?', answer: 'Mostly men 30-45, but we want younger women too' }],
  findings: [
    { id: 'f1', kind: 'contradiction', dimension: 'Positioning', title: 'Premium feel vs. price promotions', detail: 'The board wants "a premium feel" while retail buyers are "asking for price promotions". A brand cannot lead on both at launch.', question: 'Which one wins if they collide on shelf?', options: ['Premium — hold price', 'Promotions — volume first', 'Premium brand, promo at trade level', 'Not decided yet'], status: 'open' },
    { id: 'f2', kind: 'contradiction', dimension: 'Success criteria', title: 'Awareness ambition measured by units', detail: 'The film and OOH are awareness channels, but success is "+20% units in Q1". The metric does not measure what the plan mostly buys.', question: 'What is the primary measure?', options: ['Units sold', 'Aided awareness', 'Both, with a split', 'Something else'], status: 'open' },
    { id: 'f3', kind: 'missing', dimension: 'Rights', title: 'No usage rights or talent duration', detail: 'Paid social for 8 weeks plus OOH implies talent and music buyouts, but no duration or territory is stated.', question: 'How long and where will the assets run?', options: ['8 weeks, PL + DE', '12 months, PL + DE', 'Perpetual, worldwide', 'Not sure yet'], status: 'open' },
    { id: 'f4', kind: 'assumption', dimension: 'Audience', title: 'Assumed the German audience matches the Polish one', detail: 'Only one audience is described. I assumed it applies to both markets, which is rarely true for sauce heat preferences.', question: 'Is the German audience the same?', options: ['Yes, same brief', 'No, needs its own', 'Germany is secondary'], status: 'confirmed', resolution: 'Germany is secondary', resolvedAt: now },
    { id: 'f5', kind: 'attention', dimension: 'Scope', title: '"Maybe OOH in Warsaw" is undecided', detail: 'OOH changes the asset list and the budget split, and is currently a maybe.', question: 'Is OOH in or out?', options: ['In', 'Out', 'Decide after media plan'], status: 'dismissed', dismissedAt: now },
    { id: 'f6', kind: 'clear', dimension: 'Timeline', title: 'Launch date is firm and specific', detail: '15 November, in stores before Black Friday — a real constraint the whole plan can be built back from.', status: 'open' }
  ],
  reviewedAt: '2026-09-05T14:00:00Z', polishedBrief: null, lastExportedAt: null
};
const b2 = { id: 'b-blank', name: 'Untitled Brief', nameManuallySet: false, createdAt: '2026-09-06T10:00:00Z', updatedAt: '2026-09-06T10:00:00Z', step: 1,
  meta: { projectName: '', clientName: '', briefDate: '', launchDate: '', role: null, projectType: null },
  sections: empty(), helpHistory: [], findings: [], reviewedAt: null, polishedBrief: null, lastExportedAt: null };
localStorage.setItem('surveyvor-briefs-v1', JSON.stringify({ briefs: { 'b-zorka': b1, 'b-blank': b2 }, activeBriefId: 'b-zorka' }));
localStorage.setItem('surveyvor-ai-notice-seen-v1', '1');
localStorage.setItem('surveyvor-theme', 'light');
// The opening animation plays once per session; screenshots want the page at rest.
sessionStorage.setItem('surveyvor-intro-seen', '1');
return 'seeded';
})()

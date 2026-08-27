import type { RequestHandler } from './$types';

const SITE = 'https://surveyvor.app';
/** Only publicly reachable pages — the app is gated and carries noindex. */
const PAGES = ['', '/unlock', '/privacy', '/terms'];

export const GET: RequestHandler = async () => {
	const today = new Date().toISOString().slice(0, 10);
	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map((p) => `\t<url>\n\t\t<loc>${SITE}${p}</loc>\n\t\t<lastmod>${today}</lastmod>\n\t</url>`).join('\n')}
</urlset>`;

	return new Response(body, {
		headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'max-age=3600' }
	});
};

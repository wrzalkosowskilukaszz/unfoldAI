import type { RequestHandler } from './$types';
import { isAuthConfigured } from '$lib/server/auth';

const SITE = 'https://surveyvor.app';

export const GET: RequestHandler = async () => {
	// /unlock redirects home when no password is set, so it is only a page while the gate is on.
	const PAGES = ['', '/privacy', '/terms', ...(isAuthConfigured() ? ['/unlock'] : [])];
	const today = new Date().toISOString().slice(0, 10);
	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map((p) => `\t<url>\n\t\t<loc>${SITE}${p}</loc>\n\t\t<lastmod>${today}</lastmod>\n\t</url>`).join('\n')}
</urlset>`;

	return new Response(body, {
		headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'max-age=3600' }
	});
};

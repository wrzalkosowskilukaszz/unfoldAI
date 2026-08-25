/**
 * mammoth ships types for its Node entry but not the browser bundle, which is
 * the one we need (the Node build pulls in fs and won't run client-side).
 */
declare module 'mammoth/mammoth.browser.js' {
	export function extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<{
		value: string;
		messages: unknown[];
	}>;
}

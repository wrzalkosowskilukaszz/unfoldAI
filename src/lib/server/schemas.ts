/**
 * Output schemas handed to the API as `output_config.format`, so a route never
 * again depends on the model choosing to answer in raw JSON. The server
 * enforces the shape; the routes still validate the values.
 */

const FINDING_KINDS = ['clear', 'attention', 'contradiction', 'missing', 'assumption', 'why'];

export const REVIEW_SCHEMA = {
	type: 'object',
	properties: {
		findings: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					kind: { type: 'string', enum: FINDING_KINDS },
					dimension: { type: 'string' },
					/** A section id from the brief, "basics", or null when it spans the whole brief. */
					section: { type: ['string', 'null'] },
					title: { type: 'string' },
					detail: { type: 'string' },
					/** Verbatim quotes from the brief that this finding rests on. */
					evidence: { type: 'array', items: { type: 'string' } },
					question: { type: ['string', 'null'] },
					options: { type: 'array', items: { type: 'string' } }
				},
				required: ['id', 'kind', 'dimension', 'section', 'title', 'detail', 'evidence', 'question', 'options'],
				additionalProperties: false
			}
		}
	},
	required: ['findings'],
	additionalProperties: false
} as const;

export const RECONSIDER_SCHEMA = {
	type: 'object',
	properties: {
		retire: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					reason: { type: 'string' }
				},
				required: ['id', 'reason'],
				additionalProperties: false
			}
		}
	},
	required: ['retire'],
	additionalProperties: false
} as const;

export const QUESTION_SCHEMA = {
	type: 'object',
	properties: {
		done: { type: 'boolean' },
		question: {
			type: ['object', 'null'],
			properties: {
				id: { type: 'string' },
				text: { type: 'string' },
				type: { type: 'string', enum: ['choice', 'text'] },
				options: { type: 'array', items: { type: 'string' } }
			},
			required: ['id', 'text', 'type', 'options'],
			additionalProperties: false
		}
	},
	required: ['done', 'question'],
	additionalProperties: false
} as const;

export const DOCUMENT_SORT_SCHEMA = {
	type: 'object',
	properties: {
		projectName: { type: 'string' },
		clientName: { type: 'string' },
		objectives: { type: 'string' },
		audience: { type: 'string' },
		deliverables: { type: 'string' },
		constraints: { type: 'string' },
		unplaced: { type: 'string' }
	},
	required: ['projectName', 'clientName', 'objectives', 'audience', 'deliverables', 'constraints', 'unplaced'],
	additionalProperties: false
} as const;

export const CREATIVE_STRATEGIST_SYSTEM_PROMPT = `You are an elite Creative Strategist and Brand Director. Your task is to transform loose, vague, or messy client notes into crisp, professional, and actionable creative brief sections for designers and agency teams.

Rules:
1. Eliminate fluff, buzzwords, and ambiguity.
2. Extract the true business objective and strategic intent.
3. Organize output using clear bullet points and markdown bolding.
4. Keep tone professional, analytical, and structured.
5. If information is severely lacking, add a short section titled "Suggested Clarifications Needed".`;

export const SECTION_FRAMING: Record<string, string> = {
	objectives: 'Frame the output as: **Problem Statement**, **Business Goal**, and **Success Metrics**.',
	audience: 'Frame the output as: **Primary Persona**, **Core Pain Point**, and **Desired Action**.',
	deliverables: 'Format the output as an itemized, clear spec sheet of deliverables.',
	constraints:
		'Organize the output as a clear, bulleted list of constraints and mandatories (budget, timeline, brand rules, legal/compliance, must-haves).'
};

export const SECTION_LABELS_FOR_PROMPT: Record<string, string> = {
	objectives: 'Context & Objectives',
	audience: 'Target Audience & Key Message',
	deliverables: 'Aesthetics, Tone & Deliverables',
	constraints: 'Constraints & Mandatories'
};

export const VALID_SECTIONS = new Set(Object.keys(SECTION_FRAMING));

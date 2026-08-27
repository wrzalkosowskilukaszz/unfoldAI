<script lang="ts">
	import LegalPage from '$lib/components/LegalPage.svelte';
</script>

<svelte:head>
	<title>Privacy — Surveyvor</title>
	<meta
		name="description"
		content="What Surveyvor does and does not collect. Your briefs stay in your browser."
	/>
</svelte:head>

<LegalPage title="Privacy Policy" updated="27 August 2026">
	<div class="summary">
		<p><strong>The short version.</strong></p>
		<ul>
			<li>There is no account. We never ask for your name, email or a password.</li>
			<li>
				Your briefs are stored <strong>in your own browser</strong>. They are never uploaded to us and
				we have no copy.
			</li>
			<li>
				When you use an AI feature, the text of that brief is sent to Anthropic to produce the
				result — and nothing else is.
			</li>
			<li>Anthropic does not use it to train their models.</li>
			<li>There is no analytics, no advertising and no tracking of any kind.</li>
		</ul>
	</div>

	<p>
		Surveyvor is operated by <strong>Take a Luke Studio</strong>, Poland ("we", "us"). This policy
		explains what happens to information when you use it. It is written to be read, not to be
		survived.
	</p>

	<h2>What we process</h2>

	<h3>Your briefs — in your browser only</h3>
	<p>
		Everything you type into Surveyvor is saved to your browser's local storage on your own device.
		It is not sent to us, and we have no server that stores it. The practical consequence, which
		matters: <strong
			>if you clear your browser data, your briefs are permanently gone and we cannot recover them.</strong
		>
		Use Export to keep a copy of anything you care about.
	</p>

	<h3>AI processing</h3>
	<p>
		When you press an AI button — refine a section, get interviewed, run a survey, polish the final
		brief — the relevant text is transmitted to <strong>Anthropic PBC</strong> (United States), which
		generates the response and returns it to you. We do not store the request or the response.
	</p>
	<p>
		Anthropic states that by default it does not use inputs or outputs from its commercial API to
		train its models. See
		<a href="https://privacy.claude.com/" target="_blank" rel="noopener noreferrer"
			>Anthropic's privacy documentation</a
		>.
	</p>

	<h3>Technical data</h3>
	<ul>
		<li>
			<strong>IP address</strong> — used briefly to count requests so one person cannot run up the
			AI bill. Stored as a counter for roughly twenty minutes, then discarded.
		</li>
		<li>
			<strong>Token counts</strong> — how much AI work each request needed, so we can monitor cost. <strong
				>No brief content is ever logged.</strong
			>
		</li>
		<li><strong>Standard hosting logs</strong> — kept by our host in the normal way.</li>
	</ul>

	<h2>Who else is involved</h2>
	<p>These are the only third parties that touch anything:</p>
	<ul>
		<li>
			<strong>Anthropic PBC</strong> (US) — the AI that produces surveys and refinements. Receives
			brief text only when you ask for it.
		</li>
		<li><strong>Vercel Inc.</strong> (US) — hosting. Sees requests, not brief content.</li>
		<li>
			<strong>Upstash</strong> — rate-limiting counters. Receives a key derived from your IP and a
			number. Nothing else.
		</li>
	</ul>
	<p>
		These providers are based outside the EEA. Transfers rely on the European Commission's Standard
		Contractual Clauses and each provider's own safeguards.
	</p>

	<h2>Why we are allowed to do this</h2>
	<ul>
		<li>
			<strong>Performing the service you asked for</strong> — sending your text to the AI happens
			only because you pressed a button asking for it.
		</li>
		<li>
			<strong>Legitimate interest</strong> — counting requests by IP to prevent abuse and protect
			the service from being run up as a bill.
		</li>
	</ul>

	<h2>How long anything is kept</h2>
	<ul>
		<li><strong>Your briefs</strong> — until you delete them or clear your browser. By you, not us.</li>
		<li><strong>Rate-limit counters</strong> — about twenty minutes.</li>
		<li><strong>Hosting logs</strong> — per our host's standard retention.</li>
	</ul>

	<h2>If you paste other people's information</h2>
	<p>
		Surveyvor is a professional tool, so briefs often describe real organisations and sometimes real
		people. <strong
			>You decide what to paste, and you remain responsible for it.</strong
		> If a brief contains personal data about your client or their customers, you are the controller of
		that data and should be satisfied you have a basis for sending it to an AI provider.
	</p>
	<p>
		Surveyvor does not need names to work well. Describing roles — "the marketing director", "the
		regional team" — produces the same quality of survey and keeps personal data out of it entirely.
	</p>

	<h2>Your rights</h2>
	<p>
		Under the GDPR you have rights of access, rectification, erasure, restriction, objection and
		portability. Because we hold no account and no copy of your briefs, most of these are already in
		your hands:
	</p>
	<ul>
		<li><strong>Access and portability</strong> — Export writes any brief to a file you keep.</li>
		<li>
			<strong>Erasure</strong> — deleting a brief, or clearing your browser data, removes it
			completely. There is no server copy to ask us about.
		</li>
	</ul>
	<p>
		For anything else, email <a href="mailto:hello@takealuke.studio">hello@takealuke.studio</a>. You
		also have the right to complain to the Polish supervisory authority, the President of the
		Personal Data Protection Office (<em>Prezes Urzędu Ochrony Danych Osobowych</em>).
	</p>

	<h2>Cookies</h2>
	<p>
		One cookie, which records that you entered the beta password so you are not asked on every page.
		It contains no personal data. There are no analytics, advertising or tracking cookies, which is
		why this site has no cookie banner — there is nothing to consent to.
	</p>

	<h2>Changes</h2>
	<p>
		Surveyvor is in beta and changing. If this policy changes in a way that affects what happens to
		your information, the date at the top will change and material changes will be noted in the app.
	</p>
</LegalPage>

/**
 * Announces a release on Discord.
 *
 * Reads DISCORD_WEBHOOK_URL, RELEASE_KIND (full or ota), RELEASE_TITLE, RELEASE_URL and
 * RELEASE_NOTES from the environment.
 */

const TESTFLIGHT_URL = 'https://testflight.apple.com/join/etVSc7ZQ'

// Discord rejects an embed description over 4096 characters
const MAX_DESCRIPTION = 4096

const {
	DISCORD_WEBHOOK_URL,
	RELEASE_KIND = 'full',
	RELEASE_TITLE,
	RELEASE_URL,
	RELEASE_NOTES = '',
} = process.env

if (!DISCORD_WEBHOOK_URL || !RELEASE_TITLE || !RELEASE_URL) {
	console.error('❌ DISCORD_WEBHOOK_URL, RELEASE_TITLE and RELEASE_URL must be set')
	process.exit(1)
}

const isOta = RELEASE_KIND === 'ota'

const intro = isOta
	? '**An over-the-air update is on its way!** Open Jellify and it will download the update, then ask you to restart.'
	: '**A new version of Jellify has just been released!**'

const description = `${intro}\n\n${RELEASE_NOTES}`.trim()

const embed = {
	title: `Jellify ${RELEASE_TITLE} has been released`,
	url: RELEASE_URL,
	description:
		description.length > MAX_DESCRIPTION
			? `${description.slice(0, MAX_DESCRIPTION - 1)}…`
			: description,
	fields: isOta
		? [{ name: 'Release notes', value: RELEASE_URL }]
		: [{ name: 'Download', value: `TestFlight: ${TESTFLIGHT_URL}\nRelease: ${RELEASE_URL}` }],
	timestamp: new Date().toISOString(),
}

const res = await fetch(DISCORD_WEBHOOK_URL, {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({ embeds: [embed] }),
})

if (!res.ok) {
	console.error(`❌ Discord returned ${res.status}: ${await res.text()}`)
	process.exit(1)
}

console.log(`✅ Announced ${RELEASE_TITLE} on Discord`)

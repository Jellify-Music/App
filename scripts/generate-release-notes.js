import { readFileSync, writeFileSync } from 'fs'
import { OpenAI } from 'openai'

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,

	baseURL: 'https://ai.jellify.app/ollama/v1',
})

/**
 * Usage: bun scripts/generate-release-notes.js <release-title> <changes-file>
 *
 * The changes file is the release-changes.json written by collect-release-changes.js.
 * Set RELEASE_KIND=ota for an over-the-air update.
 */
async function main() {
	const version = process.argv[2]

	if (!version) {
		console.error('❌ Missing release title argument')
		process.exit(1)
	}

	const changesFile = process.argv[3]

	if (!changesFile) {
		console.error('❌ Missing changes file')
		process.exit(1)
	}

	const { pullRequests, issues, looseCommits } = JSON.parse(readFileSync(changesFile, 'utf8'))

	const changes = [
		...pullRequests.map((pull) => `- ${pull.title}`),
		...issues.map((issue) => `- Fixes issue: ${issue.title}`),
		...looseCommits.map((subject) => `- ${subject}`),
	].join('\n')

	if (!changes) {
		writeFileSync(
			'release_notes.txt',
			`Welcome to Jellify ${version}\n\nSmall fixes and improvements.`,
		)
		console.log('✅ No changes found, wrote placeholder release notes')
		return
	}

	const isOta = process.env.RELEASE_KIND === 'ota'

	const response = await openai.chat.completions.create({
		model: 'gemma4:12b',
		messages: [
			{
				role: 'system',
				content:
					'You are a friendly and bubbly React Native developer named Violet that is writing concise and friendly mobile app release notes from commit messages.',
			},
			{
				role: 'system',
				content:
					'You are writing release notes for a mobile app called Jellify. Jellify is a music player for Android and iOS that allows you to play music from your Jellyfin media server over the internet.',
			},
			{
				role: 'system',
				content:
					'Release notes should be concise and helpful to any user of the app - regardless of their technical knowledge. Highlight things that an average user would care about, but feel free to provide more technical details if they are interesting and relevant. Do not include any information that is not relevant to the user experience of the app.',
			},
			{
				role: 'system',
				content:
					'Release notes should be written in a way that is easy to understand and follow, and engaging and entertaining to read.',
			},
			{
				role: 'system',
				content:
					'Do not include emojis in the release notes. Do not include emojis at all.',
			},
			{
				role: 'system',
				content: `You should start every release summary with a singular headline - "Welcome to Jellify ${version}". Do not start with anything else.`,
			},
			{
				role: 'system',
				content:
					'After the headline, briefly summarize the release in 3-4 sentences. Then, include 3 bullet points that go into more detail about the changes in the release. Each bullet point should be 1-3 sentences long. Do not include more than 3 bullet points.',
			},
			...(isOta
				? [
						{
							role: 'system',
							content:
								'This release is an over-the-air update. It does not go through the App Store or Play Store: Jellify downloads it the next time it is opened, then asks to restart. Mention this briefly in the summary.',
						},
					]
				: []),
			{
				role: 'user',
				content: `Write a release summary for ${version} based on these changes:\n${changes}\n\nI'm a tech-savvy user of the app and I want to know what will be different in the app after I update.`,
			},
		],
	})

	const releaseNotes = response.choices[0].message.content.trim()
	writeFileSync('release_notes.txt', releaseNotes, 'utf8')
	console.log('✅ Release notes written to release_notes.txt')
}

main()

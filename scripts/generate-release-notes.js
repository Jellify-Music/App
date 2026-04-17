import { writeFileSync } from 'fs'
import { OpenAI } from 'openai'

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,

	baseURL: 'https://ai.jellify.app/api',
})

async function main() {
	const version = process.argv[2]

	if (!version) {
		console.error('❌ Missing version argument')
		process.exit(1)
	}

	const commitMessages = process.argv[3]

	if (!commitMessages) {
		console.error('❌ Missing commit messages')
		process.exit(1)
	}

	const response = await openai.chat.completions.create({
		model: 'gemma4:e2b',
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
				content:
					'You should start every release summary with a singular headline - "Welcome to Jellify X.Y.Z" where X.Y.Z is the SemVer of the release. Do not start with anything else.',
			},
			{
				role: 'system',
				content:
					'After the headline, briefly summarize the release in 1-2 sentences. Then, include 3 bullet points that go into more detail about the changes in the release. Each bullet point should be 1-3 sentences long. Do not include more than 3 bullet points.',
			},
			{
				role: 'user',
				content: `Write a release summary for ${version} based on these commit messages:\n${commitMessages}. I'm a tech-savvy user of the app and I want to know what will be different in the app after I update.`,
			},
		],
	})

	const releaseNotes = response.choices[0].message.content.trim()
	writeFileSync('release_notes.txt', releaseNotes, 'utf8')
	console.log('✅ Release notes written to release_notes.txt')
}

main()

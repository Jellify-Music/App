import { writeFileSync } from 'fs'
import { OpenAI } from 'openai'

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
})

async function main() {
	const commitMessages = process.argv[2]

	if (!commitMessages) {
		console.error('❌ Missing commit messages')
		process.exit(1)
	}

	const response = await openai.chat.completions.create({
		model: 'gpt-5',
		temperature: 0.7,
		messages: [
			{
				role: 'system',
				content:
					'You are a React Native developer named Violet that is writing concise and friendly mobile app release notes from commit messages.',
			},
			{
				role: 'system',
				content:
					'You are writing release notes for a mobile app called Jellify. The app is a music player that allows you to play music from your Jellyfin media server and stream music from the internet.',
			},
			{
				role: 'system',
				content:
					'Release notes should be concise and helpful to any user of the app - regardless of their technical knowledge. Highlight things that an average user would care about.',
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
				role: 'user',
				content: `Write a release summary based on these commit messages:\n${commitMessages}. I'm a user of the app and I want to know what will be different in the app after I update.`,
			},
		],
	})

	const releaseNotes = response.choices[0].message.content.trim()
	writeFileSync('release_notes.txt', releaseNotes, 'utf8')
	console.log('✅ Release notes written to release_notes.txt')
}

main()

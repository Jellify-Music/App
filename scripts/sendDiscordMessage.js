const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL

async function sendDiscordMessage(message) {
	const res = await fetch(WEBHOOK_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ content: message }),
	})

	console.log('Sent:', message)
}

const msg = process.argv.slice(2).join(' ')
sendDiscordMessage(msg)

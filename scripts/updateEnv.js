const fs = require('fs')
const path = require('path')

function parseArgs(args) {
	const updates = {}
	args.forEach((arg) => {
		const [key, value] = arg.split('=')
		if (key && value !== undefined) {
			updates[key.trim()] = value.trim()
		}
	})
	return updates
}

function updateEnvFile(filePath, updates) {
	let envContent = ''
	try {
		envContent = fs.readFileSync(filePath, 'utf8')
	} catch (err) {
		console.error(`❌ Failed to read .env file at ${filePath}`, err.message)
		return
	}

	const lines = envContent.split(/\r?\n/)
	const seenKeys = new Set()

	const updatedLines = lines.map((line) => {
		if (!line.trim() || line.trim().startsWith('#')) return line

		const [key, ...rest] = line.split('=')
		const trimmedKey = key.trim()

		if (Object.prototype.hasOwnProperty.call(updates, trimmedKey)) {
			seenKeys.add(trimmedKey)
			return `${trimmedKey}=${updates[trimmedKey]}`
		}

		return line
	})

	// Add any new keys not already in the file
	Object.entries(updates).forEach(([key, value]) => {
		if (!seenKeys.has(key)) {
			updatedLines.push(`${key}=${value}`)
		}
	})

	try {
		fs.writeFileSync(filePath, updatedLines.join('\n'), 'utf8')
		console.log('✅ .env file updated successfully')
	} catch (err) {
		console.error(`❌ Failed to write .env file:`, err.message)
	}
}

// Get CLI args (excluding node and script path)
const args = process.argv.slice(2)
if (args.length === 0) {
	console.error('❗ Usage: node updateEnv.js KEY1=value1 KEY2=value2')
	process.exit(1)
}

const updates = parseArgs(args)
const envPath = path.resolve(__dirname, '../.env')

updateEnvFile(envPath, updates)

/* eslint-disable @typescript-eslint/no-var-requires */
const { execSync, spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

// Read CLI arguments
const [, , serverAddress, username, password] = process.argv

if (!serverAddress || !username || !password) {
	console.error('Usage: node runMaestroChunked.js <server_address> <username> <password>')
	process.exit(1)
}

const MAX_CHUNK_MINUTES = 3
const MAX_CHUNK_MS = MAX_CHUNK_MINUTES * 60 * 1000
let isRunning = true
let chunkIndex = 1
const chunkNames = []

const sleep = (ms) => new Promise((res) => setTimeout(res, ms))

async function recordChunk() {
	while (isRunning) {
		const chunkName = `/sdcard/screen_chunk_${chunkIndex}.mp4`
		console.log(`🎥 Starting chunk ${chunkIndex}...`)
		chunkNames.push(chunkName)

		const proc = spawn('adb', ['shell', 'screenrecord', chunkName])
		await sleep(MAX_CHUNK_MS)
		proc.kill('SIGINT')
		console.log(`🛑 Stopped chunk ${chunkIndex}`)
		chunkIndex++
		await sleep(3000)
	}
}

async function pullAndMergeChunks() {
	const outputDir = './recordings'
	fs.mkdirSync(outputDir, { recursive: true })

	const listPath = path.join(outputDir, 'filelist.txt')
	const listFile = fs.createWriteStream(listPath)

	console.log(`📥 Pulling ${chunkNames.length} chunks...`)

	for (let i = 0; i < chunkNames.length; i++) {
		const remote = chunkNames[i]
		const local = path.join(outputDir, `chunk_${i + 1}.mp4`)
		try {
			execSync(`adb pull ${remote} "${local}"`, { stdio: 'inherit' })
			execSync(`adb shell rm "${remote}"`)
			listFile.write(`file '${local.replace(/\\/g, '/')}'\n`)
		} catch (err) {
			console.error(`❌ Failed to pull ${remote}:`, err.message)
		}
	}
	listFile.end()

	console.log('🎞️ Merging chunks into video.mp4...')
	try {
		execSync(`ffmpeg -f concat -safe 0 -i ${listPath} -c copy video.mp4`, {
			stdio: 'inherit',
		})
		console.log('✅ Merged into video.mp4')
	} catch (err) {
		console.error('❌ Failed to merge video:', err.message)
	}
}

;(async () => {
	try {
		console.log('📱 Installing APK...')
		execSync('adb install ./artifacts/app-x86-release.apk', { stdio: 'inherit' })

		console.log('🚀 Launching app...')
		execSync(`adb shell monkey -p com.jellify 1`, { stdio: 'inherit' })

		console.log('📽️ Starting screen recording...')
		recordChunk() // runs in background

		console.log('🧪 Running Maestro tests...')
		const MAESTRO_PATH = path.join(process.env.HOME, '.maestro', 'bin', 'maestro')
		const FLOW_PATH = './maestro-tests/flow.yaml'

		const command = `${MAESTRO_PATH} test ${FLOW_PATH} \
      --env server_address=${serverAddress} \
      --env username=${username} \
      --env password=${password}`

		execSync(command, { stdio: 'inherit' })

		console.log('✅ Maestro test completed')
		isRunning = false
		await sleep(5000)

		await pullAndMergeChunks()
		process.exit(0)
	} catch (error) {
		isRunning = false
		await sleep(5000)
		await pullAndMergeChunks()
		console.error(`❌ Error: ${error.message}`)
		process.exit(1)
	}
})()

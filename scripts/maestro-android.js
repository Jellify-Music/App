/* eslint-disable @typescript-eslint/no-var-requires */
const { execSync, spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

const [, , serverAddress, username, password] = process.argv

if (!serverAddress || !username || !password) {
	console.error('Usage: node runMaestro.js <server_address> <username> <password>')
	process.exit(1)
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

async function startMultiScreenRecording() {
	console.log('🎥 Starting chained screen recording...')
	const recordCommand = `
		screenrecord /sdcard/test1.mp4;
		screenrecord /sdcard/test2.mp4;
		screenrecord /sdcard/test3.mp4;
	`
	const proc = spawn('adb', ['shell', recordCommand], { shell: true, detached: true })
	return proc
}

function pullAndMerge() {
	const outputDir = './recordings'
	fs.mkdirSync(outputDir, { recursive: true })

	const chunks = ['test1.mp4', 'test2.mp4', 'test3.mp4']
	const listFilePath = path.join(outputDir, 'filelist.txt')
	let listContent = ''

	chunks.forEach((name, i) => {
		const local = path.join(outputDir, `chunk_${i + 1}.mp4`)
		try {
			console.log(`📥 Pulling ${name}...`)
			execSync(`adb pull /sdcard/${name} ${local}`, { stdio: 'inherit' })
			execSync(`adb shell rm /sdcard/${name}`)
			listContent += `file 'chunk_${i + 1}.mp4'\n`
		} catch (err) {
			console.error(`❌ Error pulling ${name}:`, err.message)
		}
	})

	fs.writeFileSync(listFilePath, listContent)
	console.log('🎞️ Merging chunks using ffmpeg...')

	try {
		execSync(`ffmpeg -f concat -safe 0 -i filelist.txt -c copy ../video.mp4`, {
			cwd: outputDir,
			stdio: 'inherit',
		})
		console.log('✅ Merged into video.mp4')
	} catch (err) {
		console.error('❌ FFmpeg merge failed:', err.message)
	}
}

;(async () => {
	try {
		console.log('📱 Installing APK...')
		execSync('adb install ./artifacts/app-x86-release.apk', { stdio: 'inherit' })

		console.log('🚀 Launching app...')
		execSync(`adb shell monkey -p com.jellify 1`, { stdio: 'inherit' })

		const recording = await startMultiScreenRecording()

		console.log('🧪 Running Maestro tests...')
		const MAESTRO_PATH = path.join(process.env.HOME, '.maestro', 'bin', 'maestro')
		const FLOW_PATH = './maestro-tests/flow.yaml'

		const command = `${MAESTRO_PATH} test ${FLOW_PATH} \
      --env server_address=${serverAddress} \
      --env username=${username} \
      --env password=${password}`

		execSync(command, { stdio: 'inherit' })
		console.log('✅ Maestro test completed')

		console.log('⏳ Waiting for recordings to finish...')
		await sleep(3 * 3 * 60 * 1000 + 5000) // 3 recordings * 3 mins each + buffer

		pullAndMerge()
		process.exit(0)
	} catch (err) {
		console.error('❌ Error:', err.message)
		process.exit(1)
	}
})()

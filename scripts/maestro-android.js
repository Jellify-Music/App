/* eslint-disable @typescript-eslint/no-var-requires */
const { execSync, spawn } = require('child_process')
const path = require('path')

// Read arguments from CLI
const [, , serverAddress, username, password] = process.argv

if (!serverAddress || !username || !password) {
	console.error('Usage: node runMaestro.js <server_address> <username> <password>')
	process.exit(1)
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

let adbStream, ffmpegProcess

async function stopRecording() {
	try {
		console.log('🛑 Stopping recording...')
		if (adbStream) adbStream.kill('SIGINT')
		if (ffmpegProcess) ffmpegProcess.kill('SIGINT')
		console.log('✅ Recording saved as video.mp4')
	} catch (err) {
		console.error('❌ Failed to stop recording:', err.message)
	}
}

;(async () => {
	try {
		console.log('📱 Installing APK...')
		execSync('adb install ./artifacts/app-x86-release.apk', {
			stdio: 'inherit',
			env: process.env,
		})

		console.log('🚀 Launching app...')
		execSync(`adb shell monkey -p com.jellify 1`, { stdio: 'inherit' })

		// ✅ Start screen recording via adb exec-out and FFmpeg
		console.log('🎥 Starting screen recording...')
		adbStream = spawn('adb', ['exec-out', 'screenrecord', '--output-format=h264', '-'])

		// ⚠️ Change resolution if needed
		const resolution = '720x1280'
		ffmpegProcess = spawn(
			'ffmpeg',
			[
				'-y',
				'-f',
				'h264',
				'-i',
				'pipe:0',
				'-c:v',
				'libx264',
				'-preset',
				'ultrafast',
				'video.mp4',
			],
			{ stdio: ['pipe', process.stdout, process.stderr] },
		)

		adbStream.stdout.pipe(ffmpegProcess.stdin)

		// Run Maestro tests
		console.log('🧪 Running Maestro tests...')
		const MAESTRO_PATH = path.join(process.env.HOME, '.maestro', 'bin', 'maestro')
		const FLOW_PATH = './maestro-tests/flow.yaml'

		const command = `${MAESTRO_PATH} test ${FLOW_PATH} \
      --env server_address=${serverAddress} \
      --env username=${username} \
      --env password=${password}`

		execSync(command, { stdio: 'inherit', env: process.env })

		console.log('✅ Maestro test completed')
		await stopRecording()
		process.exit(0)
	} catch (error) {
		await stopRecording()
		console.error(`❌ Error: ${error.message}`)
		process.exit(1)
	}
})()

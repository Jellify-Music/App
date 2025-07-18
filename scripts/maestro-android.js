/* eslint-disable @typescript-eslint/no-var-requires */
const { execSync, exec, spawn } = require('child_process')
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

async function 	stopRecording(recording,ffmpeg) {
	try {
		// Kill the adb screenrecord process
		recording.kill('SIGINT')
		ffmpeg.stdin.end();
		await sleep(3000)
	} catch (err) {
		console.error('❌ Failed to stop or pull recording:', err.message)
	}
}

;(async () => {
	execSync('adb install ./artifacts/app-x86-release.apk', { stdio: 'inherit', env: process.env })
	execSync(`adb shell monkey -p com.jellify 1`, { stdio: 'inherit' })

	
		const recording = spawn('adb', [
			'exec-out',
			'screenrecord',
			'--output-format=h264',
			'--bit-rate', '12000000', // 12 Mbps
			'--size', '720x1280',
			'-'
		]);
		
		const ffmpeg = spawn(
			'ffmpeg',
			['-i', '-', 'screencast.mp4'],
			{ stdio: ['pipe', 'inherit', 'inherit'] }
		);
		
		recording.stdout.pipe(ffmpeg.stdin);
	  

	try {
		const MAESTRO_PATH = path.join(process.env.HOME, '.maestro', 'bin', 'maestro')
		const FLOW_PATH = './maestro-tests/flow.yaml'

		const command = `${MAESTRO_PATH} test ${FLOW_PATH} \
      --env server_address=${serverAddress} \
      --env username=${username} \
      --env password=${password}`

		const output = execSync(command, { stdio: 'inherit', env: process.env })
		console.log('✅ Maestro test completed')
		console.log(output)
		await stopRecording(recording,ffmpeg)
		process.exit(0)
	} catch (error) {
		await stopRecording(recording,ffmpeg)
		execSync('pwd', { stdio: 'inherit' })
		console.error(`❌ Error: ${error.message}`)
		process.exit(1)
	}
})()
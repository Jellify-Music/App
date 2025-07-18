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

async function stopRecording(adbProcess, ffmpegProcess) {
	try {
		// Kill the adb screenrecord process
		if (adbProcess && adbProcess.pid) {
			process.kill(adbProcess.pid, 'SIGINT')
		}
		// Kill the ffmpeg process
		if (ffmpegProcess && ffmpegProcess.pid) {
			process.kill(ffmpegProcess.pid, 'SIGINT')
		}
	} catch (err) {
		console.error('❌ Failed to stop recording:', err.message)
	}
}

;(async () => {
	execSync('adb install ./artifacts/app-x86-release.apk', { stdio: 'inherit', env: process.env })
	execSync(`adb shell monkey -p com.jellify 1`, { stdio: 'inherit' })

	const adbProcess = spawn('adb', ['exec-out','"while true; do screenrecord --output-format=h264 --bit-rate 12m --size 720x1280 -; done"'], { windowsVerbatimArguments: true });

	const ffmpegProcess = spawn('ffmpeg', [
        '-i', 'pipe:0',           // Input from pipe
        '-f', 'mp4',              // MP4 format
        '-movflags', 'frag_keyframe+empty_moov+faststart',
        '-r:v', '60/1',           // Removed quotes
        '-c:v', 'libx264',        // Video codec
        '-preset', 'ultrafast',   // Encoding speed
        '-tune', 'zerolatency',   // Low latency
        '-maxrate', '12M',        // Max bitrate
        '-bufsize', '512K',       // Buffer size
        '-an',                    // No audio
        '-g','30',
        '-y',                     // Overwrite output file
        'video.mp4'               // Output to file instead of pipe:1
    ], { windowsVerbatimArguments: true });

	// Pipe adb output to ffmpeg input
	adbProcess.stdout.pipe(ffmpegProcess.stdin);

	// Handle process errors
	adbProcess.on('error', (err) => {
		console.error('ADB process error:', err);
	});

	ffmpegProcess.on('error', (err) => {
		console.error('FFmpeg process error:', err);
	});

	ffmpegProcess.on('close', (code) => {
		console.log(`FFmpeg process exited with code ${code}`);
		console.log('✅ Video saved as video.mp4');
	});

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
		await stopRecording(adbProcess, ffmpegProcess)
		process.exit(0)
	} catch (error) {
		await stopRecording(adbProcess, ffmpegProcess)
		execSync('pwd', { stdio: 'inherit' })
		console.error(`❌ Error: ${error.message}`)
		process.exit(1)
	}
})()
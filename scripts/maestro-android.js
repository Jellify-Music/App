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
		console.log('🛑 Stopping recording processes...')
		
		// Gracefully close ffmpeg first
		if (ffmpegProcess && ffmpegProcess.stdin && !ffmpegProcess.stdin.destroyed) {
			ffmpegProcess.stdin.end()
		}
		
		// Then stop adb
		if (adbProcess && adbProcess.pid) {
			console.log('Stopping ADB process...')
			process.kill(adbProcess.pid, 'SIGTERM')
		}
		
		// Wait a bit for graceful shutdown
		await sleep(2000)
		
		// Force kill if still running
		if (ffmpegProcess && ffmpegProcess.pid) {
			try {
				process.kill(ffmpegProcess.pid, 'SIGTERM')
			} catch (e) {
				console.log('FFmpeg process already stopped')
			}
		}
		
	} catch (err) {
		console.error('❌ Failed to stop recording:', err.message)
	}
}

;(async () => {
	execSync('adb install ./artifacts/app-x86-release.apk', { stdio: 'inherit', env: process.env })
	execSync(`adb shell monkey -p com.jellify 1`, { stdio: 'inherit' })

	console.log('🎬 Starting screen recording...')

	const adbProcess = spawn('adb', [
		'exec-out',
		'while true; do screenrecord --output-format=h264 --bit-rate 12m --size 720x1280 -; done'
	], { 
		windowsVerbatimArguments: true,
		stdio: ['ignore', 'pipe', 'pipe']
	});

	const ffmpegProcess = spawn('ffmpeg', [
        '-i', 'pipe:0',
        '-f', 'mp4',
        '-movflags', 'frag_keyframe+empty_moov+faststart',
        '-r:v', '60/1',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-tune', 'zerolatency',
        '-maxrate', '12M',
        '-bufsize', '512K',
        '-an',
        '-g', '30',
        '-y',
        'video.mp4'
    ], { 
		windowsVerbatimArguments: true,
		stdio: ['pipe', 'pipe', 'pipe']
	});

	// Pipe adb output to ffmpeg input
	adbProcess.stdout.pipe(ffmpegProcess.stdin);

	// Debug logging
	adbProcess.stderr.on('data', (data) => {
		console.log('ADB stderr:', data.toString());
	});

	ffmpegProcess.stderr.on('data', (data) => {
		console.log('FFmpeg stderr:', data.toString());
	});

	ffmpegProcess.stdout.on('data', (data) => {
		console.log('FFmpeg stdout:', data.toString());
	});

	// Handle process events
	adbProcess.on('error', (err) => {
		console.error('❌ ADB process error:', err);
	});

	adbProcess.on('close', (code, signal) => {
		console.log(`📱 ADB process exited with code ${code}, signal: ${signal}`);
	});

	ffmpegProcess.on('error', (err) => {
		console.error('❌ FFmpeg process error:', err);
	});

	ffmpegProcess.on('close', (code, signal) => {
		console.log(`🎥 FFmpeg process exited with code ${code}, signal: ${signal}`);
		if (code === 0) {
			console.log('✅ Video saved as video.mp4');
		}
	});

	// Give processes time to start
	await sleep(3000);
	console.log('✅ Recording started, running Maestro test...')

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
		
	} catch (error) {
		console.error(`❌ Maestro Error: ${error.message}`)
	} finally {
		await stopRecording(adbProcess, ffmpegProcess)
		// Wait for processes to finish
		await sleep(3000)
		process.exit(0)
	}
})()
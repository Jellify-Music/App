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

async function stopRecording(adbProcess, ffplayProcess) {
	try {
		console.log('🛑 Stopping recording processes...')
		
		// Stop adb first
		if (adbProcess && adbProcess.pid) {
			console.log('Stopping ADB process...')
			process.kill(adbProcess.pid, 'SIGTERM')
		}
		
		// Then stop ffplay
		if (ffplayProcess && ffplayProcess.pid) {
			console.log('Stopping FFplay process...')
			process.kill(ffplayProcess.pid, 'SIGTERM')
		}
		
		// Wait a bit for graceful shutdown
		await sleep(2000)
		
	} catch (err) {
		console.error('❌ Failed to stop recording:', err.message)
	}
}

;(async () => {
	execSync('adb install ./artifacts/app-x86-release.apk', { stdio: 'inherit', env: process.env })
	execSync(`adb shell monkey -p com.jellify 1`, { stdio: 'inherit' })

	console.log('🎬 Starting screen recording with ffplay...')

	const adbProcess = spawn('adb', [
		'shell',
		'while true; do screenrecord --bit-rate=16m --output-format=h264 --size 540x960 - ; done'
	], { 
		windowsVerbatimArguments: true,
		stdio: ['ignore', 'pipe', 'pipe']
	});

	const ffplayProcess = spawn('ffplay', [
        '-framerate', '60',
        '-framedrop',
        '-bufsize', '16M',
        '-'
    ], { 
		windowsVerbatimArguments: true,
		stdio: ['pipe', 'pipe', 'pipe']
	});

	// Pipe adb output to ffplay input
	adbProcess.stdout.pipe(ffplayProcess.stdin);

	// Debug logging
	adbProcess.stderr.on('data', (data) => {
		console.log('ADB stderr:', data.toString());
	});

	ffplayProcess.stderr.on('data', (data) => {
		console.log('FFplay stderr:', data.toString());
	});

	ffplayProcess.stdout.on('data', (data) => {
		console.log('FFplay stdout:', data.toString());
	});

	// Handle process events
	adbProcess.on('error', (err) => {
		console.error('❌ ADB process error:', err);
	});

	adbProcess.on('close', (code, signal) => {
		console.log(`📱 ADB process exited with code ${code}, signal: ${signal}`);
	});

	ffplayProcess.on('error', (err) => {
		console.error('❌ FFplay process error:', err);
	});

	ffplayProcess.on('close', (code, signal) => {
		console.log(`🎥 FFplay process exited with code ${code}, signal: ${signal}`);
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
		await stopRecording(adbProcess, ffplayProcess)
		// Wait for processes to finish
		await sleep(3000)
		process.exit(0)
	}
})()
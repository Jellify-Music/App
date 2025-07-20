/* eslint-disable @typescript-eslint/no-var-requires */
const { execSync, exec, spawn } = require('child_process')
const path = require('path')

// Read arguments from CLI
const [, , serverAddress, username] = process.argv

if (!serverAddress || !username) {
	console.error('Usage: node runMaestro.js <server_address> <username>')
	process.exit(1)
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

async function stopRecording(pid) {
	try {
		// Kill the adb screenrecord process
		process.kill(pid, 'SIGINT')

		// Wait 3 seconds for file to finalize
		await sleep(3000)

		// Pull the recorded file
		execSync('adb pull /sdcard/screen.mp4 video.mp4', { stdio: 'inherit' })

		// Optionally delete the file on device
		execSync('adb shell rm /sdcard/screen.mp4')

		console.log('✅ Recording pulled and cleaned up')
	} catch (err) {
		console.error('❌ Failed to stop or pull recording:', err.message)
	}
}

;(async () => {
	execSync('adb install ./artifacts/app-universal-release.apk', {
		stdio: 'inherit',
		env: process.env,
	})
	execSync(`adb shell monkey -p com.jellify 1`, { stdio: 'inherit' })

	const recording = spawn(
		'adb',
		['shell', 'screenrecord', '--time-limit=1800', '/sdcard/screen.mp4'],
		{
			stdio: 'ignore',
			detached: true,
		},
	)
	const pid = recording.pid

	try {
		const MAESTRO_PATH = path.join(process.env.HOME, '.maestro', 'bin', 'maestro')
		const FLOW_PATH = './maestro-tests/flow.yaml'

		const command = `${MAESTRO_PATH} test ${FLOW_PATH} \
      --env server_address=${serverAddress} \
      --env username=${username}`

		const output = execSync(command, { stdio: 'inherit', env: process.env })
		console.log('✅ Maestro test completed')
		console.log(output)
		await stopRecording(pid)
		process.exit(0)
	} catch (error) {
		await stopRecording(pid)
		execSync('pwd', { stdio: 'inherit' })
		console.error(`❌ Error: ${error.message}`)
		process.exit(1)
	}
})()

const { execSync, spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

// Read arguments from CLI
const [, , serverAddress, username] = process.argv

if (!serverAddress || !username) {
	console.error('Usage: node maestro-android.js <server_address> <username>')
	process.exit(1)
}

// Use the orchestrated flow file instead of individual tests
// flow-full.yaml clears state and runs all tests in the correct order
const FLOW_FILE = './maestro/flow-full.yaml'

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

async function stopRecording(pid, videoName, deviceVideoPath) {
	try {
		// Kill the adb screenrecord process
		process.kill(pid, 'SIGINT')

		// Wait 3 seconds for file to finalize
		await sleep(3000)

		// Pull the recorded file with custom name
		execSync(`adb pull ${deviceVideoPath} ${videoName}`, { stdio: 'inherit' })

		// Optionally delete the file on device
		execSync(`adb shell rm ${deviceVideoPath}`)

		console.log(`✅ Recording pulled and saved as ${videoName}`)
	} catch (err) {
		console.error('❌ Failed to stop or pull recording:', err.message)
	}
}

async function runFullFlow(serverAddress, username) {
	const videoName = 'maestro_full_test.mp4'
	const deviceVideoPath = '/sdcard/maestro_full_test.mp4'

	console.log(`\n🚀 Running full Maestro test flow: ${FLOW_FILE}`)
	console.log(`📹 Video will be saved as: ${videoName}`)
	console.log(`🔗 Server: ${serverAddress}`)
	console.log(`👤 Username: ${username}`)

	// Start screen recording
	const recording = spawn(
		'adb',
		['shell', 'screenrecord', '--time-limit=1800', deviceVideoPath],
		{
			stdio: 'ignore',
			detached: true,
		},
	)
	const pid = recording.pid

	try {
		const MAESTRO_PATH = process.env.HOME + '/.maestro/bin/maestro'

		const command = `${MAESTRO_PATH} test ${FLOW_FILE} \
      --env server_address=${serverAddress} \
      --env username=${username}`

		console.log(`\n🎭 Executing: maestro test ${FLOW_FILE}`)

		execSync(command, { stdio: 'inherit', env: process.env })

		console.log('✅ Full test flow completed successfully!')
		await stopRecording(pid, videoName, deviceVideoPath)
		return { success: true }
	} catch (error) {
		console.error('❌ Test flow failed:', error.message)
		await stopRecording(pid, videoName, deviceVideoPath)
		return { success: false, error: error.message }
	}
}

;(async () => {
	console.log('📱 Installing app...')
	execSync('adb install ./artifacts/app-universal-release.apk', {
		stdio: 'inherit',
		env: process.env,
	})

	console.log('🚀 Launching app...')
	execSync(`adb shell monkey -p com.cosmonautical.jellify 1`, { stdio: 'inherit' })

	// Wait for app to launch
	await sleep(3000)

	const result = await runFullFlow(serverAddress, username)

	// Collect screenshots
	const screenshotDir = './.maestro/screenshots'
	const screenshotOutputDir = './screenshots-output'

	if (fs.existsSync(screenshotDir)) {
		console.log('\n📸 Collecting screenshots...')
		try {
			if (!fs.existsSync(screenshotOutputDir)) {
				fs.mkdirSync(screenshotOutputDir, { recursive: true })
			}

			const screenshots = fs.readdirSync(screenshotDir)
			screenshots.forEach((file) => {
				const srcPath = path.join(screenshotDir, file)
				const destPath = path.join(screenshotOutputDir, file)
				fs.copyFileSync(srcPath, destPath)
				console.log(`  📷 ${file}`)
			})

			console.log(`✅ Collected ${screenshots.length} screenshots to ${screenshotOutputDir}`)
		} catch (err) {
			console.error('❌ Failed to collect screenshots:', err.message)
		}
	} else {
		console.log('\n📸 No screenshots directory found at .maestro/screenshots')
	}

	// Also collect from project screenshots folder
	const projectScreenshots = './screenshots'
	if (fs.existsSync(projectScreenshots)) {
		console.log('\n📸 Collecting project screenshots...')
		try {
			if (!fs.existsSync(screenshotOutputDir)) {
				fs.mkdirSync(screenshotOutputDir, { recursive: true })
			}

			const screenshots = fs.readdirSync(projectScreenshots).filter((f) => f.endsWith('.png'))
			screenshots.forEach((file) => {
				const srcPath = path.join(projectScreenshots, file)
				const destPath = path.join(screenshotOutputDir, file)
				fs.copyFileSync(srcPath, destPath)
				console.log(`  📷 ${file}`)
			})

			console.log(`✅ Collected ${screenshots.length} screenshots from project folder`)
		} catch (err) {
			console.error('❌ Failed to collect screenshots:', err.message)
		}
	}

	if (result.success) {
		console.log('\n🎉 All tests passed!')
		process.exit(0)
	} else {
		console.log('\n⚠️  Tests failed. Check the video for details.')
		process.exit(1)
	}
})()

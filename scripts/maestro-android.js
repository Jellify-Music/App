/* eslint-disable @typescript-eslint/no-var-requires */
const { execSync, exec, spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

// Read arguments from CLI
const [, , serverAddress, username] = process.argv

if (!serverAddress || !username) {
	console.error('Usage: node runMaestro.js <server_address> <username>')
	process.exit(1)
}

// Function to recursively find all YAML files in maestro-tests directory
function findYamlFiles(dir) {
	const files = []

	function scanDirectory(currentDir) {
		const items = fs.readdirSync(currentDir)

		for (const item of items) {
			const fullPath = path.join(currentDir, item)
			const stat = fs.statSync(fullPath)

			if (stat.isDirectory()) {
				scanDirectory(fullPath)
			} else if (item.endsWith('.yaml') || item.endsWith('.yml')) {
				files.push(fullPath)
			}
		}
	}

	scanDirectory(dir)
	return files.sort() // Sort for consistent ordering
}

// Get all YAML files from maestro-tests directory
const MAESTRO_TESTS_DIR = './maestro-tests/flows'
const FLOW_FILES = findYamlFiles(MAESTRO_TESTS_DIR)

console.log(`🔍 Found ${FLOW_FILES.length} YAML test files:`)
FLOW_FILES.forEach((file, index) => {
	console.log(`  ${index + 1}. ${file}`)
})

if (FLOW_FILES.length === 0) {
	console.error('❌ No YAML test files found in maestro-tests directory')
	process.exit(1)
}

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

async function runSingleTest(flowPath, serverAddress, username, testIndex) {
	const flowName = path.basename(flowPath, '.yaml')
	const relativePath = path.relative(MAESTRO_TESTS_DIR, flowPath)
	const videoName = `test_${testIndex}_${flowName}.mp4`
	const deviceVideoPath = `/sdcard/screen_${testIndex}_${flowName}.mp4`

	console.log(`\n🚀 Starting test ${testIndex + 1}/${FLOW_FILES.length}: ${relativePath}`)
	console.log(`📹 Video will be saved as: ${videoName}`)

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
		const MAESTRO_PATH = path.join(process.env.HOME, '.maestro', 'bin', 'maestro')

		const command = `${MAESTRO_PATH} test ${flowPath} \
      --env server_address=${serverAddress} \
      --env username=${username}`

		const output = execSync(command, { stdio: 'inherit', env: process.env })
		console.log(`✅ Test ${testIndex + 1} (${relativePath}) completed successfully`)

		await stopRecording(pid, videoName, deviceVideoPath)
		return { success: true, flowName, relativePath, videoName }
	} catch (error) {
		await stopRecording(pid, videoName, deviceVideoPath)
		console.error(`❌ Test ${testIndex + 1} (${relativePath}) failed: ${error.message}`)
		return { success: false, flowName, relativePath, videoName, error: error.message }
	}
}

;(async () => {
	console.log('📱 Installing app...')
	execSync('adb install ./artifacts/app-universal-release.apk', {
		stdio: 'inherit',
		env: process.env,
	})

	console.log('🚀 Launching app...')
	execSync(`adb shell monkey -p com.jellify 1`, { stdio: 'inherit' })

	// Wait a bit for app to launch
	await sleep(2000)

	const results = []

	console.log(`\n🔄 Starting test suite with ${FLOW_FILES.length} tests...`)

	for (let i = 0; i < FLOW_FILES.length; i++) {
		const flowPath = FLOW_FILES[i]

		// Check if flow file exists
		if (!fs.existsSync(flowPath)) {
			console.log(`⚠️  Skipping ${flowPath} - file not found`)
			continue
		}

		const result = await runSingleTest(flowPath, serverAddress, username, i)
		results.push(result)

		// Wait between tests to ensure clean state
		if (i < FLOW_FILES.length - 1) {
			console.log('⏳ Waiting 3 seconds before next test...')
			await sleep(3000)
		}
	}

	// Print summary
	console.log('\n📊 Test Results Summary:')
	console.log('========================')

	let passed = 0
	let failed = 0

	results.forEach((result, index) => {
		const status = result.success ? '✅ PASS' : '❌ FAIL'
		console.log(`${index + 1}. ${result.relativePath}: ${status}`)
		if (result.success) {
			passed++
		} else {
			failed++
			console.log(`   Error: ${result.error}`)
		}
		console.log(`   Video: ${result.videoName}`)
	})

	console.log(`\n📈 Final Results: ${passed} passed, ${failed} failed`)

	if (failed === 0) {
		console.log('🎉 All tests passed!')
		process.exit(0)
	} else {
		console.log('⚠️  Some tests failed. Check the videos for details.')
		process.exit(1)
	}
})()

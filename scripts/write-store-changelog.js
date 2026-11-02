import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'

/**
 * Writes the store release notes to the fastlane changelog for the current Android versionCode.
 *
 * Usage: STORE_NOTES="..." bun scripts/write-store-changelog.js
 *
 * The same file feeds both stores: fastlane's gplay lane uploads it to Google Play, and
 * F-Droid reads it from the release tag, so it has to be committed before tagging.
 */

const root = join(import.meta.dirname, '..')
const notes = (process.env.STORE_NOTES ?? '').trim()

if (!notes) {
	console.warn('⚠️ STORE_NOTES is empty, leaving the changelog alone')
	process.exit(0)
}

const gradle = readFileSync(join(root, 'android/app/build.gradle'), 'utf8')
const versionCode = gradle.match(/^\s*versionCode\s+(\d+)/m)?.[1]

if (!versionCode) {
	console.error('❌ Could not find versionCode in android/app/build.gradle')
	process.exit(1)
}

const changelog = join(
	root,
	`android/fastlane/metadata/android/en-US/changelogs/${versionCode}.txt`,
)
mkdirSync(dirname(changelog), { recursive: true })
writeFileSync(changelog, `${notes}\n`, 'utf8')

console.log(`✅ Wrote ${notes.length} characters to ${changelog}`)

// Let later workflow steps find the file without re-deriving the versionCode
if (process.env.GITHUB_OUTPUT) {
	writeFileSync(process.env.GITHUB_OUTPUT, `changelog=${changelog}\n`, { flag: 'a' })
}

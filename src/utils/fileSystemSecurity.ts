import RNFS from 'react-native-fs'

/**
 * Manages secure file system access for iOS Files app integration
 * Ensures only music files are accessible to users while keeping app data private
 */

export const PUBLIC_MUSIC_DIR = `${RNFS.DocumentDirectoryPath}/Music`
export const PRIVATE_APP_DATA_DIR = `${RNFS.DocumentDirectoryPath}/.app_data`

/**
 * Initialize secure file system structure
 * - Creates public Music directory for user-accessible files
 * - Moves sensitive app data to hidden directory
 */
export async function initializeSecureFileSystem(): Promise<void> {
	try {
		// Create public music directory
		await RNFS.mkdir(PUBLIC_MUSIC_DIR)

		// Create private app data directory (hidden from Files app)
		await RNFS.mkdir(PRIVATE_APP_DATA_DIR)

		// Create documentation file
		await createJellifyIgnoreFile()

		// Hide sensitive directories by prefixing with dot
		await hideSensitiveDirectories()

		console.log('Secure file system initialized')
	} catch (error) {
		console.error('Failed to initialize secure file system:', error)
	}
}

/**
 * Hide sensitive app data directories from iOS Files app
 * Directories starting with dot (.) are typically hidden from file browsers
 */
async function hideSensitiveDirectories(): Promise<void> {
	const sensitivePatterns = ['mmkv', 'git_hot_update', 'RCTAsyncLocalStorage', 'flipper', 'tmp']

	try {
		const documentsContents = await RNFS.readDir(RNFS.DocumentDirectoryPath)

		for (const item of documentsContents) {
			const shouldHide = sensitivePatterns.some((pattern) =>
				item.name.toLowerCase().includes(pattern.toLowerCase()),
			)

			if (shouldHide && !item.name.startsWith('.') && item.name !== 'Music') {
				const oldPath = item.path
				const newPath = `${RNFS.DocumentDirectoryPath}/.${item.name}`

				try {
					await RNFS.moveFile(oldPath, newPath)
					console.log(`Moved sensitive directory: ${item.name} -> .${item.name}`)
				} catch (moveError) {
					console.warn(`Could not move ${item.name}:`, moveError)
				}
			}
		}
	} catch (error) {
		console.warn('Could not hide sensitive directories:', error)
	}
}

/**
 * Get the secure path for downloading music files
 */
export function getSecureMusicDownloadPath(fileName: string): string {
	return `${PUBLIC_MUSIC_DIR}/${fileName}`
}

/**
 * Clean up old music files if needed (for cache management)
 */
export async function cleanupOldMusicFiles(maxFiles: number = 100): Promise<void> {
	try {
		const musicFiles = await RNFS.readDir(PUBLIC_MUSIC_DIR)

		if (musicFiles.length > maxFiles) {
			// Sort by modification time, oldest first
			const sortedFiles = musicFiles
				.filter((file) => file.isFile())
				.sort((a, b) => {
					const aTime = a.mtime ? new Date(a.mtime).getTime() : 0
					const bTime = b.mtime ? new Date(b.mtime).getTime() : 0
					return aTime - bTime
				})

			const filesToDelete = sortedFiles.slice(0, sortedFiles.length - maxFiles)

			for (const file of filesToDelete) {
				await RNFS.unlink(file.path)
				console.log(`Cleaned up old music file: ${file.name}`)
			}
		}
	} catch (error) {
		console.error('Failed to cleanup old music files:', error)
	}
}

/**
 * Create a .jellifyignore file to document which directories should remain private
 * This helps with manual cleanup and debugging
 */
export async function createJellifyIgnoreFile(): Promise<void> {
	const jellifyIgnoreContent = `# Jellify Private Directories
# These directories contain sensitive app data and should not be exposed to iOS Files app

# MMKV storage (contains user data, tokens, etc.)
mmkv*/
.mmkv*/

# React Native hot updates
git_hot_update*/
.git_hot_update*/

# React Native AsyncStorage
RCTAsyncLocalStorage*/
.RCTAsyncLocalStorage*/

# Flipper debugging data
flipper*/
.flipper*/

# Temporary files
tmp*/
.tmp*/

# App data directory (our secure location for app internals)
.app_data*/

# Only allow Music directory for user access
!Music/
`

	try {
		const jellifyIgnorePath = `${RNFS.DocumentDirectoryPath}/.jellifyignore`
		await RNFS.writeFile(jellifyIgnorePath, jellifyIgnoreContent, 'utf8')
		console.log('Created .jellifyignore file for documentation')
	} catch (error) {
		console.warn('Could not create .jellifyignore file:', error)
	}
}

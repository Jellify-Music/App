import { MMKV } from 'react-native-mmkv'
import { StateStorage } from 'zustand/middleware'
import { storage } from './storage'

// Import app version from package.json
const APP_VERSION = '0.21.3' // This should match package.json version

const STORAGE_VERSION_KEY = 'storage-schema-version'

/**
 * Storage schema versions - increment when making breaking changes to persisted state
 * This allows clearing specific stores when their schema changes
 */
export const STORAGE_SCHEMA_VERSIONS: Record<string, number> = {
	'player-queue-storage': 2, // Bumped to v2 for slim persistence
}

/**
 * Checks if a specific store needs to be cleared due to version bump
 * and clears it if necessary
 */
export function migrateStorageIfNeeded(storeName: string, storage: MMKV): void {
	const versionKey = `${STORAGE_VERSION_KEY}:${storeName}`
	const storedVersion = storage.getNumber(versionKey)
	const currentVersion = STORAGE_SCHEMA_VERSIONS[storeName] ?? 1

	if (storedVersion !== currentVersion) {
		// Clear the stale storage for this specific store
		storage.delete(storeName)
		// Update the version
		storage.set(versionKey, currentVersion)
		console.log(
			`[Storage] Migrated ${storeName} from v${storedVersion ?? 0} to v${currentVersion}`,
		)
	}
}

/**
 * Creates a versioned MMKV state storage that automatically clears stale data
 * when the schema version changes. This is useful for stores that persist
 * data that may become incompatible between app versions.
 *
 * @param storeName The unique name for this store (used as the MMKV key)
 * @returns A StateStorage compatible object for Zustand's persist middleware
 */
export function createVersionedMmkvStorage(storeName: string): StateStorage {
	// Run migration check on storage creation
	migrateStorageIfNeeded(storeName, storage)

	return {
		getItem: (key: string) => {
			const value = storage.getString(key)
			return value === undefined ? null : value
		},
		setItem: (key: string, value: string) => {
			storage.set(key, value)
		},
		removeItem: (key: string) => {
			storage.delete(key)
		},
	}
}

/**
 * Clears all versioned storage entries. Useful for debugging or forcing
 * a complete cache reset.
 */
export function clearAllVersionedStorage(): void {
	Object.keys(STORAGE_SCHEMA_VERSIONS).forEach((storeName) => {
		storage.delete(storeName)
		storage.delete(`${STORAGE_VERSION_KEY}:${storeName}`)
	})
	console.log('[Storage] Cleared all versioned storage')
}

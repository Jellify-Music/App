/* eslint-disable @typescript-eslint/no-explicit-any */
const mockMap = new Map<string, any>()

jest.mock('../../../src/constants/storage', () => ({
	storage: {
		getString: jest.fn((key: string) => mockMap.get(key)),
		set: jest.fn((key: string, value: any) => mockMap.set(key, value)),
		remove: jest.fn((key: string) => mockMap.delete(key)),
		getNumber: jest.fn((key: string) => mockMap.get(key)),
		clearAll: jest.fn(() => mockMap.clear()),
	},
}))

import {
	migrateStorageIfNeeded,
	createVersionedMmkvStorage,
	clearAllVersionedStorage,
	STORAGE_SCHEMA_VERSIONS,
} from '../../../src/constants/versioned-storage'
import { storage } from '../../../src/constants/storage'

describe('versioned-storage', () => {
	beforeEach(() => {
		mockMap.clear()
		jest.clearAllMocks()
	})

	describe('migrateStorageIfNeeded', () => {
		it('clears storage when stored version differs from current version', () => {
			mockMap.set('storage-schema-version:player-queue-storage', 1)

			migrateStorageIfNeeded('player-queue-storage', storage as any)

			expect(storage.remove).toHaveBeenCalledWith('player-queue-storage')
		})

		it('updates version key after migration', () => {
			mockMap.set('storage-schema-version:player-queue-storage', 1)

			migrateStorageIfNeeded('player-queue-storage', storage as any)

			expect(storage.set).toHaveBeenCalledWith(
				'storage-schema-version:player-queue-storage',
				STORAGE_SCHEMA_VERSIONS['player-queue-storage'],
			)
		})

		it('does not clear storage when versions match', () => {
			const currentVersion = STORAGE_SCHEMA_VERSIONS['player-queue-storage']
			mockMap.set('storage-schema-version:player-queue-storage', currentVersion)

			migrateStorageIfNeeded('player-queue-storage', storage as any)

			expect(storage.remove).not.toHaveBeenCalled()
			expect(storage.set).not.toHaveBeenCalled()
		})

		it('handles missing stored version as needing migration', () => {
			// mockMap has no version key, so getNumber returns undefined
			migrateStorageIfNeeded('player-queue-storage', storage as any)

			expect(storage.remove).toHaveBeenCalledWith('player-queue-storage')
			expect(storage.set).toHaveBeenCalledWith(
				'storage-schema-version:player-queue-storage',
				STORAGE_SCHEMA_VERSIONS['player-queue-storage'],
			)
		})
	})

	describe('createVersionedMmkvStorage', () => {
		it('runs migration on creation', () => {
			createVersionedMmkvStorage('player-queue-storage')

			// migrateStorageIfNeeded calls getNumber to check the version
			expect(storage.getNumber).toHaveBeenCalledWith(
				'storage-schema-version:player-queue-storage',
			)
		})

		it('returns working getItem/setItem/removeItem', () => {
			const adapter = createVersionedMmkvStorage('player-queue-storage')

			adapter.setItem('test-key', 'test-value')
			expect(storage.set).toHaveBeenCalledWith('test-key', 'test-value')

			const result = adapter.getItem('test-key')
			expect(storage.getString).toHaveBeenCalledWith('test-key')
			expect(result).toBe('test-value')

			adapter.removeItem('test-key')
			expect(storage.remove).toHaveBeenCalledWith('test-key')
		})

		it('getItem returns null for undefined values', () => {
			const adapter = createVersionedMmkvStorage('player-queue-storage')

			const result = adapter.getItem('nonexistent-key')
			expect(result).toBeNull()
		})
	})

	describe('clearAllVersionedStorage', () => {
		it('removes all stores listed in STORAGE_SCHEMA_VERSIONS', () => {
			clearAllVersionedStorage()

			const storeNames = Object.keys(STORAGE_SCHEMA_VERSIONS)
			for (const storeName of storeNames) {
				expect(storage.remove).toHaveBeenCalledWith(storeName)
			}
		})

		it('removes both the store key and version key for each store', () => {
			clearAllVersionedStorage()

			const storeNames = Object.keys(STORAGE_SCHEMA_VERSIONS)
			for (const storeName of storeNames) {
				expect(storage.remove).toHaveBeenCalledWith(storeName)
				expect(storage.remove).toHaveBeenCalledWith(`storage-schema-version:${storeName}`)
			}
		})
	})
})

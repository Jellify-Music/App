/**
 * Shared MMKV storage mock for all store tests.
 * Import this file (or reference it via jest.config.js setupFiles)
 * to get a clean Map-backed mock of storage & mmkvStateStorage.
 */
const map = new Map<string, string>()

jest.mock('../../src/constants/storage', () => ({
	storage: {
		getString: jest.fn((key: string) => map.get(key)),
		set: jest.fn((key: string, value: string) => map.set(key, value)),
		remove: jest.fn((key: string) => map.delete(key)),
		getNumber: jest.fn((key: string) => {
			const val = map.get(key)
			return val !== undefined ? Number(val) : undefined
		}),
		clearAll: jest.fn(() => map.clear()),
	},
	mmkvStateStorage: {
		getItem: jest.fn((key: string) => map.get(key) ?? null),
		setItem: jest.fn((key: string, value: string) => map.set(key, value)),
		removeItem: jest.fn((key: string) => map.delete(key)),
	},
}))

export { map as mockStorageMap }

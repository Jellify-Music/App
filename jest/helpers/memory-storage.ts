/**
 * A stand-in for `constants/storage` that keeps everything in memory, for tests of what gets saved.
 * Use it with `jest.mock('../../src/constants/storage', () => require('../helpers/memory-storage'))`.
 */
export const memoryStorageValues = new Map<string, string>()

export const storage = {
	set: (key: string, value: string) => void memoryStorageValues.set(key, value),
	getString: (key: string) => memoryStorageValues.get(key),
	getAllKeys: () => [...memoryStorageValues.keys()],
	remove: (key: string) => memoryStorageValues.delete(key),
}

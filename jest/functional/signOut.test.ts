import { renderHook } from '@testing-library/react-native'
import { useSignOut } from '../../src/stores/auth'
import { resetPlaylistIndexing } from '../../src/services/playlist-indexer'

jest.mock('../../src/services/playlist-indexer', () => ({
	resetPlaylistIndexing: jest.fn(),
}))

jest.mock('../../src/services/storage/images', () => ({ clearImageCache: jest.fn() }))

jest.mock('../../src/api/client', () => ({ queryClient: { clear: jest.fn() } }))

jest.mock('../../src/constants/storage', () => {
	const values = new Map<string, string>()

	return {
		storage: {
			getString: (key: string) => values.get(key),
			set: (key: string, value: string) => values.set(key, value),
			remove: (key: string) => values.delete(key),
			clearAll: jest.fn(),
		},
		mmkvStateStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
	}
})

describe('signing out', () => {
	it('forgets what was learned about the playlists, along with the rest of the user’s data', async () => {
		const { result } = await renderHook(() => useSignOut())

		result.current()

		expect(resetPlaylistIndexing).toHaveBeenCalledTimes(1)
	})
})

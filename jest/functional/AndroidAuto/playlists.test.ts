import { PlayerQueue } from 'react-native-nitro-player'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import {
	deleteAllAaPlaylists,
	materializePlaylist,
} from '../../../src/services/android-auto/playlists'
import { AA_PLAYLIST_NAME_PREFIX } from '../../../src/services/android-auto/tree'

jest.mock('../../../src/hooks/downloads/utils', () => ({
	ensureDownloadedTracks: jest.fn().mockResolvedValue([]),
}))
jest.mock('../../../src/utils/mapping/item-to-track', () => ({
	mapDtosToTracks: (items: BaseItemDto[]) => items.map((item) => ({ id: item.Id })),
}))

beforeEach(() => jest.clearAllMocks())

describe('materializePlaylist', () => {
	it('creates a prefixed native playlist with the mapped tracks', async () => {
		;(PlayerQueue.createPlaylist as jest.Mock).mockResolvedValue('native-1')

		const id = await materializePlaylist('Play it again', [{ Id: 'a' }, { Id: 'b' }])

		expect(id).toBe('native-1')
		expect(PlayerQueue.createPlaylist).toHaveBeenCalledWith(
			`${AA_PLAYLIST_NAME_PREFIX}Play it again`,
		)
		expect(PlayerQueue.addTracksToPlaylist).toHaveBeenCalledWith('native-1', [
			{ id: 'a' },
			{ id: 'b' },
		])
	})

	it('returns null and creates nothing for an empty list', async () => {
		expect(await materializePlaylist('Empty', [])).toBeNull()
		expect(PlayerQueue.createPlaylist).not.toHaveBeenCalled()
	})
})

describe('deleteAllAaPlaylists', () => {
	it('deletes only prefixed playlists', async () => {
		;(PlayerQueue.getAllPlaylists as jest.Mock).mockReturnValue([
			{ id: '1', name: `${AA_PLAYLIST_NAME_PREFIX}On Repeat`, tracks: [] },
			{ id: '2', name: 'Restored Playlist', tracks: [] },
		])

		await deleteAllAaPlaylists()

		expect(PlayerQueue.deletePlaylist).toHaveBeenCalledTimes(1)
		expect(PlayerQueue.deletePlaylist).toHaveBeenCalledWith('1')
	})
})

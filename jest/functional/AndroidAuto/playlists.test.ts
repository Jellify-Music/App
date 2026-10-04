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
	mapDtosToTracks: (items: BaseItemDto[]) =>
		items.map((item) => ({
			id: item.Id,
			artwork: item.Id === 'downloaded' ? 'file:///music/a.jpg' : 'https://jf/Images/Primary',
		})),
}))
jest.mock('../../../src/services/android-auto/artwork', () => ({
	artworkUri: (item: BaseItemDto) => `content://artwork/${item.Id}`,
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
			expect.objectContaining({ id: 'a' }),
			expect.objectContaining({ id: 'b' }),
		])
	})

	it('gives the tracks artwork Android Auto can show, keeping downloaded covers', async () => {
		;(PlayerQueue.createPlaylist as jest.Mock).mockResolvedValue('native-1')

		await materializePlaylist('Play it again', [{ Id: 'a' }, { Id: 'downloaded' }])

		expect((PlayerQueue.addTracksToPlaylist as jest.Mock).mock.calls[0][1]).toEqual([
			expect.objectContaining({ id: 'a', artwork: 'content://artwork/a' }),
			expect.objectContaining({ id: 'downloaded', artwork: 'file:///music/a.jpg' }),
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
	it('keeps the playlist that is currently playing', async () => {
		;(PlayerQueue.getCurrentPlaylistId as jest.Mock).mockReturnValue('1')
		;(PlayerQueue.getAllPlaylists as jest.Mock).mockReturnValue([
			{ id: '1', name: `${AA_PLAYLIST_NAME_PREFIX}On Repeat`, tracks: [] },
			{ id: '3', name: `${AA_PLAYLIST_NAME_PREFIX}Play it again`, tracks: [] },
		])

		await deleteAllAaPlaylists()

		expect(PlayerQueue.deletePlaylist).toHaveBeenCalledTimes(1)
		expect(PlayerQueue.deletePlaylist).toHaveBeenCalledWith('3')
	})
	it('keeps the playlists it is asked to keep', async () => {
		;(PlayerQueue.getCurrentPlaylistId as jest.Mock).mockReturnValue(undefined)
		;(PlayerQueue.getAllPlaylists as jest.Mock).mockReturnValue([
			{ id: '1', name: `${AA_PLAYLIST_NAME_PREFIX}Album`, tracks: [] },
			{ id: '3', name: `${AA_PLAYLIST_NAME_PREFIX}Play it again`, tracks: [] },
		])

		await deleteAllAaPlaylists(new Set(['1']))

		expect(PlayerQueue.deletePlaylist).toHaveBeenCalledTimes(1)
		expect(PlayerQueue.deletePlaylist).toHaveBeenCalledWith('3')
	})
})

import { DeviceEventEmitter, NativeModules, Platform } from 'react-native'
import { TrackPlayer, TrackItem } from 'react-native-nitro-player'
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api'
import {
	registerFavoriteButton,
	setFavoritesPlaylist,
} from '../../../src/services/android-auto/favorite'
import { PlayerQueue } from 'react-native-nitro-player'
import { queryClient } from '../../../src/constants/query-client'

jest.mock('@jellyfin/sdk/lib/utils/api', () => ({
	getUserLibraryApi: jest.fn(),
}))
jest.mock('../../../src/stores/auth/utils', () => ({
	getApi: () => ({}),
	getUser: () => ({ id: 'user-1' }),
	getLibrary: () => ({ musicLibraryId: 'lib-1' }),
}))
jest.mock('../../../src/api/queries/user-data/utils', () => jest.fn())
jest.mock('../../../src/api/mutations/favorite', () => ({
	invalidateRelevantQueries: jest.fn(),
}))

const setFavoriteButton = jest.fn()
const republish = jest.fn()
const markFavoriteItem = jest.fn()
const unmarkFavoriteItem = jest.fn()

const track = (id: string, isFavorite: boolean): TrackItem =>
	({
		id,
		url: 'https://jf/stream',
		extraPayload: {
			item: JSON.stringify({ Id: id, Type: 'Audio', UserData: { IsFavorite: isFavorite } }),
		},
	}) as unknown as TrackItem

let changeTrack: (track: TrackItem) => void
const press = () =>
	DeviceEventEmitter.emit('JellifyAndroidAutoCustomAction', { action: 'com.jellify.FAVORITE' })
const flush = () => new Promise((resolve) => setImmediate(resolve))

beforeAll(() => {
	Platform.OS = 'android'
	NativeModules.JellifyAndroidAuto = { setFavoriteButton }
	;(getUserLibraryApi as jest.Mock).mockReturnValue({ markFavoriteItem, unmarkFavoriteItem })
	;(TrackPlayer.onChangeTrack as jest.Mock).mockImplementation((cb) => (changeTrack = cb))
	jest.spyOn(console, 'error').mockImplementation(() => {})
	registerFavoriteButton(republish)
})

beforeEach(() => {
	jest.clearAllMocks()
	queryClient.clear()
	setFavoritesPlaylist(null)
})

it('shows an empty heart for a track that is not a favourite', async () => {
	changeTrack(track('t1', false))
	await flush()

	expect(setFavoriteButton).toHaveBeenLastCalledWith('not-favorite')
})

it('shows a filled heart for a favourite track', async () => {
	changeTrack(track('t2', true))
	await flush()

	expect(setFavoriteButton).toHaveBeenLastCalledWith('favorite')
})

it('marks the playing track as a favourite when the heart is pressed', async () => {
	markFavoriteItem.mockResolvedValue({ data: { IsFavorite: true } })
	changeTrack(track('t3', false))
	await flush()

	press()
	await flush()

	expect(markFavoriteItem).toHaveBeenCalledWith({ itemId: 't3' })
	expect(setFavoriteButton).toHaveBeenLastCalledWith('favorite')
})

it('removes the favourite on a second press', async () => {
	unmarkFavoriteItem.mockResolvedValue({ data: { IsFavorite: false } })
	changeTrack(track('t4', true))
	await flush()

	press()
	await flush()

	expect(unmarkFavoriteItem).toHaveBeenCalledWith({ itemId: 't4' })
	expect(setFavoriteButton).toHaveBeenLastCalledWith('not-favorite')
})

it('puts the heart back when the server call fails', async () => {
	markFavoriteItem.mockRejectedValue(new Error('offline'))
	changeTrack(track('t5', false))
	await flush()

	press()
	await flush()

	expect(setFavoriteButton.mock.calls.map(([state]) => state)).toEqual([
		'not-favorite',
		'favorite',
		'not-favorite',
	])
})

it('handles quick presses one after another, ending in the right state', async () => {
	let resolveMark!: (value: unknown) => void
	markFavoriteItem.mockReturnValue(new Promise((resolve) => (resolveMark = resolve)))
	unmarkFavoriteItem.mockResolvedValue({ data: { IsFavorite: false } })
	changeTrack(track('t10', false))
	await flush()

	press()
	press()
	await flush()
	expect(unmarkFavoriteItem).not.toHaveBeenCalled()

	resolveMark({ data: { IsFavorite: true } })
	await flush()
	await flush()

	expect(unmarkFavoriteItem).toHaveBeenCalledWith({ itemId: 't10' })
	expect(setFavoriteButton).toHaveBeenLastCalledWith('not-favorite')
})

it('keeps answering presses after one press failed unexpectedly', async () => {
	changeTrack(track('t11', false))
	await flush()
	setFavoriteButton.mockImplementationOnce(() => {
		throw new Error('native module gone')
	})
	press()
	await flush()

	markFavoriteItem.mockResolvedValue({ data: { IsFavorite: true } })
	unmarkFavoriteItem.mockResolvedValue({ data: { IsFavorite: false } })
	press()
	await flush()
	await flush()

	// The failed press already flipped the heart, so the next one may go either way; it just
	// has to reach the server.
	expect(markFavoriteItem.mock.calls.length + unmarkFavoriteItem.mock.calls.length).toBe(1)
})

describe('the Favourites playlist', () => {
	it('gets the song as soon as it is hearted, with its stream URL left to resolve on play', async () => {
		setFavoritesPlaylist('fav-playlist')
		markFavoriteItem.mockResolvedValue({ data: { IsFavorite: true } })
		changeTrack(track('t6', false))
		await flush()

		press()
		await flush()

		expect(PlayerQueue.addTrackToPlaylist).toHaveBeenCalledWith(
			'fav-playlist',
			expect.objectContaining({ id: 't6', url: '' }),
		)
	})

	it('is created by a republish when the first song is hearted', async () => {
		markFavoriteItem.mockResolvedValue({ data: { IsFavorite: true } })
		changeTrack(track('t9', false))
		await flush()

		press()
		await flush()

		expect(republish).toHaveBeenCalledTimes(1)
		expect(PlayerQueue.addTrackToPlaylist).not.toHaveBeenCalled()
	})

	it('loses the song when the heart is cleared', async () => {
		setFavoritesPlaylist('fav-playlist')
		unmarkFavoriteItem.mockResolvedValue({ data: { IsFavorite: false } })
		changeTrack(track('t7', true))
		await flush()

		press()
		await flush()

		expect(PlayerQueue.removeTrackFromPlaylist).toHaveBeenCalledWith('fav-playlist', 't7')
	})

	it('is left alone while it is the queue that is playing', async () => {
		setFavoritesPlaylist('fav-playlist')
		;(PlayerQueue.getCurrentPlaylistId as jest.Mock).mockReturnValue('fav-playlist')
		unmarkFavoriteItem.mockResolvedValue({ data: { IsFavorite: false } })
		changeTrack(track('t8', true))
		await flush()

		press()
		await flush()

		expect(PlayerQueue.removeTrackFromPlaylist).not.toHaveBeenCalled()
		;(PlayerQueue.getCurrentPlaylistId as jest.Mock).mockReturnValue(undefined)
	})
})

import { DeviceEventEmitter, NativeModules, Platform } from 'react-native'
import { TrackPlayer, TrackItem } from 'react-native-nitro-player'
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api'
import { registerFavoriteButton } from '../../../src/services/android-auto/favorite'
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
const markFavoriteItem = jest.fn()
const unmarkFavoriteItem = jest.fn()

const track = (id: string, isFavorite: boolean): TrackItem =>
	({
		id,
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
	registerFavoriteButton()
})

beforeEach(() => {
	jest.clearAllMocks()
	queryClient.clear()
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

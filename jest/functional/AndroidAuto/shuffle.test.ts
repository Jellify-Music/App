import { Platform } from 'react-native'
import { PlayerQueue, TrackPlayer } from 'react-native-nitro-player'
import { loadShuffle } from '../../../src/services/android-auto/data'
import { materializePlaylist } from '../../../src/services/android-auto/playlists'
import {
	hideShuffleButton,
	registerShuffleButton,
	setShufflePlaylist,
} from '../../../src/services/android-auto/shuffle'

jest.mock('../../../src/services/android-auto/data', () => ({ loadShuffle: jest.fn() }))
jest.mock('../../../src/services/android-auto/playlists', () => ({
	materializePlaylist: jest.fn(),
}))
jest.mock('../../../src/specs/NativeJellifyAndroidAuto', () => ({
	__esModule: true,
	default: { setShuffleButton: jest.fn(), onCustomAction: jest.fn() },
}))

const native = jest.requireMock('../../../src/specs/NativeJellifyAndroidAuto').default as Record<
	string,
	jest.Mock
>

let press: () => void = () => {}
let changeTrack: () => void = () => {}
const flush = () => new Promise((resolve) => setImmediate(resolve))

beforeAll(() => {
	Platform.OS = 'android'
	native.onCustomAction.mockImplementation((handler: (event: { action: string }) => void) => {
		press = () => handler({ action: 'com.jellify.SHUFFLE' })
		return { remove: jest.fn() }
	})
	;(TrackPlayer.onChangeTrack as jest.Mock).mockImplementation((cb) => (changeTrack = cb))
	jest.spyOn(console, 'error').mockImplementation(() => {})
	jest.spyOn(console, 'info').mockImplementation(() => {})
	registerShuffleButton()
})

beforeEach(() => {
	jest.clearAllMocks()
	hideShuffleButton()
	native.setShuffleButton.mockClear()
	;(loadShuffle as jest.Mock).mockResolvedValue({
		data: [{ Id: 'r1', Type: 'Audio' }],
		error: false,
	})
	;(materializePlaylist as jest.Mock).mockResolvedValue('shuffle-2')
})

it('shows the button while the Home shuffle plays, and hides it otherwise', () => {
	setShufflePlaylist('shuffle-1')

	;(PlayerQueue.getCurrentPlaylistId as jest.Mock).mockReturnValue('shuffle-1')
	changeTrack()
	expect(native.setShuffleButton).toHaveBeenLastCalledWith(true)

	;(PlayerQueue.getCurrentPlaylistId as jest.Mock).mockReturnValue('some-album')
	changeTrack()
	expect(native.setShuffleButton).toHaveBeenLastCalledWith(false)
})

it('plays a new set of random songs when pressed, without going back to Home', async () => {
	;(PlayerQueue.getCurrentPlaylistId as jest.Mock).mockReturnValue('shuffle-2')

	press()
	await flush()

	expect(loadShuffle).toHaveBeenCalledTimes(1)
	expect(materializePlaylist).toHaveBeenCalledWith('Shuffle', [{ Id: 'r1', Type: 'Audio' }])
	expect(PlayerQueue.loadPlaylist).toHaveBeenCalledWith('shuffle-2', 0)
	expect(TrackPlayer.play).toHaveBeenCalled()
	// The new shuffle counts as a shuffle too, so the button stays.
	expect(native.setShuffleButton).toHaveBeenLastCalledWith(true)
})

it('ignores a second press while the first is still drawing songs', async () => {
	press()
	press()
	await flush()

	expect(loadShuffle).toHaveBeenCalledTimes(1)
})

it('keeps playing what was playing when the server returns nothing', async () => {
	;(loadShuffle as jest.Mock).mockResolvedValue({ data: [], error: true })

	press()
	await flush()

	expect(PlayerQueue.loadPlaylist).not.toHaveBeenCalled()
})

it('hides the button and forgets the shuffles on sign-out', () => {
	setShufflePlaylist('shuffle-1')
	hideShuffleButton()

	;(PlayerQueue.getCurrentPlaylistId as jest.Mock).mockReturnValue('shuffle-1')
	changeTrack()
	expect(native.setShuffleButton).toHaveBeenLastCalledWith(false)
})

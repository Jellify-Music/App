import 'react-native'
import { TrackPlayer } from 'react-native-nitro-player'
import { togglePlayback, toggleRepeatMode } from '../../../src/hooks/player/functions/playback'
import { usePlayerQueueStore } from '../../../src/stores/player/queue'
import usePlayerEngineStore, { PlayerEngine } from '../../../src/stores/player/engine'

jest.mock('../../../src/stores/player/queue', () => ({
	usePlayerQueueStore: {
		getState: jest.fn(),
		setState: jest.fn(),
	},
}))

jest.mock('../../../src/stores/player/engine', () => {
	const PlayerEngine = {
		GOOGLE_CAST: 'google_cast',
		CARPLAY: 'carplay',
		REACT_NATIVE_TRACK_PLAYER: 'react_native_track_player',
	}
	return {
		__esModule: true,
		default: {
			getState: jest.fn(() => ({
				playerEngineData: PlayerEngine.REACT_NATIVE_TRACK_PLAYER,
			})),
		},
		PlayerEngine,
	}
})

const mockCastClient = {
	pause: jest.fn().mockResolvedValue(undefined),
	play: jest.fn().mockResolvedValue(undefined),
	seek: jest.fn().mockResolvedValue(undefined),
	getMediaStatus: jest.fn().mockResolvedValue({ streamPosition: 200 }),
}
const mockCastSession = { client: mockCastClient }

jest.mock('react-native-google-cast', () => ({
	__esModule: true,
	default: {
		getSessionManager: jest.fn(() => ({
			getCurrentCastSession: jest.fn(() => null),
		})),
	},
}))

jest.mock('../../../src/hooks/use-haptic-feedback', () => ({
	triggerHaptic: jest.fn(),
}))

describe('togglePlayback', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		;(usePlayerEngineStore as unknown as { getState: jest.Mock }).getState.mockReturnValue({
			playerEngineData: PlayerEngine.REACT_NATIVE_TRACK_PLAYER,
		})
		// Reset the cast mock to return no active session. Cast tests override
		// this per-test, but clearAllMocks only clears call history — it does
		// not undo mockReturnValue set by a previous test.
		const CastContext = require('react-native-google-cast').default
		CastContext.getSessionManager.mockReturnValue({
			getCurrentCastSession: jest.fn().mockResolvedValue(null),
		})
	})

	it('pauses when currently playing', async () => {
		;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
			currentState: 'playing',
			totalDuration: 180,
			currentPosition: 42,
		})

		await togglePlayback()

		expect(TrackPlayer.pause).toHaveBeenCalled()
		expect(TrackPlayer.play).not.toHaveBeenCalled()
	})

	it('plays when currently paused', async () => {
		;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
			currentState: 'paused',
			totalDuration: 180,
			currentPosition: 42,
		})

		await togglePlayback()

		expect(TrackPlayer.play).toHaveBeenCalled()
		expect(TrackPlayer.pause).not.toHaveBeenCalled()
	})

	it('seeks to start and plays when track has ended', async () => {
		;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
			currentState: 'paused',
			totalDuration: 180,
			currentPosition: 180,
		})

		await togglePlayback()

		expect(TrackPlayer.seek).toHaveBeenCalledWith(0)
		expect(TrackPlayer.play).toHaveBeenCalled()
	})

	it('seeks to start when position exceeds duration', async () => {
		;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
			currentState: 'stopped',
			totalDuration: 180,
			currentPosition: 200,
		})

		await togglePlayback()

		expect(TrackPlayer.seek).toHaveBeenCalledWith(0)
		expect(TrackPlayer.play).toHaveBeenCalled()
	})

	it('delegates pause to cast session when casting', async () => {
		const CastContext = require('react-native-google-cast').default
		CastContext.getSessionManager.mockReturnValue({
			getCurrentCastSession: jest.fn().mockResolvedValue(mockCastSession),
		})
		;(usePlayerEngineStore as unknown as { getState: jest.Mock }).getState.mockReturnValue({
			playerEngineData: PlayerEngine.GOOGLE_CAST,
		})
		;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
			currentState: 'playing',
			totalDuration: 180,
			currentPosition: 42,
		})

		await togglePlayback()

		expect(mockCastClient.pause).toHaveBeenCalled()
		expect(TrackPlayer.pause).not.toHaveBeenCalled()
	})

	it('delegates play to cast session when casting', async () => {
		const CastContext = require('react-native-google-cast').default
		CastContext.getSessionManager.mockReturnValue({
			getCurrentCastSession: jest.fn().mockResolvedValue(mockCastSession),
		})
		;(usePlayerEngineStore as unknown as { getState: jest.Mock }).getState.mockReturnValue({
			playerEngineData: PlayerEngine.GOOGLE_CAST,
		})
		;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
			currentState: 'paused',
			totalDuration: 180,
			currentPosition: 42,
		})

		await togglePlayback()

		expect(mockCastClient.play).toHaveBeenCalled()
		expect(TrackPlayer.play).not.toHaveBeenCalled()
	})

	it('seeks via cast when track has ended during cast', async () => {
		const CastContext = require('react-native-google-cast').default
		CastContext.getSessionManager.mockReturnValue({
			getCurrentCastSession: jest.fn().mockResolvedValue(mockCastSession),
		})
		;(usePlayerEngineStore as unknown as { getState: jest.Mock }).getState.mockReturnValue({
			playerEngineData: PlayerEngine.GOOGLE_CAST,
		})
		mockCastClient.getMediaStatus.mockResolvedValue({ streamPosition: 200 })
		;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
			currentState: 'paused',
			totalDuration: 180,
			currentPosition: 42,
		})

		await togglePlayback()

		expect(mockCastClient.seek).toHaveBeenCalledWith({
			position: 0,
			resumeState: 'play',
		})
	})
})

describe('toggleRepeatMode', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		;(usePlayerQueueStore.getState as jest.Mock).mockReturnValue({
			repeatMode: 'off',
			setRepeatMode: jest.fn(),
		})
	})

	it('cycles from off to Playlist', async () => {
		;(TrackPlayer.getRepeatMode as jest.Mock).mockReturnValue('off')
		const setRepeatMode = jest.fn()
		;(usePlayerQueueStore.getState as jest.Mock).mockReturnValue({
			repeatMode: 'off',
			setRepeatMode,
		})

		await toggleRepeatMode()

		expect(TrackPlayer.setRepeatMode).toHaveBeenCalledWith('Playlist')
		expect(setRepeatMode).toHaveBeenCalledWith('Playlist')
		expect(TrackPlayer.pause).not.toHaveBeenCalled()
	})

	it('cycles from Playlist to track', async () => {
		;(TrackPlayer.getRepeatMode as jest.Mock).mockReturnValue('Playlist')
		const setRepeatMode = jest.fn()
		;(usePlayerQueueStore.getState as jest.Mock).mockReturnValue({
			repeatMode: 'Playlist',
			setRepeatMode,
		})

		await toggleRepeatMode()

		expect(TrackPlayer.setRepeatMode).toHaveBeenCalledWith('track')
		expect(setRepeatMode).toHaveBeenCalledWith('track')
		expect(TrackPlayer.pause).not.toHaveBeenCalled()
	})

	it('cycles from track to off', async () => {
		;(TrackPlayer.getRepeatMode as jest.Mock).mockReturnValue('track')
		const setRepeatMode = jest.fn()
		;(usePlayerQueueStore.getState as jest.Mock).mockReturnValue({
			repeatMode: 'track',
			setRepeatMode,
		})

		await toggleRepeatMode()

		expect(TrackPlayer.setRepeatMode).toHaveBeenCalledWith('off')
		expect(setRepeatMode).toHaveBeenCalledWith('off')
		expect(TrackPlayer.pause).not.toHaveBeenCalled()
	})
})

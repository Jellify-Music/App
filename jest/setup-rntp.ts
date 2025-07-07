/* eslint-disable @typescript-eslint/no-explicit-any */
export let eventHandler: any

// https://github.com/doublesymmetry/react-native-track-player/issues/501
jest.mock('react-native-track-player', () => {
	const listeners = new Map()

	return {
		addEventListener: () => ({
			remove: jest.fn(),
		}),
		registerEventHandler: jest.fn(),
		registerPlaybackService: jest.fn(),
		setupPlayer: jest.fn().mockResolvedValue(undefined),
		destroy: jest.fn(),
		updateOptions: jest.fn(),
		reset: jest.fn(),
		add: jest.fn(),
		remove: jest.fn(),
		skip: jest.fn(),
		skipToNext: jest.fn(),
		skipToPrevious: jest.fn(),
		removeUpcomingTracks: jest.fn(),
		setQueue: jest.fn(),
		move: jest.fn(),
		seekBy: jest.fn(),
		setRepeatMode: jest.fn(),
		// playback commands
		play: jest.fn(),
		pause: jest.fn(),
		stop: jest.fn(),
		seekTo: jest.fn(),
		setVolume: jest.fn(),
		setRate: jest.fn(),
		// player getters
		getQueue: jest.fn(),
		getTrack: jest.fn(),
		getActiveTrackIndex: jest.fn(),
		getActiveTrack: jest.fn(),
		getCurrentTrack: jest.fn(),
		getVolume: jest.fn(),
		getDuration: jest.fn(),
		getProgress: jest.fn().mockResolvedValue({ position: 0 }),
		getBufferedPosition: jest.fn(),
		getState: jest.fn(),
		getRate: jest.fn(),
		useProgress: () => ({
			position: 0,
			buffered: 150,
			duration: 200,
		}),
		usePlaybackState: () => 'playing',

		// eslint-disable @typescript-eslint/no-explicit-any
		useTrackPlayerEvents: (events: Event[], handler: (variables: any) => void) => {
			eventHandler = handler
		},
		Capability: {
			Play: 1,
			PlayFromId: 2,
			PlayFromSearch: 4,
			Pause: 8,
			Stop: 16,
			SeekTo: 32,
			Skip: 64,
			SkipToNext: 128,
			SkipToPrevious: 256,
		},
		IOSCategoryOptions: {
			MixWithOthers: 'mixWithOthers',
			DuckOthers: 'duckOthers',
			InterruptSpokenAudioAndMixWithOthers: 'interruptSpokenAudioAndMixWithOthers',
			AllowBluetooth: 'allowBluetooth',
			AllowBluetoothA2DP: 'allowBluetoothA2DP',
			AllowAirPlay: 'allowAirPlay',
			DefaultToSpeaker: 'defaultToSpeaker',
		},
		IOSCategoryMode: {
			Default: 'default',
			GameChat: 'gameChat',
			Measurement: 'measurement',
			MoviePlayback: 'moviePlayback',
			SpokenAudio: 'spokenAudio',
			VideoChat: 'videoChat',
			VideoRecording: 'videoRecording',
			VoiceChat: 'voiceChat',
			VoicePrompt: 'voicePrompt',
		},
		IOSCategory: {
			Playback: 'playback',
			PlaybackAndRecord: 'playbackAndRecord',
			MultiRoute: 'multiRoute',
			Ambient: 'ambient',
			SoloAmbient: 'soloAmbient',
			Record: 'record',
			PlayAndRecord: 'playAndRecord',
		},
		Event: {
			PlaybackActiveTrackChanged: 'playbackActiveTrackChanged',
		},
		RepeatMode: {
			Off: 0,
			Track: 1,
			Queue: 2,
		},
	}
})

// Mock the gapless helper to avoid dynamic import issues in tests
jest.mock('../src/player/helpers/gapless', () => ({
	ensureUpcomingTracksInQueue: jest.fn().mockResolvedValue(undefined),
}))

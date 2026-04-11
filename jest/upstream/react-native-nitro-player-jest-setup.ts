/**
 * Official Jest mock for react-native-nitro-player
 *
 * Usage in your jest.config.js:
 *   setupFilesAfterEnv: ['react-native-nitro-player/jest/setup']
 *
 * Or copy this file into your project and reference it directly.
 *
 * This mock covers the complete API surface of react-native-nitro-player@0.7.x:
 *   - TrackPlayer (playback, navigation, queue, state, callbacks)
 *   - PlayerQueue (playlist CRUD, track management, callbacks)
 *   - DownloadManager (download lifecycle, storage, playback source)
 *   - Equalizer (bands, presets, state)
 *   - All React hooks (useNowPlaying, useDownloadedTracks, etc.)
 *   - Type enum helpers (RepeatMode, TrackPlayerState, Reason, etc.)
 *
 * Every method is a jest.fn() with sensible default return values that
 * match the real module's type signatures. Override in individual tests:
 *
 *   import { TrackPlayer } from 'react-native-nitro-player'
 *   ;(TrackPlayer.getState as jest.Mock).mockResolvedValue({ ... })
 *
 * Synchronous vs async matches the real module:
 *   - getRepeatMode()       → synchronous (mockReturnValue)
 *   - isAndroidAutoConnected() → synchronous
 *   - isEnabled() (EQ)      → synchronous
 *   - Everything else        → async (mockResolvedValue)
 *
 * @version 0.7.x
 * @see https://github.com/nickcopi/react-native-nitro-player
 */
jest.mock('react-native-nitro-player', () => ({
	// ─── TrackPlayer ───────────────────────────────────────────────
	TrackPlayer: {
		// Playback
		play: jest.fn().mockResolvedValue(undefined),
		pause: jest.fn().mockResolvedValue(undefined),
		playSong: jest.fn().mockResolvedValue(undefined),
		seek: jest.fn().mockResolvedValue(undefined),
		setVolume: jest.fn().mockResolvedValue(undefined),
		setPlaybackSpeed: jest.fn().mockResolvedValue(undefined),
		getPlaybackSpeed: jest.fn().mockResolvedValue(1),

		// Navigation
		skipToNext: jest.fn().mockResolvedValue(undefined),
		skipToPrevious: jest.fn().mockResolvedValue(undefined),
		skipToIndex: jest.fn().mockResolvedValue(true),

		// Temporary queue (play-next / up-next)
		addToUpNext: jest.fn().mockResolvedValue(undefined),
		playNext: jest.fn().mockResolvedValue(undefined),
		removeFromPlayNext: jest.fn().mockResolvedValue(true),
		removeFromUpNext: jest.fn().mockResolvedValue(true),
		clearPlayNext: jest.fn().mockResolvedValue(undefined),
		clearUpNext: jest.fn().mockResolvedValue(undefined),
		reorderTemporaryTrack: jest.fn().mockResolvedValue(true),
		getPlayNextQueue: jest.fn().mockResolvedValue([]),
		getUpNextQueue: jest.fn().mockResolvedValue([]),

		// State
		getState: jest.fn().mockResolvedValue({
			currentTrack: null,
			currentPosition: 0,
			totalDuration: 0,
			currentState: 'stopped',
			currentPlaylistId: null,
			currentIndex: 0,
			currentPlayingType: 'not-playing',
		}),
		getActualQueue: jest.fn().mockResolvedValue([]),
		getCurrentTrackIndex: jest.fn().mockResolvedValue(-1),

		// Repeat mode — getRepeatMode is SYNCHRONOUS
		setRepeatMode: jest.fn().mockResolvedValue(undefined),
		getRepeatMode: jest.fn().mockReturnValue('off'),

		// Configuration
		configure: jest.fn().mockResolvedValue(undefined),

		// Track management
		updateTracks: jest.fn().mockResolvedValue(undefined),
		getTracksById: jest.fn().mockResolvedValue([]),
		getTracksNeedingUrls: jest.fn().mockResolvedValue([]),
		getNextTracks: jest.fn().mockResolvedValue([]),

		// Android Auto — SYNCHRONOUS
		isAndroidAutoConnected: jest.fn().mockReturnValue(false),

		// Callbacks
		onChangeTrack: jest.fn(),
		onPlaybackStateChange: jest.fn(),
		onPlaybackProgressChange: jest.fn(),
		onSeek: jest.fn(),
		onTracksNeedUpdate: jest.fn(),
		onAndroidAutoConnectionChange: jest.fn(),
		onTemporaryQueueChange: jest.fn(),
	},

	// ─── PlayerQueue ───────────────────────────────────────────────
	PlayerQueue: {
		createPlaylist: jest.fn().mockResolvedValue('playlist-mock-id'),
		deletePlaylist: jest.fn().mockResolvedValue(undefined),
		updatePlaylist: jest.fn().mockResolvedValue(undefined),
		getPlaylist: jest.fn().mockReturnValue(null),
		getAllPlaylists: jest.fn().mockReturnValue([]),
		addTrackToPlaylist: jest.fn().mockResolvedValue(undefined),
		addTracksToPlaylist: jest.fn().mockResolvedValue(undefined),
		removeTrackFromPlaylist: jest.fn().mockResolvedValue(undefined),
		reorderTrackInPlaylist: jest.fn().mockResolvedValue(undefined),
		loadPlaylist: jest.fn().mockResolvedValue(undefined),
		getCurrentPlaylistId: jest.fn().mockReturnValue(null),
		onPlaylistsChanged: jest.fn(),
		onPlaylistChanged: jest.fn(),
	},

	// ─── DownloadManager ───────────────────────────────────────────
	DownloadManager: {
		configure: jest.fn(),
		getConfig: jest.fn().mockReturnValue({}),
		downloadTrack: jest.fn().mockResolvedValue('download-mock-id'),
		downloadPlaylist: jest.fn().mockResolvedValue([]),
		pauseDownload: jest.fn().mockResolvedValue(undefined),
		resumeDownload: jest.fn().mockResolvedValue(undefined),
		cancelDownload: jest.fn().mockResolvedValue(undefined),
		retryDownload: jest.fn().mockResolvedValue(undefined),
		pauseAllDownloads: jest.fn().mockResolvedValue(undefined),
		resumeAllDownloads: jest.fn().mockResolvedValue(undefined),
		cancelAllDownloads: jest.fn().mockResolvedValue(undefined),
		getDownloadTask: jest.fn().mockReturnValue(null),
		getActiveDownloads: jest.fn().mockReturnValue([]),
		getQueueStatus: jest.fn().mockReturnValue({
			pendingCount: 0,
			activeCount: 0,
			completedCount: 0,
			failedCount: 0,
			totalBytesToDownload: 0,
			totalBytesDownloaded: 0,
			overallProgress: 0,
		}),
		isDownloading: jest.fn().mockReturnValue(false),
		getDownloadState: jest.fn().mockReturnValue(null),
		isTrackDownloaded: jest.fn().mockResolvedValue(false),
		isPlaylistDownloaded: jest.fn().mockResolvedValue(false),
		isPlaylistPartiallyDownloaded: jest.fn().mockResolvedValue(false),
		getDownloadedTrack: jest.fn().mockResolvedValue(null),
		getAllDownloadedTracks: jest.fn().mockResolvedValue([]),
		getDownloadedPlaylist: jest.fn().mockResolvedValue(null),
		getAllDownloadedPlaylists: jest.fn().mockResolvedValue([]),
		getLocalPath: jest.fn().mockResolvedValue(null),
		deleteDownloadedTrack: jest.fn().mockResolvedValue(undefined),
		deleteDownloadedPlaylist: jest.fn().mockResolvedValue(undefined),
		deleteAllDownloads: jest.fn().mockResolvedValue(undefined),
		getStorageInfo: jest.fn().mockResolvedValue({
			totalDownloadedSize: 0,
			trackCount: 0,
			playlistCount: 0,
			availableSpace: 0,
			totalSpace: 0,
		}),
		syncDownloads: jest.fn().mockResolvedValue(0),
		setPlaybackSourcePreference: jest.fn(),
		getPlaybackSourcePreference: jest.fn().mockReturnValue('auto'),
		getEffectiveUrl: jest.fn().mockResolvedValue(''),
		onDownloadProgress: jest.fn(),
		onDownloadStateChange: jest.fn(),
		onDownloadComplete: jest.fn(),
	},

	// ─── Equalizer ─────────────────────────────────────────────────
	Equalizer: {
		setEnabled: jest.fn().mockResolvedValue(undefined),
		isEnabled: jest.fn().mockReturnValue(false),
		getBands: jest.fn().mockResolvedValue([]),
		setBandGain: jest.fn().mockResolvedValue(undefined),
		setAllBandGains: jest.fn().mockResolvedValue(undefined),
		getBandRange: jest.fn().mockReturnValue({ min: -12, max: 12 }),
		getPresets: jest.fn().mockReturnValue([]),
		getBuiltInPresets: jest.fn().mockReturnValue([]),
		getCustomPresets: jest.fn().mockReturnValue([]),
		applyPreset: jest.fn().mockResolvedValue(undefined),
		getCurrentPresetName: jest.fn().mockReturnValue(null),
		saveCustomPreset: jest.fn().mockResolvedValue(undefined),
		deleteCustomPreset: jest.fn().mockResolvedValue(undefined),
		getState: jest.fn().mockResolvedValue({}),
		reset: jest.fn().mockResolvedValue(undefined),
		onEnabledChange: jest.fn(),
		onBandChange: jest.fn(),
		onPresetChange: jest.fn(),
	},

	// ─── Platform-specific modules (nullable) ──────────────────────
	AndroidAutoMediaLibrary: null,
	AudioDevices: null,
	AudioRoutePicker: null,

	// ─── Enum / union type helpers ─────────────────────────────────
	RepeatMode: { Off: 'off', Playlist: 'Playlist', Track: 'track' },
	TrackPlayerState: { Playing: 'playing', Paused: 'paused', Stopped: 'stopped' },
	Reason: {
		UserAction: 'user_action',
		Skip: 'skip',
		End: 'end',
		Error: 'error',
		Repeat: 'repeat',
	},
	DownloadState: {
		Pending: 'pending',
		Downloading: 'downloading',
		Paused: 'paused',
		Completed: 'completed',
		Failed: 'failed',
		Cancelled: 'cancelled',
	},
	PlaybackSource: { Auto: 'auto', Download: 'download', Network: 'network' },
	CurrentPlayingType: {
		Playlist: 'playlist',
		UpNext: 'up-next',
		PlayNext: 'play-next',
		NotPlaying: 'not-playing',
	},

	// ─── React Hooks ───────────────────────────────────────────────
	useNowPlaying: jest.fn().mockReturnValue({
		currentTrack: null,
		currentPosition: 0,
		totalDuration: 0,
		currentState: 'stopped',
		currentPlaylistId: null,
		currentIndex: 0,
		currentPlayingType: 'not-playing',
	}),
	useOnChangeTrack: jest.fn().mockReturnValue({ track: null, reason: undefined, isReady: false }),
	useOnPlaybackStateChange: jest
		.fn()
		.mockReturnValue({ state: 'stopped', reason: undefined, isReady: false }),
	useOnPlaybackProgressChange: jest
		.fn()
		.mockReturnValue({ position: 0, totalDuration: 0, isManuallySeeked: undefined }),
	useOnSeek: jest.fn().mockReturnValue({ position: undefined, totalDuration: undefined }),
	useActualQueue: jest
		.fn()
		.mockReturnValue({ queue: [], refreshQueue: jest.fn(), isLoading: false }),
	usePlaylist: jest.fn().mockReturnValue({
		currentPlaylist: null,
		currentPlaylistId: null,
		allPlaylists: [],
		allTracks: [],
		isLoading: false,
		refreshPlaylists: jest.fn(),
	}),
	useDownloadProgress: jest.fn().mockReturnValue({
		progressMap: new Map(),
		progressList: [],
		overallProgress: 0,
		isDownloading: false,
		getProgress: jest.fn().mockReturnValue(undefined),
	}),
	useDownloadedTracks: jest.fn().mockReturnValue({
		downloadedTracks: [],
		downloadedPlaylists: [],
		isTrackDownloaded: jest.fn().mockReturnValue(false),
		isPlaylistDownloaded: jest.fn().mockReturnValue(false),
		isPlaylistPartiallyDownloaded: jest.fn().mockReturnValue(false),
		getDownloadedTrack: jest.fn().mockReturnValue(undefined),
		getDownloadedPlaylist: jest.fn().mockReturnValue(undefined),
		refresh: jest.fn(),
		isLoading: false,
	}),
	useDownloadActions: jest.fn().mockReturnValue({
		downloadTrack: jest.fn().mockResolvedValue(''),
		downloadPlaylist: jest.fn().mockResolvedValue([]),
		pauseDownload: jest.fn().mockResolvedValue(undefined),
		resumeDownload: jest.fn().mockResolvedValue(undefined),
		cancelDownload: jest.fn().mockResolvedValue(undefined),
		retryDownload: jest.fn().mockResolvedValue(undefined),
		pauseAll: jest.fn().mockResolvedValue(undefined),
		resumeAll: jest.fn().mockResolvedValue(undefined),
		cancelAll: jest.fn().mockResolvedValue(undefined),
		deleteTrack: jest.fn().mockResolvedValue(undefined),
		deletePlaylist: jest.fn().mockResolvedValue(undefined),
		deleteAll: jest.fn().mockResolvedValue(undefined),
		configure: jest.fn(),
		setPlaybackSourcePreference: jest.fn(),
		getPlaybackSourcePreference: jest.fn().mockReturnValue('auto'),
		isDownloading: false,
		isDeleting: false,
		error: null,
	}),
	useDownloadStorage: jest.fn().mockReturnValue({
		storageInfo: null,
		isLoading: false,
		refresh: jest.fn().mockResolvedValue(undefined),
		formattedSize: '0 B',
		formattedAvailable: '0 B',
		usagePercentage: 0,
	}),
	useEqualizer: jest.fn().mockReturnValue({
		isEnabled: false,
		bands: [],
		currentPreset: null,
		setEnabled: jest.fn().mockResolvedValue(true),
		setBandGain: jest.fn().mockResolvedValue(true),
		setAllBandGains: jest.fn().mockResolvedValue(true),
		reset: jest.fn().mockResolvedValue(undefined),
		isLoading: false,
		gainRange: { min: -12, max: 12 },
	}),
	useEqualizerPresets: jest.fn().mockReturnValue({
		presets: [],
		builtInPresets: [],
		customPresets: [],
		applyPreset: jest.fn().mockResolvedValue(true),
		saveCustomPreset: jest.fn().mockResolvedValue(true),
		deleteCustomPreset: jest.fn().mockResolvedValue(true),
		currentPreset: null,
		isLoading: false,
		refreshPresets: jest.fn(),
	}),
	useAndroidAutoConnection: jest.fn().mockReturnValue({ isConnected: false }),
	useAudioDevices: jest.fn().mockReturnValue({ devices: [] }),

	// ─── Utility ───────────────────────────────────────────────────
	AndroidAutoMediaLibraryHelper: {
		setMediaLibrary: jest.fn().mockResolvedValue(undefined),
		clearMediaLibrary: jest.fn().mockResolvedValue(undefined),
	},
}))

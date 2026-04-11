/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Meta-test: validates that our jest mock of react-native-nitro-player
 * covers every method and export that the real module exposes.
 *
 * If this test fails after upgrading react-native-nitro-player, it means
 * new methods were added upstream that need to be added to
 * jest/setup/nitro-player.ts.
 */

// Import the mock (loaded via jest/setup/nitro-player.ts)
import { TrackPlayer, PlayerQueue, DownloadManager, Equalizer } from 'react-native-nitro-player'

// The real type definitions — we check our mock satisfies them
import type { TrackPlayer as TrackPlayerType } from 'react-native-nitro-player/lib/specs/TrackPlayer.nitro'
import type { PlayerQueue as PlayerQueueType } from 'react-native-nitro-player/lib/specs/TrackPlayer.nitro'
import type { DownloadManager as DownloadManagerType } from 'react-native-nitro-player/lib/specs/DownloadManager.nitro'
import type { Equalizer as EqualizerType } from 'react-native-nitro-player/lib/specs/Equalizer.nitro'

/**
 * Extracts method names from a HybridObject interface type,
 * excluding the inherited HybridObject properties.
 */
const HYBRID_OBJECT_KEYS = new Set(['name', 'toString', 'equals', 'dispose', 'memorySize'])

function getMethodNames(obj: Record<string, unknown>): string[] {
	return Object.keys(obj).filter((key) => !HYBRID_OBJECT_KEYS.has(key))
}

/**
 * For each module, build the expected method list from the type definitions.
 * We derive these from the .d.ts interfaces.
 */
const EXPECTED_TRACK_PLAYER_METHODS: (keyof Omit<
	TrackPlayerType,
	'name' | 'toString' | 'equals' | 'dispose' | 'memorySize'
>)[] = [
	'play',
	'pause',
	'playSong',
	'skipToNext',
	'skipToIndex',
	'skipToPrevious',
	'seek',
	'addToUpNext',
	'playNext',
	'getActualQueue',
	'getState',
	'setRepeatMode',
	'getRepeatMode',
	'configure',
	'onChangeTrack',
	'onPlaybackStateChange',
	'onSeek',
	'onPlaybackProgressChange',
	'onAndroidAutoConnectionChange',
	'isAndroidAutoConnected',
	'setVolume',
	'updateTracks',
	'getTracksById',
	'getTracksNeedingUrls',
	'getNextTracks',
	'getCurrentTrackIndex',
	'onTracksNeedUpdate',
	'setPlaybackSpeed',
	'getPlaybackSpeed',
	'removeFromPlayNext',
	'removeFromUpNext',
	'clearPlayNext',
	'clearUpNext',
	'reorderTemporaryTrack',
	'getPlayNextQueue',
	'getUpNextQueue',
	'onTemporaryQueueChange',
]

const EXPECTED_PLAYER_QUEUE_METHODS: (keyof Omit<
	PlayerQueueType,
	'name' | 'toString' | 'equals' | 'dispose' | 'memorySize'
>)[] = [
	'createPlaylist',
	'deletePlaylist',
	'updatePlaylist',
	'getPlaylist',
	'getAllPlaylists',
	'addTrackToPlaylist',
	'addTracksToPlaylist',
	'removeTrackFromPlaylist',
	'reorderTrackInPlaylist',
	'loadPlaylist',
	'getCurrentPlaylistId',
	'onPlaylistsChanged',
	'onPlaylistChanged',
]

const EXPECTED_DOWNLOAD_MANAGER_METHODS: (keyof Omit<
	DownloadManagerType,
	'name' | 'toString' | 'equals' | 'dispose' | 'memorySize'
>)[] = [
	'configure',
	'getConfig',
	'downloadTrack',
	'downloadPlaylist',
	'pauseDownload',
	'resumeDownload',
	'cancelDownload',
	'retryDownload',
	'pauseAllDownloads',
	'resumeAllDownloads',
	'cancelAllDownloads',
	'getDownloadTask',
	'getActiveDownloads',
	'getQueueStatus',
	'isDownloading',
	'getDownloadState',
	'isTrackDownloaded',
	'isPlaylistDownloaded',
	'isPlaylistPartiallyDownloaded',
	'getDownloadedTrack',
	'getAllDownloadedTracks',
	'getDownloadedPlaylist',
	'getAllDownloadedPlaylists',
	'getLocalPath',
	'deleteDownloadedTrack',
	'deleteDownloadedPlaylist',
	'deleteAllDownloads',
	'getStorageInfo',
	'syncDownloads',
	'setPlaybackSourcePreference',
	'getPlaybackSourcePreference',
	'getEffectiveUrl',
	'onDownloadProgress',
	'onDownloadStateChange',
	'onDownloadComplete',
]

const EXPECTED_EQUALIZER_METHODS: (keyof Omit<
	EqualizerType,
	'name' | 'toString' | 'equals' | 'dispose' | 'memorySize'
>)[] = [
	'setEnabled',
	'isEnabled',
	'getBands',
	'setBandGain',
	'setAllBandGains',
	'getBandRange',
	'getPresets',
	'getBuiltInPresets',
	'getCustomPresets',
	'applyPreset',
	'getCurrentPresetName',
	'saveCustomPreset',
	'deleteCustomPreset',
	'getState',
	'reset',
	'onEnabledChange',
	'onBandChange',
	'onPresetChange',
]

describe('nitro-player mock completeness', () => {
	describe('TrackPlayer', () => {
		const mockMethods = getMethodNames(TrackPlayer as unknown as Record<string, unknown>)

		it.each(EXPECTED_TRACK_PLAYER_METHODS)('mocks %s', (method) => {
			expect(mockMethods).toContain(method)
			expect(typeof (TrackPlayer as any)[method]).toBe('function')
		})

		it('has no extra methods beyond what the interface defines', () => {
			const extras = mockMethods.filter(
				(m) => !(EXPECTED_TRACK_PLAYER_METHODS as string[]).includes(m),
			)
			expect(extras).toEqual([])
		})
	})

	describe('PlayerQueue', () => {
		const mockMethods = getMethodNames(PlayerQueue as unknown as Record<string, unknown>)

		it.each(EXPECTED_PLAYER_QUEUE_METHODS)('mocks %s', (method) => {
			expect(mockMethods).toContain(method)
			expect(typeof (PlayerQueue as any)[method]).toBe('function')
		})

		it('has no extra methods beyond what the interface defines', () => {
			const extras = mockMethods.filter(
				(m) => !(EXPECTED_PLAYER_QUEUE_METHODS as string[]).includes(m),
			)
			expect(extras).toEqual([])
		})
	})

	describe('DownloadManager', () => {
		const mockMethods = getMethodNames(DownloadManager as unknown as Record<string, unknown>)

		it.each(EXPECTED_DOWNLOAD_MANAGER_METHODS)('mocks %s', (method) => {
			expect(mockMethods).toContain(method)
			expect(typeof (DownloadManager as any)[method]).toBe('function')
		})

		it('has no extra methods beyond what the interface defines', () => {
			const extras = mockMethods.filter(
				(m) => !(EXPECTED_DOWNLOAD_MANAGER_METHODS as string[]).includes(m),
			)
			expect(extras).toEqual([])
		})
	})

	describe('Equalizer', () => {
		const mockMethods = getMethodNames(Equalizer as unknown as Record<string, unknown>)

		it.each(EXPECTED_EQUALIZER_METHODS)('mocks %s', (method) => {
			expect(mockMethods).toContain(method)
			expect(typeof (Equalizer as any)[method]).toBe('function')
		})

		it('has no extra methods beyond what the interface defines', () => {
			const extras = mockMethods.filter(
				(m) => !(EXPECTED_EQUALIZER_METHODS as string[]).includes(m),
			)
			expect(extras).toEqual([])
		})
	})

	describe('Hook exports', () => {
		const nitroPlayer = require('react-native-nitro-player')

		const EXPECTED_HOOKS = [
			'useNowPlaying',
			'useOnChangeTrack',
			'useOnPlaybackStateChange',
			'useOnPlaybackProgressChange',
			'useOnSeek',
			'useActualQueue',
			'usePlaylist',
			'useDownloadProgress',
			'useDownloadedTracks',
			'useDownloadActions',
			'useDownloadStorage',
			'useEqualizer',
			'useEqualizerPresets',
			'useAndroidAutoConnection',
			'useAudioDevices',
		]

		it.each(EXPECTED_HOOKS)('mocks %s hook', (hookName) => {
			expect(typeof nitroPlayer[hookName]).toBe('function')
		})
	})

	describe('Type/enum exports', () => {
		const nitroPlayer = require('react-native-nitro-player')

		it('exports RepeatMode with correct values', () => {
			expect(nitroPlayer.RepeatMode).toEqual({
				Off: 'off',
				Playlist: 'Playlist',
				Track: 'track',
			})
		})

		it('exports TrackPlayerState with correct values', () => {
			expect(nitroPlayer.TrackPlayerState).toEqual({
				Playing: 'playing',
				Paused: 'paused',
				Stopped: 'stopped',
			})
		})

		it('exports Reason with correct values', () => {
			expect(nitroPlayer.Reason).toEqual({
				UserAction: 'user_action',
				Skip: 'skip',
				End: 'end',
				Error: 'error',
				Repeat: 'repeat',
			})
		})
	})

	describe('getRepeatMode is synchronous (not a Promise)', () => {
		it('returns a string directly, not a Promise', () => {
			const result = TrackPlayer.getRepeatMode()
			// If this were async, result would be a Promise object
			expect(typeof result).toBe('string')
			expect(result).toBe('off')
		})
	})
})

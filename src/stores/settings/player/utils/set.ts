import { useStreamingDeviceProfileStore } from '../../../profile'
import { getDeviceProfile } from '../../../../utils/audio/device-profiles'
import type { PlayerSettingsStoreSet } from '../types'
import { PlayerSettingsStore } from '../types'
import { usePlayerQueueStore } from '../../../../stores/player/queue'
import applyAudioNormalizationIfEnabled from '../../../../utils/audio/normalization'
import { configureNitroPlayer } from '../../../../services/player'

export const setStreamingQuality =
	(set: PlayerSettingsStoreSet): PlayerSettingsStore['setStreamingQuality'] =>
	(streamingQuality) => {
		set({ streamingQuality })
		useStreamingDeviceProfileStore
			.getState()
			.setDeviceProfile(getDeviceProfile(streamingQuality, 'stream'))
	}

/**
 * Sets whether or not to perform audio normalization on
 * tracks.
 *
 * Runs {@link applyAudioNormalizationIfEnabled} after the value is set
 *
 * @param enabled Whether to enable Audio Normalization
 */
export const setEnableAudioNormalization =
	(set: PlayerSettingsStoreSet): PlayerSettingsStore['setEnableAudioNormalization'] =>
	async (enabled) => {
		set({ enableAudioNormalization: enabled })

		const { currentIndex, queue } = usePlayerQueueStore()

		const currentTrack = currentIndex !== undefined && queue[currentIndex]
		if (currentTrack) await applyAudioNormalizationIfEnabled(currentTrack)
	}

export const setLookahead =
	(set: PlayerSettingsStoreSet): PlayerSettingsStore['setLookahead'] =>
	async (lookahead) => {
		await configureNitroPlayer({
			lookaheadCount: lookahead,
		})

		set({ lookahead })
	}

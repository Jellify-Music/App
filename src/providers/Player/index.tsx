import { usePerformanceMonitor } from '../../hooks/use-performance-monitor'
import TrackPlayer, { Event, State, useTrackPlayerEvents } from 'react-native-track-player'
import { createContext, useEffect, useState } from 'react'
import { handleActiveTrackChanged } from './functions'
import JellifyTrack from '../../types/JellifyTrack'
import { useAutoDownload } from '../../stores/settings/usage'
import reportPlaybackStopped from '../../api/mutations/playback/functions/playback-stopped'
import reportPlaybackCompleted from '../../api/mutations/playback/functions/playback-completed'
import isPlaybackFinished from '../../api/mutations/playback/utils'
import reportPlaybackStarted from '../../api/mutations/playback/functions/playback-started'
import calculateTrackVolume from './utils/normalization'
import saveAudioItem from '../../api/mutations/download/utils'
import { useDownloadingDeviceProfile } from '../../stores/device-profile'
import Initialize from './functions/initialization'
import { useEnableAudioNormalization } from '../../stores/settings/player'
import { usePlayerQueueStore } from '../../stores/player/queue'
import usePostFullCapabilities from '../../api/mutations/session'
import reportPlaybackProgress from '../../api/mutations/playback/functions/playback-progress'
import { PLAYER_EVENTS } from '../../configs/player.config'

interface PlayerContext {}

export const PlayerContext = createContext<PlayerContext>({})

export const PlayerProvider: () => React.JSX.Element = () => {
	const [initialized, setInitialized] = useState<boolean>(false)

	const [autoDownload] = useAutoDownload()

	const [enableAudioNormalization] = useEnableAudioNormalization()

	usePostFullCapabilities()

	const downloadingDeviceProfile = useDownloadingDeviceProfile()

	usePerformanceMonitor('PlayerProvider', 3)

	useTrackPlayerEvents(PLAYER_EVENTS, async (event) => {
		switch (event.type) {
			case Event.PlaybackActiveTrackChanged: {
				if (event.track) {
					handleActiveTrackChanged(event.track as JellifyTrack, event.index)

					reportPlaybackStarted(event.track as JellifyTrack, 0)

					if (enableAudioNormalization) {
						const volume = calculateTrackVolume(event.track as JellifyTrack)
						await TrackPlayer.setVolume(volume)
					}
				}

				if (event.lastTrack && event.lastPosition) {
					if (isPlaybackFinished(event.lastPosition, event.lastTrack.duration ?? 1))
						reportPlaybackCompleted(event.lastTrack as JellifyTrack)
					else reportPlaybackStopped(event.lastTrack as JellifyTrack, event.lastPosition)
				}
				break
			}
			case Event.PlaybackProgressUpdated: {
				const currentTrack = usePlayerQueueStore.getState().currentTrack

				if (event.position && currentTrack)
					reportPlaybackProgress(currentTrack, event.position)

				if (event.position / event.duration > 0.3 && autoDownload && currentTrack) {
					await saveAudioItem(currentTrack.item, downloadingDeviceProfile, true).then(
						(value) => console.log('Track downloaded'),
					)
				}

				break
			}

			case Event.PlaybackState: {
				const currentTrack = usePlayerQueueStore.getState().currentTrack

				switch (event.state) {
					case State.Playing:
						if (currentTrack) reportPlaybackStarted(currentTrack)
						break
					default:
						if (currentTrack) reportPlaybackStopped(currentTrack)
						break
				}
				break
			}
		}
	})

	useEffect(() => {
		if (!initialized) {
			setInitialized(true)
			Initialize()
		}
	}, [])

	return <PlayerContext value={{}} />
}

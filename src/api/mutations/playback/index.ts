import JellifyTrack from '../../../types/JellifyTrack'
import { useMutation } from '@tanstack/react-query'
import reportPlaybackCompleted from './functions/playback-completed'
import reportPlaybackStopped from './functions/playback-stopped'
import isPlaybackFinished from './utils'
import reportPlaybackProgress from './functions/playback-progress'
import reportPlaybackStarted from './functions/playback-started'

interface PlaybackStartedMutation {
	track: JellifyTrack
	position?: number
}

/**
 * @deprecated
 * @returns
 */
export const useReportPlaybackStarted = () =>
	useMutation({
		onMutate: () => {},
		mutationFn: async ({ track, position }: PlaybackStartedMutation) =>
			reportPlaybackStarted(track, position ?? 0),
		onError: (error) => console.error(`Reporting playback started failed`, error),
		onSuccess: () => {},
	})

interface PlaybackStoppedMutation {
	track: JellifyTrack
	lastPosition: number
	duration: number
}

/**
 * @deprecated
 * @returns
 */
export const useReportPlaybackStopped = () =>
	useMutation({
		onMutate: ({ lastPosition, duration }) => {},
		mutationFn: async ({ track, lastPosition, duration }: PlaybackStoppedMutation) => {
			return isPlaybackFinished(lastPosition, duration)
				? await reportPlaybackCompleted(track)
				: await reportPlaybackStopped(track, lastPosition)
		},
		onError: (error, { lastPosition, duration }) =>
			console.error(
				`Reporting playback ${isPlaybackFinished(lastPosition, duration) ? 'completed' : 'stopped'} failed`,
				error,
			),
		onSuccess: (_, { lastPosition, duration }) => {},
	})

interface PlaybackProgressMutation {
	track: JellifyTrack
	position: number
}

/**
 * @deprecated
 * @returns
 */
export const useReportPlaybackProgress = () =>
	useMutation({
		onMutate: ({ position }) => {},
		mutationFn: async ({ track, position }: PlaybackProgressMutation) =>
			reportPlaybackProgress(track, position),
	})

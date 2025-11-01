import JellifyTrack from '../../../types/JellifyTrack'
import { useMutation } from '@tanstack/react-query'
import reportPlaybackCompleted from './functions/playback-completed'
import reportPlaybackStopped from './functions/playback-stopped'
import isPlaybackFinished from './utils'
import reportPlaybackProgress from './functions/playback-progress'
import reportPlaybackStarted from './functions/playback-started'
import { useApi } from '../../../stores'

interface PlaybackStartedMutation {
	track: JellifyTrack
}

export const useReportPlaybackStarted = () => {
	const api = useApi()

	return useMutation({
		onMutate: () => {},
		mutationFn: async ({ track }: PlaybackStartedMutation) => reportPlaybackStarted(api, track),
		onError: (error) => console.error(`Reporting playback started failed`, error),
		onSuccess: () => console.debug(`Reported playback started`),
	})
}

interface PlaybackStoppedMutation {
	track: JellifyTrack
	lastPosition: number
	duration: number
}

export const useReportPlaybackStopped = () => {
	const api = useApi()

	return useMutation({
		onMutate: ({ lastPosition, duration }) =>
			console.debug(
				`Reporting playback ${isPlaybackFinished(lastPosition, duration) ? 'completed' : 'stopped'} for track`,
			),
		mutationFn: async ({ track, lastPosition, duration }: PlaybackStoppedMutation) => {
			return isPlaybackFinished(lastPosition, duration)
				? await reportPlaybackCompleted(api, track)
				: await reportPlaybackStopped(api, track)
		},
		onError: (error, { lastPosition, duration }) =>
			console.error(
				`Reporting playback ${isPlaybackFinished(lastPosition, duration) ? 'completed' : 'stopped'} failed`,
				error,
			),
		onSuccess: (_, { lastPosition, duration }) =>
			console.debug(
				`Reported playback ${isPlaybackFinished(lastPosition, duration) ? 'completed' : 'stopped'} successfully`,
			),
	})
}

interface PlaybackProgressMutation {
	track: JellifyTrack
	position: number
}

export const useReportPlaybackProgress = () => {
	const api = useApi()

	return useMutation({
		onMutate: ({ position }) => console.debug(`Reporting progress at ${position}`),
		mutationFn: async ({ track, position }: PlaybackProgressMutation) =>
			reportPlaybackProgress(api, track, position),
	})
}

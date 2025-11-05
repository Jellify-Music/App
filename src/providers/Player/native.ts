import TrackPlayer, {
	Capability,
	Event,
	RatingType,
	RepeatMode,
	State,
	TrackType,
	usePlaybackState as usePlaybackStateHook,
	useProgress as useProgressHook,
	useTrackPlayerEvents,
} from 'react-native-track-player'
import type { Progress, Track } from 'react-native-track-player'
import type JellifyTrack from '../../types/JellifyTrack'
import {
	ALLOWED_TRACK_KEYS,
	getExtraTrackKeys,
	RNTPTrack,
	sanitizeTrack,
} from './utils/sanitizeTrack'

type TrackInput = JellifyTrack | RNTPTrack
type TrackArgument = TrackInput | TrackInput[]

const warnedExtraKeys = new Set<string>()

function normalizeTracks(tracks: TrackArgument): TrackInput[] {
	return Array.isArray(tracks) ? tracks : [tracks]
}

function warnOnExtraKeys(track: TrackInput) {
	const isDev = typeof __DEV__ === 'boolean' ? __DEV__ : false
	if (!isDev) return
	const extras = getExtraTrackKeys(track).sort()
	if (extras.length === 0) return

	const signature = extras.join(',')
	if (warnedExtraKeys.has(signature)) return
	warnedExtraKeys.add(signature)

	console.warn(
		`[PlayerNative] Received track with non-RNTP fields: ${extras.join(
			', ',
		)}. Allowed keys: ${ALLOWED_TRACK_KEYS.join(', ')}`,
	)
}

function sanitizeTracks(tracks: TrackArgument): RNTPTrack[] {
	const normalized = normalizeTracks(tracks)
	return normalized.map((track) => {
		warnOnExtraKeys(track)
		return sanitizeTrack(track)
	})
}

async function addWithSanitization(
	tracks: TrackArgument,
	insertBeforeIndex?: number,
): Promise<void> {
	const sanitized = sanitizeTracks(tracks)
	await TrackPlayer.add(sanitized, insertBeforeIndex)
}

async function setQueueWithSanitization(tracks: TrackArgument): Promise<void> {
	const sanitized = sanitizeTracks(tracks)
	await TrackPlayer.setQueue(sanitized)
}

const PlayerNative = {
	...TrackPlayer,
	add: addWithSanitization,
	setQueue: setQueueWithSanitization,
} as typeof TrackPlayer & {
	add: (tracks: TrackArgument, insertBeforeIndex?: number) => Promise<void>
	setQueue: (tracks: TrackArgument) => Promise<void>
}

export type { RNTPTrack, Progress, Track }
export {
	PlayerNative as default,
	Capability,
	Event,
	RatingType,
	RepeatMode,
	State,
	TrackType,
	useTrackPlayerEvents,
	useProgressHook as useProgress,
	usePlaybackStateHook as usePlaybackState,
}

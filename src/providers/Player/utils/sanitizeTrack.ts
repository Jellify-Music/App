import type { Track } from 'react-native-track-player'
import type JellifyTrack from '../../../types/JellifyTrack'

const ALLOWED_TRACK_KEYS = [
	'id',
	'url',
	'title',
	'artist',
	'album',
	'artwork',
	'duration',
	'type',
	'headers',
] as const

export type AllowedTrackKey = (typeof ALLOWED_TRACK_KEYS)[number]

export type RNTPTrack = Pick<Track, AllowedTrackKey>

type SanitizableTrack = JellifyTrack | RNTPTrack | Record<string, unknown>

/**
 * Sanitizes a track object so that only the RNTP-supported keys reach the native bridge.
 * @param track The track to sanitize
 * @returns RNTP-compliant track shape
 */
export function sanitizeTrack(track: SanitizableTrack): RNTPTrack {
	const sanitized: Partial<RNTPTrack> = {}

	for (const key of ALLOWED_TRACK_KEYS) {
		const value = (track as Record<string, unknown>)[key]
		if (value !== undefined) {
			sanitized[key] = value as RNTPTrack[AllowedTrackKey]
		}
	}

	return sanitized as RNTPTrack
}

export function getExtraTrackKeys(track: SanitizableTrack): string[] {
	if (!track || typeof track !== 'object') return []

	const allowed = new Set<string>(ALLOWED_TRACK_KEYS)
	return Object.keys(track).filter((key) => !allowed.has(key))
}

export { ALLOWED_TRACK_KEYS }

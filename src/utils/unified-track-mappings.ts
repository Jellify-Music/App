/**
 * Mapping utilities for converting unified tracks to player-ready JellifyTrack format.
 * This enables playback of tracks from any backend (Jellyfin or Navidrome).
 */

import { TrackType } from 'react-native-track-player'
import { MusicServerAdapter } from '../api/core/adapter'
import { UnifiedTrack } from '../api/core/types'
import JellifyTrack, { unifiedTrackToBaseItem } from '../types/JellifyTrack'
import { QueuingType } from '../enums/queuing-type'

/**
 * Maps a UnifiedTrack to a JellifyTrack that can be used with react-native-track-player.
 *
 * @param adapter The music server adapter (for getting stream and cover art URLs)
 * @param track The unified track to map
 * @param queuingType The queuing type to apply to the track
 * @returns A JellifyTrack ready for playback
 */
export function mapUnifiedTrackToPlayerTrack(
	adapter: MusicServerAdapter,
	track: UnifiedTrack,
	queuingType?: QueuingType,
): JellifyTrack {
	return {
		// react-native-track-player required fields
		url: adapter.getStreamUrl(track.id),
		title: track.name,
		album: track.albumName,
		artist: track.artistName,
		artwork: adapter.getCoverArtUrl(track.coverArtId ?? track.id),
		duration: track.duration,

		// JellifyTrack specific fields
		item: unifiedTrackToBaseItem(track),
		backend: 'navidrome',
		sourceType: 'stream',
		sessionId: null, // Navidrome doesn't have session IDs
		QueuingType: queuingType ?? QueuingType.DirectlyQueued,

		// Track type for react-native-track-player
		type: TrackType.Default,
	}
}

/**
 * Maps multiple unified tracks to player tracks.
 */
export function mapUnifiedTracksToPlayerTracks(
	adapter: MusicServerAdapter,
	tracks: UnifiedTrack[],
	queuingType?: QueuingType,
): JellifyTrack[] {
	return tracks.map((track) => mapUnifiedTrackToPlayerTrack(adapter, track, queuingType))
}

/**
 * Helper to determine if a JellifyTrack came from Navidrome.
 */
export function isNavidromeJellifyTrack(track: JellifyTrack): boolean {
	return track.backend === 'navidrome'
}

/**
 * Gets the track ID from a JellifyTrack regardless of backend.
 */
export function getJellifyTrackId(track: JellifyTrack): string {
	return track.item.Id!
}

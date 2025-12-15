/**
 * Unified hook for getting playable tracks.
 * Handles the mapping from UnifiedTrack to JellifyTrack for both backends.
 */

import { useMemo } from 'react'
import { useAdapter, useJellifyServer } from '../../stores'
import { UnifiedTrack } from '../../api/core/types'
import JellifyTrack from '../../types/JellifyTrack'
import { mapUnifiedTrackToPlayerTrack } from '../../utils/unified-track-mappings'
import { QueuingType } from '../../enums/queuing-type'

/**
 * Returns a function that can convert a UnifiedTrack to a playable JellifyTrack.
 * This is useful for components that need to trigger playback.
 */
export function useTrackMapper() {
	const adapter = useAdapter()
	const [server] = useJellifyServer()

	return useMemo(() => {
		if (!adapter || !server) return null

		return {
			/**
			 * Map a single unified track to a playable JellifyTrack.
			 */
			mapTrack: (track: UnifiedTrack, queuingType?: QueuingType): JellifyTrack => {
				return mapUnifiedTrackToPlayerTrack(adapter, track, queuingType)
			},

			/**
			 * Map multiple unified tracks to playable JellifyTracks.
			 */
			mapTracks: (tracks: UnifiedTrack[], queuingType?: QueuingType): JellifyTrack[] => {
				return tracks.map((track) =>
					mapUnifiedTrackToPlayerTrack(adapter, track, queuingType),
				)
			},

			/**
			 * Get the stream URL for a track.
			 */
			getStreamUrl: (trackId: string) => adapter.getStreamUrl(trackId),

			/**
			 * Get the cover art URL for an item.
			 */
			getCoverArtUrl: (id: string, size?: number) => adapter.getCoverArtUrl(id, size),

			/**
			 * The current backend type.
			 */
			backend: server.backend ?? 'jellyfin',
		}
	}, [adapter, server])
}

export default useTrackMapper

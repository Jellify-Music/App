import { RatingType, Track } from 'react-native-track-player'
import { QueuingType } from '../enums/queuing-type'
import { BaseItemDto, MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client/models'
import { ServerBackend, UnifiedTrack } from '../api/core/types'

export type SourceType = 'stream' | 'download'

export type BaseItemDtoSlimified = Pick<
	BaseItemDto,
	| 'Id'
	| 'Name'
	| 'SortName' // @deprecated - use Name instead. Kept for migration of existing downloads.
	| 'AlbumId'
	| 'ArtistItems'
	| 'ImageBlurHashes'
	| 'NormalizationGain'
	| 'RunTimeTicks'
>

/**
 * Slimified version of UnifiedTrack for persistence.
 */
export type UnifiedTrackSlimified = Pick<
	UnifiedTrack,
	| 'id'
	| 'name'
	| 'albumId'
	| 'albumName'
	| 'artistId'
	| 'artistName'
	| 'duration'
	| 'trackNumber'
	| 'discNumber'
	| 'coverArtId'
	| 'normalizationGain'
>

interface JellifyTrack extends Track {
	title?: string | undefined
	album?: string | undefined
	artist?: string | undefined
	duration: number
	artwork?: string | undefined
	description?: string | undefined
	genre?: string | undefined
	date?: string | undefined
	rating?: RatingType | undefined
	isLiveStream?: boolean | undefined

	sourceType: SourceType
	/**
	 * The source item for Jellyfin tracks.
	 * For Navidrome tracks, this should be a compatible shim created from UnifiedTrack.
	 */
	item: BaseItemDtoSlimified
	/** Backend type discriminator - defaults to 'jellyfin' for backwards compatibility */
	backend?: ServerBackend
	sessionId: string | null | undefined
	mediaSourceInfo?: MediaSourceInfo

	/**
	 * Represents the type of queuing for this song, be it that it was
	 * queued from the selection chosen, queued by the user directly, or marked
	 * to play next by the user
	 */
	QueuingType?: QueuingType | undefined
}

/**
 * Helper function to convert a UnifiedTrack to a BaseItemDtoSlimified for compatibility.
 * This allows Navidrome tracks to work with existing Jellyfin-oriented code.
 */
export function unifiedTrackToBaseItem(
	track: UnifiedTrack | UnifiedTrackSlimified,
): BaseItemDtoSlimified {
	return {
		Id: track.id,
		Name: track.name,
		AlbumId: track.albumId,
		ArtistItems: track.artistId ? [{ Id: track.artistId, Name: track.artistName }] : undefined,
		NormalizationGain: track.normalizationGain,
		// Convert duration from seconds to ticks (1 tick = 100 nanoseconds, 10M ticks = 1 second)
		RunTimeTicks: track.duration * 10_000_000,
	}
}

/**
 * Get the track ID from a BaseItemDtoSlimified.
 */
export function getTrackId(item: BaseItemDtoSlimified): string | undefined {
	return item.Id
}

/**
 * A slimmed-down version of JellifyTrack for persistence.
 * Excludes large fields like mediaSourceInfo and transient data
 * to prevent storage overflow (RangeError: String length exceeds limit).
 *
 * When hydrating from storage, these fields will need to be rebuilt
 * from the API or left undefined until playback is requested.
 */
export type PersistedJellifyTrack = Omit<JellifyTrack, 'mediaSourceInfo' | 'headers'> & {
	/** Store only essential media source fields for persistence */
	mediaSourceInfo?: Pick<MediaSourceInfo, 'Id' | 'Container' | 'Bitrate'> | undefined
}

/**
 * Converts a full JellifyTrack to a PersistedJellifyTrack for storage
 */
export function toPersistedTrack(track: JellifyTrack): PersistedJellifyTrack {
	const { mediaSourceInfo, headers, ...rest } = track as JellifyTrack & { headers?: unknown }

	return {
		...rest,
		// Only persist essential media source fields
		mediaSourceInfo: mediaSourceInfo
			? {
					Id: mediaSourceInfo.Id,
					Container: mediaSourceInfo.Container,
					Bitrate: mediaSourceInfo.Bitrate,
				}
			: undefined,
	}
}

/**
 * Converts a PersistedJellifyTrack back to a JellifyTrack
 * Note: Some fields like full mediaSourceInfo and headers will be undefined
 * and need to be rebuilt when playback is requested
 */
export function fromPersistedTrack(persisted: PersistedJellifyTrack): JellifyTrack {
	// Cast is safe because PersistedJellifyTrack has all required fields
	// except the omitted ones (mediaSourceInfo, headers) which are optional in JellifyTrack
	return persisted as unknown as JellifyTrack
}

export default JellifyTrack

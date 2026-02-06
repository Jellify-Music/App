import { TrackItem } from 'react-native-nitro-player'
import { QueuingType } from '../enums/queuing-type'
import {
	BaseItemDto,
	MediaSourceInfo,
	NameGuidPair,
} from '@jellyfin/sdk/lib/generated-client/models'

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
	| 'OfficialRating'
	| 'CustomRating'
	| 'ProductionYear'
>

/**
 * Type-safe representation of extra metadata attached to a track.
 * This ensures consistent typing when accessing track extraPayload throughout the app.
 *
 * Note: Properties that come from the API may be null, so they're typed with null | undefined
 * to match the source data. When accessing these values, use optional chaining (?.) and
 * nullish coalescing (??) to handle both null and undefined safely.
 */
export type TrackExtraPayload = Record<string, unknown> & {
	/** List of artist items associated with the track */
	artistItems?: NameGuidPair[] | null | undefined
	/** Album information for the track */
	albumItem?:
		| {
				Id?: string | null | undefined
				Album?: string | null | undefined
		  }
		| undefined
	/** Playback source type (streaming or downloaded) */
	sourceType?: SourceType | undefined
	/** Media source information for detailed codec/quality info */
	mediaSourceInfo?: MediaSourceInfo | undefined
	/** Official rating for content (e.g. "G", "PG", "M") */
	officialRating?: string | null | undefined
	/** Custom rating applied by server/admin (e.g. "Adults Only") */
	customRating?: string | null | undefined
	/** Album ID for looking up album details */
	AlbumId?: string | null | undefined
	/** Artist items - accessible by alternative key name */
	ArtistItems?: NameGuidPair[] | null | undefined
}

/**
 * @deprecated Use {@link TrackItem} directly
 */
interface JellifyTrack extends TrackItem {
	description?: string | undefined
	genre?: string | undefined
	date?: string | undefined
	isLiveStream?: boolean | undefined
	officialRating?: string | undefined
	customRating?: string | undefined

	sourceType: SourceType
	item: BaseItemDtoSlimified
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
 * Get the extra payload from a track with proper typing.
 * This ensures type-safe access to the extraPayload field which comes from react-native-nitro-player.
 *
 * @param track The track to get the extra payload from
 * @returns The properly typed extra payload, or undefined
 *
 * @example
 * const payload = getTrackExtraPayload(currentTrack);
 * const artists = payload?.artistItems;
 * const albumId = payload?.AlbumId;
 */
export function getTrackExtraPayload(track: TrackItem | undefined): TrackExtraPayload | undefined {
	return track?.extraPayload as TrackExtraPayload | undefined
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

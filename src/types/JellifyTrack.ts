import { RatingType, Track } from 'react-native-track-player'
import { QueuingType } from '../enums/queuing-type'
import { BaseItemDto, MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client/models'

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

export default JellifyTrack

import { PitchAlgorithm, RatingType, Track, TrackType } from 'react-native-track-player'
import { QueuingType } from '../enums/queuing-type'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'

interface JellifyTrack extends Track {
	url: string
	type?: TrackType | undefined
	userAgent?: string | undefined
	contentType?: string | undefined
	pitchAlgorithm?: PitchAlgorithm | undefined

	/* eslint-disable @typescript-eslint/no-explicit-any */
	headers?: { [key: string]: any } | undefined

	title?: string | undefined
	album?: string | undefined
	artist?: string | undefined
	duration?: number | undefined
	artwork?: string | undefined
	description?: string | undefined
	genre?: string | undefined
	date?: string | undefined
	rating?: RatingType | undefined
	isLiveStream?: boolean | undefined

	item: BaseItemDto

	/**
	 * Represents the type of queuing for this song, be it that it was
	 * queued from the selection chosen, queued by the user directly, or marked
	 * to play next by the user
	 */
	QueuingType?: QueuingType | undefined
}

export default JellifyTrack

import { QueuingType } from '../../enums/queuing-type'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { Queue } from '../../player/types/queue-item'
import { Api } from '@jellyfin/sdk'
import { networkStatusTypes } from '../../components/Network/internetConnectionWatcher'
import { JellifyDownload } from '@/src/types/JellifyDownload'
import { DownloadQuality, StreamingQuality } from '../Settings'

/**
 * A mutation to handle loading a new queue.
 */
export interface QueueMutation {
	/**
	 * The {@link Api} instance from the Jellify Context provider
	 */
	api: Api | undefined

	/**
	 * The network status of the app, used to determine which tracks
	 * should be ignored from the queuing operation
	 */
	networkStatus: networkStatusTypes | null

	downloadedTracks: JellifyDownload[] | undefined

	downloadQuality: DownloadQuality

	streamingQuality: StreamingQuality

	/**
	 * The track that will be played first in the queue.
	 */
	track: BaseItemDto
	/**
	 * The index in the queue of the initially played track.
	 */
	index?: number | undefined
	/**
	 * The list of tracks to load into the queue.
	 */
	tracklist: BaseItemDto[]
	/**
	 * The {@link Queue} that this tracklist represents, be it
	 * an album or playlist (represented as a {@link BaseItemDto}),
	 * or a specific queue type (represented by a string)
	 */
	queue: Queue
	/**
	 * The type of queuing to use, dictates the placement of tracks in the queue.
	 */
	queuingType?: QueuingType | undefined

	/**
	 * Whether the queue should be shuffled.
	 */
	shuffled?: boolean | undefined

	/**
	 * Whether to start playback immediately.
	 */
	startPlayback?: boolean | undefined
}

/**
 * A mutation to handle adding a track to the queue.
 */
export interface AddToQueueMutation {
	/**
	 * The {@link Api} instance from the Jellify Context provider
	 */
	api: Api | undefined

	/**
	 * The network status of the app, used to determine which tracks
	 * should be ignored from the queuing operation
	 */
	networkStatus: networkStatusTypes | null

	downloadedTracks: JellifyDownload[] | undefined

	downloadQuality: DownloadQuality

	streamingQuality: StreamingQuality

	/**
	 * The tracks to add to the queue.
	 */
	tracks: BaseItemDto[]
	/**
	 * The type of queuing to use, dictates the placement of the track in the queue,
	 * be it playing next, or playing in the queue later
	 */
	queuingType?: QueuingType | undefined
}

/**
 * A mutation to handle reordering the queue.
 */
export interface QueueOrderMutation {
	/**
	 * The index the track is moving from
	 */
	from: number
	/**
	 * The index the track is moving to
	 */
	to: number
}

import { EventHandler } from '../../../types/Events'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'

/**
 * Represents the parameters for updating a playlist
 */
export interface UseUpdatePlaylistParams {
	/**
	 * The error handler for the mutation
	 */
	onError?: EventHandler<Error>

	/**
	 * The settled handler for the mutation
	 */
	onSettled?: EventHandler
}

/**
 * Represents the mutation for adding tracks to a playlist
 */
export interface AddToPlaylistMutation {
	/**
	 * The tracks to add to the playlist
	 */
	tracks: BaseItemDto[]

	/**
	 * The playlist to add tracks to
	 */
	playlist: BaseItemDto
}

/**
 * Represents the mutation for removing tracks from a playlist
 */
export interface RemoveFromPlaylistMutation {
	/**
	 * The tracks to remove from the playlist
	 */
	tracks: BaseItemDto[]

	/**
	 * The playlist to remove tracks from
	 */
	playlist: BaseItemDto
}

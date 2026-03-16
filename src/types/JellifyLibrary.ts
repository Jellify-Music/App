import { usePlaylistLibrary } from '../api/queries/libraries'

export interface JellifyLibrary {
	musicLibraryId: string
	musicLibraryName?: string | undefined
	musicLibraryPrimaryImageId?: string | undefined

	/**
	 * @deprecated Use {@link usePlaylistLibrary} instead.
	 *
	 * This property will be removed in a future version.
	 */
	playlistLibraryId?: string | undefined
	playlistLibraryPrimaryImageId?: string | undefined
}

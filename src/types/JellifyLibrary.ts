export interface JellifyLibrary {
	musicLibraryId: string
	musicLibraryName?: string | undefined
	musicLibraryPrimaryImageId?: string | undefined

	/**
	 * @deprecated Use usePlaylistLibrary instead.
	 *
	 * This property will be removed in a future version.
	 */
	playlistLibraryId?: string | undefined
	playlistLibraryPrimaryImageId?: string | undefined
}

/**
 * The music library selected by the user.
 *
 * Selecting a library is optional: when it is `undefined`, Jellify queries
 * every music library the user can access.
 */
export interface JellifyLibrary {
	musicLibraryId: string
	musicLibraryName?: string | undefined
	musicLibraryPrimaryImageId?: string | null | undefined

	/**
	 * @deprecated Use usePlaylistLibrary instead.
	 *
	 * This property will be removed in a future version.
	 */
	playlistLibraryId?: string | undefined
	playlistLibraryPrimaryImageId?: string | undefined
}

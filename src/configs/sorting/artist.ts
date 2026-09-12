import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client'

/**
 * Options for sorting artists
 */
const ArtistsSortByConfig = {
	SortName: ItemSortBy.SortName, // Server API call
	DateLastContentAdded: ItemSortBy.DateLastContentAdded, // Custom Query Logic, driven from albums
	DatePlayed: ItemSortBy.DatePlayed, // Custom Query Logic, driven from tracks
}

export default ArtistsSortByConfig

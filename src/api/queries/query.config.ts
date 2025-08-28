import { ImageFormat } from '@jellyfin/sdk/lib/generated-client/models'

export enum ApiLimits {
	Library = 100,
}

const QueryConfig = {
	/**
	 * Defines the limits for the number of items returned by a query
	 */
	limits: {
		recents: 50,

		/**
		 * The number of items to fetch for the library, set to 30
		 * This is used for the artists, albums, and tracks tabs in the library
		 */
		library: 250,

		/**
		 * The number of items to fetch for the instant mix, set to 50
		 * This is used for the instant mix results
		 */
		instantMix: 50,

		/**
		 * The number of items to fetch for the search, set to 50
		 * This is used for the search tab in the player
		 */
		search: 50, // TODO: make this a paginated search so limits don't even matter

		/**
		 * The number of items to fetch for the similar items, set to 20
		 */
		similar: 20,
	},
	images: {
		height: 300,
		width: 300,
		format: ImageFormat.Jpg,
	},
	banners: {
		fillHeight: 300,
		fillWidth: 1000,
		format: ImageFormat.Jpg,
	},
	logos: {
		fillHeight: 50,
		fillWidth: 300,
		format: ImageFormat.Png,
	},
	playerArtwork: {
		height: 1000,
		width: 1000,
		format: ImageFormat.Jpg,
	},
}

export default QueryConfig

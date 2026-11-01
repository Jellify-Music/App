import { QueryKeys } from '../../enums/query-keys'
import { getLibrary, getUser } from '../../stores/auth/utils'
import { CarPlay, ListTemplate } from 'react-native-carplay'
import uuid from 'react-native-uuid'
import { SuggestionQueryKeys } from '../../api/queries/suggestions/keys'
import {
	ensureDiscoverAlbumsQueryData,
	ensureDiscoverArtistsQueryData,
} from '../../api/queries/suggestions/queries'
import ArtistsTemplate from './Artists'
import TracksTemplate from './Tracks'
import { ensureRecentlyAddedQueryData } from '../../api/queries/album/queries'

const CarPlayDiscover = new ListTemplate({
	id: uuid.v4(),
	tabTitle: 'Discover',
	tabSystemImageName: 'globe',
	sections: [
		{
			header: 'Discover',
			items: [
				{ id: QueryKeys.RecentlyAdded, text: 'Recently Added' },
				{ id: SuggestionQueryKeys.InfiniteArtistSuggestions, text: 'Artists for You' },
				{ id: SuggestionQueryKeys.InfiniteAlbumSuggestions, text: 'More from the Vault' },
			],
		},
	],

	onItemSelect: async ({ index }) => {
		const user = getUser()
		const library = getLibrary()

		switch (index) {
			case 0: {
				// Recently Added
				const recentlyAdded = await ensureRecentlyAddedQueryData()

				CarPlay.pushTemplate(TracksTemplate(recentlyAdded, 'Recently Added'), true)
				break
			}

			case 1: {
				// Suggested Artists
				const suggestedArtists = await ensureDiscoverArtistsQueryData(user, library)

				CarPlay.pushTemplate(ArtistsTemplate(suggestedArtists), true)
				break
			}

			case 2: {
				// Suggested Albums
				const suggestedAlbums = await ensureDiscoverAlbumsQueryData(user, library)

				CarPlay.pushTemplate(TracksTemplate(suggestedAlbums, 'More from the Vault'), true)
				break
			}
		}
	},
})

export default CarPlayDiscover

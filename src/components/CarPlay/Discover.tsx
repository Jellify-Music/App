import { QueryKeys } from '../../enums/query-keys'
import { getLibrary, getUser } from '../../stores'
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
				{ id: SuggestionQueryKeys.InfiniteArtistSuggestions, text: 'Suggested Artists' },
				{ id: SuggestionQueryKeys.InfiniteAlbumSuggestions, text: 'Suggested Albums' },
			],
		},
	],

	onItemSelect: async ({ index }) => {
		const user = getUser()
		const library = getLibrary()

		switch (index) {
			case 0: {
				// Recently Added
				const { pages: recentlyAddedPages } = await ensureRecentlyAddedQueryData()

				CarPlay.pushTemplate(
					TracksTemplate(recentlyAddedPages.flat(), 'Recently Added'),
					true,
				)
				break
			}

			case 1: {
				// Suggested Artists
				const { pages: suggestedArtistsPages } = await ensureDiscoverArtistsQueryData(
					user,
					library,
				)

				CarPlay.pushTemplate(ArtistsTemplate(suggestedArtistsPages.flat()), true)
				break
			}

			case 2: {
				// Suggested Albums
				const { pages: suggestedAlbumsPages } = await ensureDiscoverAlbumsQueryData(
					user,
					library,
				)

				CarPlay.pushTemplate(
					TracksTemplate(suggestedAlbumsPages.flat(), 'More from the Vault'),
					true,
				)
				break
			}
		}
	},
})

export default CarPlayDiscover

import { QueryKeys } from '../../enums/query-keys'
import { CarPlay, ListTemplate } from 'react-native-carplay'
import { queryClient } from '../../constants/query-client'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import TracksTemplate from './Tracks'
import ArtistsTemplate from './Artists'
import uuid from 'react-native-uuid'
import { InfiniteData } from '@tanstack/react-query'
import {
	RecentlyPlayedArtistsQueryKey,
	RecentlyPlayedTracksQueryKey,
} from '../../api/queries/recents/keys'
import {
	FrequentlyPlayedArtistsQueryKey,
	FrequentlyPlayedTracksQueryKey,
} from '../../api/queries/frequents/keys'
import { PlayItAgainQuery } from '../../api/queries/recents'
import useJellifyStore, { getUser } from '../../stores'

const CarPlayHome = new ListTemplate({
	id: uuid.v4(),
	title: 'Home',
	tabTitle: 'Home',
	tabSystemImageName: 'music.house.fill',
	sections: [
		{
			header: 'Recents',
			items: [
				{ id: QueryKeys.RecentlyPlayedArtists, text: 'Recent Artists' },
				{ id: QueryKeys.RecentlyPlayed, text: 'Play it again' },
			],
		},
		{
			header: 'Frequents',
			items: [
				{ id: QueryKeys.FrequentArtists, text: 'Most Played' },
				{ id: QueryKeys.FrequentlyPlayed, text: 'On Repeat' },
			],
		},
	],
	onItemSelect: async ({ index }) => {
		const user = getUser()
		const library = useJellifyStore.getState().library

		switch (index) {
			case 0: {
				// Recent Artists
				const artists = queryClient.getQueryData<InfiniteData<BaseItemDto[], unknown>>(
					RecentlyPlayedArtistsQueryKey(user, library),
				) ?? { pages: [], pageParams: [] }
				CarPlay.pushTemplate(ArtistsTemplate(artists.pages.flat()), true)
				break
			}

			case 1: {
				// Recent Tracks
				await queryClient.ensureInfiniteQueryData(PlayItAgainQuery(library))

				const items = queryClient.getQueryData<InfiniteData<BaseItemDto[], unknown>>(
					RecentlyPlayedTracksQueryKey(user, library),
				) ?? { pages: [], pageParams: [] }

				CarPlay.pushTemplate(TracksTemplate(items.pages.flat(), 'Recently Played'), true)
				break
			}

			case 2: {
				// Most Played Artists
				const artists = queryClient.getQueryData<InfiniteData<BaseItemDto[], unknown>>(
					FrequentlyPlayedArtistsQueryKey(user, library),
				) ?? { pages: [], pageParams: [] }
				CarPlay.pushTemplate(ArtistsTemplate(artists.pages.flat()), true)
				break
			}

			case 3: {
				// On Repeat
				const items = queryClient.getQueryData<InfiniteData<BaseItemDto[], unknown>>(
					FrequentlyPlayedTracksQueryKey(user, library),
				) ?? { pages: [], pageParams: [] }
				CarPlay.pushTemplate(TracksTemplate(items.pages.flat(), 'On Repeat'), true)
				break
			}
		}
	},
})

export default CarPlayHome

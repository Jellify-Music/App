import { QueryKeys } from '../../enums/query-keys'
import { CarPlay, ListTemplate } from 'react-native-carplay'
import { queryClient } from '../../constants/query-client'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import TracksTemplate from './Tracks'
import ArtistsTemplate from './Artists'
import uuid from 'react-native-uuid'
import { JellifyUser } from '../../types/JellifyUser'
import { InfiniteData } from '@tanstack/react-query'
import { QueueMutation } from '../../providers/Player/interfaces'

const CarPlayHome = (user: JellifyUser, loadQueue: (mutation: QueueMutation) => void) =>
	new ListTemplate({
		id: uuid.v4(),
		title: 'Home',
		tabTitle: 'Home',
		tabSystemImageName: 'music.house.fill',
		sections: [
			{
				header: `Hi ${user.name}`,
				items: [],
			},
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
			console.debug(`Home item selected`)

			switch (index) {
				case 0: {
					// Recent Artists
					const artists = queryClient.getQueryData<InfiniteData<BaseItemDto[], unknown>>([
						QueryKeys.RecentlyPlayedArtists,
					]) ?? { pages: [], pageParams: [] }
					CarPlay.pushTemplate(ArtistsTemplate(artists.pages.flat()))
					break
				}

				case 1: {
					// Recent Tracks
					const items = queryClient.getQueryData<InfiniteData<BaseItemDto[], unknown>>([
						QueryKeys.RecentlyPlayed,
					]) ?? { pages: [], pageParams: [] }
					CarPlay.pushTemplate(
						TracksTemplate(items.pages.flat(), loadQueue, 'Recently Played'),
					)
					break
				}

				case 2: {
					// Most Played Artists
					const artists = queryClient.getQueryData<InfiniteData<BaseItemDto[], unknown>>([
						QueryKeys.FrequentArtists,
					]) ?? { pages: [], pageParams: [] }
					CarPlay.pushTemplate(ArtistsTemplate(artists.pages.flat()))
					break
				}

				case 3: {
					// On Repeat
					const items = queryClient.getQueryData<InfiniteData<BaseItemDto[], unknown>>([
						QueryKeys.FrequentlyPlayed,
					]) ?? { pages: [], pageParams: [] }
					CarPlay.pushTemplate(TracksTemplate(items.pages.flat(), loadQueue, 'On Repeat'))
					break
				}
			}
		},
	})

export default CarPlayHome

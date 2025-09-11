import { QueryKeys } from '../../enums/query-keys'
import { CarPlay, ListTemplate } from 'react-native-carplay'
import { queryClient } from '../../constants/query-client'
import { BaseItemDto, DeviceProfile } from '@jellyfin/sdk/lib/generated-client/models'
import TracksTemplate from './Tracks'
import ArtistsTemplate from './Artists'
import uuid from 'react-native-uuid'
import { InfiniteData } from '@tanstack/react-query'
import { QueueMutation } from '../../providers/Player/interfaces'
import { JellifyLibrary } from '../../types/JellifyLibrary'
import { Api } from '@jellyfin/sdk'
import { networkStatusTypes } from '../Network/internetConnectionWatcher'
import {
	RecentlyPlayedArtistsQueryKey,
	RecentlyPlayedTracksQueryKey,
} from '../../api/queries/recents/keys'
import { JellifyUser } from '@/src/types/JellifyUser'
import {
	FrequentlyPlayedArtistsQueryKey,
	FrequentlyPlayedTracksQueryKey,
} from '../../api/queries/frequents/keys'

const CarPlayHome = (
	library: JellifyLibrary,
	loadQueue: (mutation: QueueMutation) => void,
	api: Api | undefined,
	user: JellifyUser | undefined,
	networkStatus: networkStatusTypes | null,
	deviceProfile: DeviceProfile | undefined,
) =>
	new ListTemplate({
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
			console.debug(`Home item selected ${index}`)

			switch (index) {
				case 0: {
					// Recent Artists
					const artists = queryClient.getQueryData<InfiniteData<BaseItemDto[], unknown>>(
						RecentlyPlayedArtistsQueryKey(user, library),
					) ?? { pages: [], pageParams: [] }
					CarPlay.pushTemplate(ArtistsTemplate(artists.pages.flat()))
					break
				}

				case 1: {
					// Recent Tracks
					const items = queryClient.getQueryData<InfiniteData<BaseItemDto[], unknown>>(
						RecentlyPlayedTracksQueryKey(user, library),
					) ?? { pages: [], pageParams: [] }
					CarPlay.pushTemplate(
						TracksTemplate(
							items.pages.flat(),
							loadQueue,
							'Recently Played',
							api,
							networkStatus,
							deviceProfile,
						),
					)
					break
				}

				case 2: {
					// Most Played Artists
					const artists = queryClient.getQueryData<InfiniteData<BaseItemDto[], unknown>>(
						FrequentlyPlayedArtistsQueryKey(user, library),
					) ?? { pages: [], pageParams: [] }
					CarPlay.pushTemplate(ArtistsTemplate(artists.pages.flat()))
					break
				}

				case 3: {
					// On Repeat
					const items = queryClient.getQueryData<InfiniteData<BaseItemDto[], unknown>>(
						FrequentlyPlayedTracksQueryKey(user, library),
					) ?? { pages: [], pageParams: [] }
					CarPlay.pushTemplate(
						TracksTemplate(
							items.pages.flat(),
							loadQueue,
							'On Repeat',
							api,
							networkStatus,
							deviceProfile,
						),
					)
					break
				}
			}
		},
	})

export default CarPlayHome

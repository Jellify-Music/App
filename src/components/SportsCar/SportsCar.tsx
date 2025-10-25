import {
	RecentlyPlayedArtistsQueryKey,
	RecentlyPlayedTracksQueryKey,
} from '../../api/queries/recents/keys'
import { useJellifyContext } from '../../providers'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { InfiniteData, useQueryClient } from '@tanstack/react-query'
import {
	createSportsCarLibrary,
	createSportsCarItem,
	MediaLibraryConverterConfig,
} from './MediaLibraryConverter'
import { FrequentlyPlayedTracksQueryKey } from '../../api/queries/frequents/keys'
import { useEffect } from 'react'
import AndroidAuto from 'react-native-sportscar'

export const SportsCarProvider = () => {
	const queryClient = useQueryClient()
	const { user, library, api } = useJellifyContext()
	const recentlyPlayedItems = queryClient.getQueryData<InfiniteData<BaseItemDto[], unknown>>(
		RecentlyPlayedTracksQueryKey(user, library),
	) ?? { pages: [], pageParams: [] }
	const config: MediaLibraryConverterConfig = {
		appName: 'Jellify',
		defaultLayoutType: 'list',
		includeMetadata: true,
		api: api,
	}

	useEffect(() => {
		const recentlyPlayedMediaItem = createSportsCarItem(
			{
				name: 'Recently Played',
				items: recentlyPlayedItems.pages.flat().slice(0, 10),
				layoutType: 'grid',
				iconUrl:
					'https://toppng.com/uploads/preview/logo-de-youtube-pmg-11549681326zkasm44fbe.png',
			},
			config,
			'Recently Played',
			'recently_played_root',
		)

		const frequentlyPlayedItems = queryClient.getQueryData<
			InfiniteData<BaseItemDto[], unknown>
		>(FrequentlyPlayedTracksQueryKey(user, library)) ?? { pages: [], pageParams: [] }

		const artists = queryClient.getQueryData<InfiniteData<BaseItemDto[], unknown>>(
			RecentlyPlayedArtistsQueryKey(user, library),
		) ?? { pages: [], pageParams: [] }
		console.log('SportsCarProvider artists', artists.pages.flat())

		const frequentlyPlayedMediaItem = createSportsCarItem(
			{
				name: 'Frequently Played',
				items: frequentlyPlayedItems.pages.flat().slice(0, 10),
				iconUrl:
					'https://plus.unsplash.com/premium_photo-1664474619075-644dd191935f?q=80&w=1738&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
				layoutType: 'list',
			},
			config,
			'Frequently Played',
			'frequently_played_root',
		)

		const createHomeMediaItem = createSportsCarItem(
			{
				name: 'Home',
				items: [recentlyPlayedMediaItem, frequentlyPlayedMediaItem],
				layoutType: 'grid',
			},
			config,
			'Home',
			'home_root',
		)

		const createDiscoverMediaItem = createSportsCarItem(
			{
				name: 'Discover',
				items: [frequentlyPlayedMediaItem],
				layoutType: 'grid',
			},
			config,
			'Discover',
			'discover_root',
		)

		const rootMediaLibrary = createSportsCarLibrary(
			[createHomeMediaItem, createDiscoverMediaItem],
			config,
		)
		console.log('SportsCarProvider rootMediaLibrary', rootMediaLibrary)
		AndroidAuto.initializeMediaLibrary(rootMediaLibrary)
	}, [recentlyPlayedItems, library])

	return <></>
}

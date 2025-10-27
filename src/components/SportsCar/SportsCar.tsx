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
import { useEffect, useState } from 'react'
import AndroidAuto, { MediaItem } from 'react-native-sportscar'
import { fetchArtistAlbums } from '../../api/queries/artist/utils/artist'
import { fetchAlbumDiscs } from '../../api/queries/item'
import { MMKV } from 'react-native-mmkv'
import { Spinner, View, Text, YStack } from 'tamagui'
import { Platform } from 'react-native'

const storage = new MMKV()
export const SportsCarProvider = () => {
	const [isInitializing, setIsInitializing] = useState(false)
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

	const fetchRecentlyPlayedArtistsAlbums = async (artist: BaseItemDto) => {
		const albums = await fetchArtistAlbums(api, library?.musicLibraryId, artist)
		return albums
	}

	const fetchAlbumSongs = async (album: BaseItemDto) => {
		const discs = await fetchAlbumDiscs(api, album)
		return discs.flatMap((disc) => disc.data)
	}
	const artists = queryClient.getQueryData<InfiniteData<BaseItemDto[], unknown>>(
		RecentlyPlayedArtistsQueryKey(user, library),
	) ?? { pages: [], pageParams: [] }
	const sportsCarIntializer = async () => {
		if (Platform.OS === 'ios') {
			return
		}
		setIsInitializing(true)
		try {
			if (storage.getString('rootMediaLibrary-sports-car')) {
				const rootMediaLibrary = JSON.parse(
					storage.getString('rootMediaLibrary-sports-car') ?? '',
				)
				await AndroidAuto.initializeMediaLibrary(rootMediaLibrary)
			}
			if (artists.pages.length === 0) {
				return
			}

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

			console.log('SportsCarProvider artists', artists.pages.flat())

			console.log(
				'SportsCarProvider artists.pages.flat().slice(0, 10)',
				artists.pages.flat().slice(0, 10),
			)

			console.log('SportsCarProvider albums', 'HHeee')
			const createAlbumSongsMediaItem = async (albums: BaseItemDto[]) => {
				try {
					return await Promise.all(
						albums.slice(0, 10).map(async (album) => {
							const songs = await fetchAlbumSongs(album)
							console.log('SportsCarProvider songs', songs)
							return createSportsCarItem(
								{
									name: album.Name ?? '',
									items: songs,
									layoutType: 'list',
								},
								config,
								album.Name ?? '',
								album.Id,
							)
						}),
					)
				} catch (error) {
					console.log('SportsCarProvider createAlbumSongsMediaItem error', error)
					return []
				}
			}
			console.log('SportsCarProvider createAlbumSongsMediaItem', 'HHeee')
			let artistAlbums: MediaItem[] = []
			try {
				artistAlbums = await Promise.all(
					artists.pages
						.flat()
						.slice(0, 10)
						.map(async (artist) => {
							const albums = await fetchRecentlyPlayedArtistsAlbums(artist)
							console.log('SportsCarProvider albums', albums)
							return createSportsCarItem(
								{
									name: artist.Name ?? '',
									items: await createAlbumSongsMediaItem(albums),
									layoutType: 'list',
								},
								config,
								artist.Name ?? '',
								artist.Id,
							)
						}),
				)
			} catch (error) {
				console.log('SportsCarProvider artistAlbums error', error)
				artistAlbums = []
			}
			console.log('SportsCarProvider createAlbumSongsMediaIwwwtem', 'HHeee')
			const createArtistAlbumsMediaItem = createSportsCarItem(
				{
					name: 'Artist Albums',
					items: artistAlbums,
					iconUrl:
						'https://plus.unsplash.com/premium_photo-1664474619075-644dd191935f?q=80&w=1738&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
					layoutType: 'grid',
				},
				config,
				'Artist Albums',
				'artist_albums_root',
			)
			console.log('SportsCarProvider createAlbudddmSongsMediaItem', 'HHeee')

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
					items: [
						recentlyPlayedMediaItem,
						frequentlyPlayedMediaItem,
						createArtistAlbumsMediaItem,
					],
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
			storage.set('rootMediaLibrary-sports-car', JSON.stringify(rootMediaLibrary))
			await AndroidAuto.initializeMediaLibrary(rootMediaLibrary)
		} catch (error) {
			console.log('SportsCarProvider initialization error', error)
		} finally {
			setIsInitializing(false)
		}
	}

	useEffect(() => {
		sportsCarIntializer()
	}, [recentlyPlayedItems, library, artists])

	if (isInitializing) {
		return (
			<View
				position='absolute'
				top={0}
				left={0}
				right={0}
				bottom={0}
				backgroundColor='rgba(0,0,0,0.5)'
				justifyContent='center'
				alignItems='center'
				zIndex={1000}
			>
				<YStack
					alignItems='center'
					gap='$4'
					backgroundColor='$background'
					padding='$6'
					borderRadius='$4'
				>
					<Spinner size='large' color='$primary' />
					<Text fontSize='$4' color='$color' textAlign='center'>
						Initializing Android Auto...
					</Text>
				</YStack>
			</View>
		)
	}

	return <></>
}

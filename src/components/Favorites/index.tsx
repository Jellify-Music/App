import React, { useState } from 'react'
import { View } from 'react-native'
import { YStack } from 'tamagui'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import FavoritesStackParamList from '../../screens/Favorites/types'

import Artists from '../Artists/component'
import Albums from '../Albums/component'
import Tracks from '../Tracks/component'
import Playlists from '../Playlists/component'

import { useAlbumArtists } from '../../api/queries/artist'
import useAlbums from '../../api/queries/album'
import useTracks from '../../api/queries/track'
import { useUserPlaylists } from '../../api/queries/playlist'
import SegmentedControl from '../Global/helpers/segmented-control'

type FavoritesTab = 'Artists' | 'Albums' | 'Tracks' | 'Playlists'

const TABS: FavoritesTab[] = ['Artists', 'Albums', 'Tracks', 'Playlists']

export interface FavoritesProps {
	navigation: NativeStackNavigationProp<FavoritesStackParamList, 'SearchScreen'>
}

function FavoritesArtists() {
	const [artistPageParams, artistsInfiniteQuery] = useAlbumArtists(undefined, true)

	return (
		<View style={{ flex: 1 }}>
			<Artists
				artistsInfiniteQuery={artistsInfiniteQuery}
				showAlphabeticalSelector={true}
				artistPageParams={artistPageParams}
			/>
		</View>
	)
}

function FavoritesAlbums() {
	const [albumPageParams, albumsInfiniteQuery] = useAlbums(undefined, true)

	return (
		<View style={{ flex: 1 }}>
			<Albums
				albumsInfiniteQuery={albumsInfiniteQuery}
				showAlphabeticalSelector={true}
				albumPageParams={albumPageParams}
			/>
		</View>
	)
}

function FavoritesTracks({
	navigation,
}: {
	navigation: NativeStackNavigationProp<FavoritesStackParamList, 'SearchScreen'>
}) {
	const [trackPageParams, tracksInfiniteQuery] = useTracks(
		undefined, // artistId
		undefined, // sortBy
		undefined, // sortOrder
		true, // isFavorites
		undefined, // searchTerm
	)

	return (
		<View style={{ flex: 1 }}>
			<Tracks
				navigation={navigation}
				tracksInfiniteQuery={tracksInfiniteQuery}
				queue='Favorite Tracks'
				showAlphabeticalSelector={true}
				trackPageParams={trackPageParams}
			/>
		</View>
	)
}

function FavoritesPlaylists() {
	const playlistsInfiniteQuery = useUserPlaylists(undefined)

	return (
		<View style={{ flex: 1 }}>
			<Playlists
				playlists={playlistsInfiniteQuery.data}
				refetch={playlistsInfiniteQuery.refetch}
				fetchNextPage={playlistsInfiniteQuery.fetchNextPage}
				hasNextPage={playlistsInfiniteQuery.hasNextPage}
				isPending={playlistsInfiniteQuery.isPending}
				isFetchingNextPage={playlistsInfiniteQuery.isFetchingNextPage}
			/>
		</View>
	)
}

export default function Favorites({ navigation }: FavoritesProps): React.JSX.Element {
	const [selectedTab, setSelectedTab] = useState<FavoritesTab>('Artists')

	const renderContent = () => {
		switch (selectedTab) {
			case 'Artists':
				return <FavoritesArtists />
			case 'Albums':
				return <FavoritesAlbums />
			case 'Tracks':
				return <FavoritesTracks navigation={navigation} />
			case 'Playlists':
				return <FavoritesPlaylists />
		}
	}

	return (
		<YStack flex={1}>
			<YStack paddingHorizontal={'$2'} paddingTop={'$2'}>
				<SegmentedControl
					values={TABS}
					selectedIndex={TABS.indexOf(selectedTab)}
					onChange={(index) => setSelectedTab(TABS[index]!)}
				/>
			</YStack>

			{renderContent()}
		</YStack>
	)
}

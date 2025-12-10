import React, { useState } from 'react'
import Input from '../Global/helpers/input'
import { Text } from '../Global/helpers/text'
import ItemRow from '../Global/components/item-row'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { FlatList, View } from 'react-native'
import { getToken, H3, Separator, Spinner, YStack } from 'tamagui'
import Suggestions from './suggestions'
import { isEmpty, trim } from 'lodash'
import HorizontalCardList from '../Global/components/horizontal-list'
import { ItemCard } from '../Global/components/item-card'
import SearchParamList from '../../screens/Search/types'
import { closeAllSwipeableRows } from '../Global/components/swipeable-row-registry'
import { useSearchSuggestions } from '../../api/queries/suggestions'
import SearchFilterChips from './search-filter-chips'
import useSearchStore from '../../stores/search'
import { useAlbumArtists } from '../../api/queries/artist'
import useAlbums from '../../api/queries/album'
import useTracks from '../../api/queries/track'
import { useUserPlaylists } from '../../api/queries/playlist'
import Artists from '../Artists/component'
import Albums from '../Albums/component'
import Tracks from '../Tracks/component'
import Playlists from '../Playlists/component'

export default function Search({
	navigation,
}: {
	navigation: NativeStackNavigationProp<SearchParamList, 'SearchScreen'>
}): React.JSX.Element {
	const [searchString, setSearchString] = useState<string | undefined>(undefined)
	const trimmedSearch = searchString ? trim(searchString) : undefined
	const hasSearchQuery = !isEmpty(trimmedSearch)

	const selectedFilter = useSearchStore((state) => state.selectedFilter)
	const isFavorites = useSearchStore((state) => state.isFavorites)
	const isDownloaded = useSearchStore((state) => state.isDownloaded)

	// Query hooks with search term for each type
	const [artistPageParams, artistsInfiniteQuery] = useAlbumArtists(trimmedSearch)
	const [albumPageParams, albumsInfiniteQuery] = useAlbums(trimmedSearch)
	const [trackPageParams, tracksInfiniteQuery] = useTracks(
		undefined, // artistId
		undefined, // sortBy
		undefined, // sortOrder
		isFavorites ?? undefined,
		trimmedSearch,
	)
	const playlistsInfiniteQuery = useUserPlaylists(trimmedSearch)

	const { data: suggestions } = useSearchSuggestions()

	const handleSearchStringUpdate = (value: string | undefined) => {
		setSearchString(value)
	}

	const handleScrollBeginDrag = () => {
		closeAllSwipeableRows()
	}

	// Render filtered content based on selected filter
	const renderFilteredContent = () => {
		// Show suggestions when no search and "All" filter is selected
		if (!hasSearchQuery && selectedFilter === 'All') {
			return (
				<YStack flex={1} paddingHorizontal={'$2'} paddingTop={'$2'}>
					<Suggestions suggestions={suggestions} />
				</YStack>
			)
		}

		switch (selectedFilter) {
			case 'Artists':
				return (
					<View style={{ flex: 1 }}>
						<Artists
							artistsInfiniteQuery={artistsInfiniteQuery}
							showAlphabeticalSelector={!hasSearchQuery}
							artistPageParams={artistPageParams}
						/>
					</View>
				)

			case 'Albums':
				return (
					<View style={{ flex: 1 }}>
						<Albums
							albumsInfiniteQuery={albumsInfiniteQuery}
							showAlphabeticalSelector={!hasSearchQuery}
							albumPageParams={albumPageParams}
						/>
					</View>
				)

			case 'Tracks':
				return (
					<View style={{ flex: 1 }}>
						<Tracks
							navigation={navigation}
							tracksInfiniteQuery={tracksInfiniteQuery}
							queue={
								isFavorites
									? 'Favorite Tracks'
									: isDownloaded
										? 'Downloaded Tracks'
										: 'Search Results'
							}
							showAlphabeticalSelector={!hasSearchQuery}
							trackPageParams={trackPageParams}
						/>
					</View>
				)

			case 'Playlists':
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

			case 'All':
			default:
				return renderAllResults()
		}
	}

	// Render "All" results - mixed type view
	const renderAllResults = () => {
		const artists = artistsInfiniteQuery.data?.filter((item) => typeof item === 'object') ?? []
		const albums = albumsInfiniteQuery.data?.filter((item) => typeof item === 'object') ?? []
		const tracks = tracksInfiniteQuery.data?.filter((item) => typeof item === 'object') ?? []
		const playlists = playlistsInfiniteQuery.data ?? []

		const isFetching =
			artistsInfiniteQuery.isFetching ||
			albumsInfiniteQuery.isFetching ||
			tracksInfiniteQuery.isFetching ||
			playlistsInfiniteQuery.isFetching

		const hasResults =
			artists.length > 0 || albums.length > 0 || tracks.length > 0 || playlists.length > 0

		if (isFetching && !hasResults) {
			return (
				<YStack alignContent='center' justifyContent='center' marginTop={'$4'}>
					<Spinner />
				</YStack>
			)
		}

		if (hasSearchQuery && !hasResults && !isFetching) {
			return (
				<YStack
					alignItems='center'
					justifyContent='center'
					marginTop={'$8'}
					gap={'$3'}
					paddingHorizontal={'$4'}
				>
					<H3>No Results</H3>
					<Text textAlign='center'>
						{`No results found for "${searchString}". Try a different search term.`}
					</Text>
				</YStack>
			)
		}

		// Combine results for the "All" view
		const combinedResults = [
			...albums.slice(0, 10),
			...tracks.slice(0, 20),
			...playlists.slice(0, 10),
		]

		return (
			<FlatList
				contentInsetAdjustmentBehavior='automatic'
				progressViewOffset={10}
				ListHeaderComponent={
					artists.length > 0 ? (
						<YStack paddingBottom={'$2'}>
							<H3 paddingHorizontal={'$2'}>Artists</H3>
							<HorizontalCardList
								data={artists.slice(0, 10)}
								testID='artist-search-results'
								renderItem={({ index, item: artistResult }) => {
									if (typeof artistResult !== 'object') return null
									return (
										<ItemCard
											testID={`artist-search-result-${index}`}
											item={artistResult}
											onPress={() => {
												navigation.push('Artist', {
													artist: artistResult,
												})
											}}
											size={'$8'}
											caption={artistResult.Name ?? 'Untitled Artist'}
										/>
									)
								}}
							/>
						</YStack>
					) : null
				}
				ItemSeparatorComponent={() => <Separator />}
				data={combinedResults}
				refreshing={isFetching}
				renderItem={({ item }) => {
					if (typeof item !== 'object') return null
					return <ItemRow item={item} navigation={navigation} />
				}}
				keyExtractor={(item, index) =>
					typeof item === 'object' ? (item.Id ?? index.toString()) : index.toString()
				}
				onScrollBeginDrag={handleScrollBeginDrag}
				style={{
					marginHorizontal: getToken('$2'),
				}}
			/>
		)
	}

	return (
		<YStack flex={1}>
			<YStack paddingHorizontal={'$2'} paddingTop={'$4'}>
				<Input
					placeholder='Seek and ye shall find'
					onChangeText={(value) => handleSearchStringUpdate(value)}
					value={searchString}
					testID='search-input'
					clearButtonMode='while-editing'
				/>
				<SearchFilterChips />
			</YStack>

			{renderFilteredContent()}
		</YStack>
	)
}

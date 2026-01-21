import React, { useState } from 'react'
import Input from '../Global/helpers/input'
import ItemRow from '../Global/components/item-row'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { View } from 'react-native'
import { getToken, H3, Spinner, Text, YStack } from 'tamagui'
import Suggestions from './suggestions'
import { isEmpty, trim } from 'lodash'
import HorizontalCardList from '../Global/components/horizontal-list'
import ItemCard from '../Global/components/item-card'
import SearchParamList from '../../screens/Search/types'
import { closeAllSwipeableRows } from '../Global/components/swipeable-row-registry'
import { useSearchSuggestions } from '../../api/queries/suggestions'
import SearchFilterChips from './search-filter-chips'
import useSearchStore from '../../stores/search'
import { useAlbumArtists } from '../../api/queries/artist'
import useAlbums from '../../api/queries/album'
import useTracks from '../../api/queries/track'
import Artists from '../Artists/component'
import Albums from '../Albums/component'
import Tracks from '../Tracks/component'
import { FlashList } from '@shopify/flash-list'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import Track from '../Global/components/Track'
import { pickRandomItemFromArray } from '../../utils/parsing/random'
import { SEARCH_PLACEHOLDERS } from '../../configs/placeholder.config'

// Separate components for each filter type to avoid hooks being called when not needed

function ArtistsView({
	searchTerm,
	isFavorites,
	hasSearchQuery,
}: {
	searchTerm: string | undefined
	isFavorites: boolean | undefined
	hasSearchQuery: boolean
}) {
	const [artistPageParams, artistsInfiniteQuery] = useAlbumArtists(
		searchTerm,
		isFavorites ?? undefined,
	)

	return (
		<View style={{ flex: 1 }}>
			<Artists
				artistsInfiniteQuery={artistsInfiniteQuery}
				showAlphabeticalSelector={!hasSearchQuery}
				artistPageParams={artistPageParams}
			/>
		</View>
	)
}

function AlbumsView({
	searchTerm,
	isFavorites,
	hasSearchQuery,
}: {
	searchTerm: string | undefined
	isFavorites: boolean | undefined
	hasSearchQuery: boolean
}) {
	const [albumPageParams, albumsInfiniteQuery] = useAlbums(searchTerm, isFavorites ?? undefined)

	return (
		<View style={{ flex: 1 }}>
			<Albums
				albumsInfiniteQuery={albumsInfiniteQuery}
				showAlphabeticalSelector={!hasSearchQuery}
				albumPageParams={albumPageParams}
			/>
		</View>
	)
}

function TracksView({
	searchTerm,
	isFavorites,
	isDownloaded,
	hasSearchQuery,
	navigation,
}: {
	searchTerm: string | undefined
	isFavorites: boolean | undefined
	isDownloaded: boolean
	hasSearchQuery: boolean
	navigation: NativeStackNavigationProp<SearchParamList, 'SearchScreen'>
}) {
	const [trackPageParams, tracksInfiniteQuery] = useTracks(
		undefined, // artistId
		undefined, // sortBy
		undefined, // sortOrder
		isFavorites ?? undefined,
		searchTerm,
	)

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
							: hasSearchQuery
								? 'Search Results'
								: 'Library'
				}
				showAlphabeticalSelector={!hasSearchQuery}
				trackPageParams={trackPageParams}
			/>
		</View>
	)
}

function AllResultsView({
	searchTerm,
	isFavorites,
	navigation,
}: {
	searchTerm: string | undefined
	isFavorites: boolean | undefined
	navigation: NativeStackNavigationProp<SearchParamList, 'SearchScreen'>
}) {
	const [, artistsInfiniteQuery] = useAlbumArtists(searchTerm, isFavorites ?? undefined)
	const [, albumsInfiniteQuery] = useAlbums(searchTerm, isFavorites ?? undefined)
	const [, tracksInfiniteQuery] = useTracks(
		undefined,
		undefined,
		undefined,
		isFavorites ?? undefined,
		searchTerm,
	)

	const artists = artistsInfiniteQuery.data?.filter((item) => typeof item === 'object') ?? []
	const albums = albumsInfiniteQuery.data?.filter((item) => typeof item === 'object') ?? []
	const tracks = tracksInfiniteQuery.data?.filter((item) => typeof item === 'object') ?? []

	const isFetching =
		artistsInfiniteQuery.isFetching ||
		albumsInfiniteQuery.isFetching ||
		tracksInfiniteQuery.isFetching

	const hasResults = artists.length > 0 || albums.length > 0 || tracks.length > 0

	const hasSearchQuery = !isEmpty(searchTerm)

	if (isFetching && !hasResults) {
		return (
			<YStack alignContent='center' justifyContent='center' marginTop={'$4'} flex={1}>
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
					{`No results found for "${searchTerm}". Try a different search term.`}
				</Text>
			</YStack>
		)
	}

	// Combine results for the "All" view
	const combinedResults = [...albums.slice(0, 10), ...tracks.slice(0, 20)]

	const handleScrollBeginDrag = () => {
		closeAllSwipeableRows()
	}

	const placeholder = pickRandomItemFromArray(SEARCH_PLACEHOLDERS)

	const renderItem = ({ item, index }: { item: BaseItemDto; index: number }) =>
		item.Type === 'Audio' ? (
			<Track
				showArtwork
				queue={'Suggestions'}
				track={item}
				index={0}
				tracklist={[item]}
				navigation={navigation}
			/>
		) : (
			<ItemRow item={item} navigation={navigation} />
		)

	return (
		<FlashList
			contentContainerStyle={{
				margin: getToken('$4'),
			}}
			contentInsetAdjustmentBehavior='automatic'
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
			// @ts-expect-error - estimatedItemSize is required by FlashList but types are incorrect
			estimatedItemSize={60}
			style={{
				paddingHorizontal: getToken('$4'),
			}}
		/>
	)
}

export type SearchProps = {
	navigation: NativeStackNavigationProp<SearchParamList, 'SearchScreen'>
	forceFavorites?: boolean
}

export default function Search({ navigation, forceFavorites }: SearchProps): React.JSX.Element {
	const [searchString, setSearchString] = useState<string | undefined>(undefined)
	const trimmedSearch = searchString ? trim(searchString) : undefined
	const hasSearchQuery = !isEmpty(trimmedSearch)

	const selectedFilter = useSearchStore((state) => state.selectedFilter)
	const storeIsFavorites = useSearchStore((state) => state.isFavorites)
	const isFavorites = forceFavorites || storeIsFavorites
	const isDownloaded = useSearchStore((state) => state.isDownloaded)

	const handleSearchStringUpdate = (value: string | undefined) => {
		setSearchString(value)
	}

	// Render filtered content based on selected filter
	const renderFilteredContent = () => {
		// Show suggestions when no search and "All" filter is selected
		if (!hasSearchQuery && selectedFilter === 'All') {
			return (
				<YStack flex={1} paddingHorizontal={'$2'} paddingTop={'$2'}>
					<Suggestions />
				</YStack>
			)
		}

		switch (selectedFilter) {
			case 'Artists':
				return (
					<ArtistsView
						searchTerm={trimmedSearch}
						isFavorites={isFavorites}
						hasSearchQuery={hasSearchQuery}
					/>
				)

			case 'Albums':
				return (
					<AlbumsView
						searchTerm={trimmedSearch}
						isFavorites={isFavorites}
						hasSearchQuery={hasSearchQuery}
					/>
				)

			case 'Tracks':
				return (
					<TracksView
						searchTerm={trimmedSearch}
						isFavorites={isFavorites}
						isDownloaded={isDownloaded}
						hasSearchQuery={hasSearchQuery}
						navigation={navigation}
					/>
				)

			case 'All':
			default:
				return (
					<AllResultsView
						searchTerm={trimmedSearch}
						isFavorites={isFavorites}
						navigation={navigation}
					/>
				)
		}
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
				<SearchFilterChips forceFavorites={forceFavorites} />
			</YStack>

			{renderFilteredContent()}
		</YStack>
	)
}

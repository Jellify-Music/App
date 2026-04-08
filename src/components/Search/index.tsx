import React, { useEffect, useState } from 'react'
import Input from '../Global/helpers/input'
import { H5, Text } from '../Global/helpers/text'
import ItemRow from '../Global/components/item-row'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { getToken, H3, Spinner, YStack } from 'tamagui'
import Suggestions from './suggestions'
import { isEmpty } from 'lodash'
import HorizontalCardList from '../Global/components/horizontal-list'
import ItemCard from '../Global/components/item-card'
import SearchParamList from '../../screens/Search/types'
import { closeAllSwipeableRows } from '../Global/components/swipeable-row-registry'
import { FlashList } from '@shopify/flash-list'
import navigationRef from '../../screens/navigation'
import { StackActions } from '@react-navigation/native'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import Track from '../Global/components/Track'
import { pickRandomItemFromArray } from '../../utils/parsing/random'
import { SEARCH_PLACEHOLDERS } from '../../configs/placeholder.config'
import { formatArtistName } from '../../utils/formatting/artist-names'
import useSearchResults from '../../api/queries/search'
import MAX_ITEMS_IN_RECYCLE_POOL from '../../configs/library.config'

export default function Search({
	navigation,
}: {
	navigation: NativeStackNavigationProp<SearchParamList, 'SearchScreen'>
}): React.JSX.Element {
	/**
	 * Raw text input value from the user, updates immediately as they type
	 */
	const [inputValue, setInputValue] = useState<string | undefined>(undefined)

	/**
	 * Debounced search string that updates 500ms after the user stops typing, used to trigger the search query
	 * which is keyed off of this value for caching.
	 */
	const [searchString, setSearchString] = useState<string | undefined>(undefined)

	useEffect(() => {
		const timeout = setTimeout(() => {
			setSearchString(inputValue || undefined)
		}, 500)
		return () => clearTimeout(timeout)
	}, [inputValue])

	const { data: items, isFetching: fetchingResults } = useSearchResults(searchString)

	const handleSearchStringUpdate = (value: string | undefined) => {
		setInputValue(value || undefined)
	}

	const handleScrollBeginDrag = () => {
		closeAllSwipeableRows()
	}

	/**
	 * Pick the placeholder once per session via lazy initial state. Previously
	 * this re-randomized on every render, which made the input twitch — React
	 * Compiler can't fix that because it has to assume the random call is a
	 * fresh value each render.
	 */
	const [placeholder] = useState(() => pickRandomItemFromArray(SEARCH_PLACEHOLDERS))

	const artistResults = items?.filter((result) => result.Type === 'MusicArtist')
	const nonArtistResults = items?.filter((result) => result.Type !== 'MusicArtist')

	const renderItem = ({ item }: { item: BaseItemDto; index: number }) =>
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
				<YStack paddingTop={'$2'}>
					<Input
						placeholder={placeholder}
						onChangeText={handleSearchStringUpdate}
						value={inputValue}
						testID='search-input'
						accessibilityLabel='Search your library'
						accessibilityHint='Type to search artists, albums, playlists, and songs'
						clearButtonMode='always'
					/>

					{!isEmpty(artistResults) && (
						<YStack accessibilityLabel='Artist results'>
							<H3>Results</H3>

							<HorizontalCardList
								data={artistResults}
								testID='artist-search-results'
								renderItem={({ index, item: artistResult }) => (
									<ItemCard
										testID={`artist-search-result-${index}`}
										item={artistResult}
										onPress={() => {
											navigation.push('Artist', {
												artist: artistResult,
											})
										}}
										onLongPress={() => {
											navigationRef.dispatch(
												StackActions.push('Context', {
													item: artistResult,
												}),
											)
										}}
										size={'$8'}
										caption={formatArtistName(artistResult.Name)}
									/>
								)}
							/>
						</YStack>
					)}
				</YStack>
			}
			ListEmptyComponent={() => {
				// Show spinner while fetching
				if (fetchingResults) {
					return (
						<YStack alignContent='center' justifyContent='center' marginTop={'$4'}>
							<Spinner />
						</YStack>
					)
				}

				// Show "No Results" when user has searched but got no results
				if (!isEmpty(searchString) && isEmpty(items)) {
					return (
						<YStack
							alignItems='center'
							justifyContent='center'
							marginTop={'$8'}
							gap={'$3'}
							paddingHorizontal={'$4'}
						>
							<H5>No Results</H5>
							<Text textAlign='center'>
								{`No results found for "${searchString}". Try a different search term.`}
							</Text>
						</YStack>
					)
				}

				// Show suggestions when no search is active
				return !isEmpty(searchString) ? null : <Suggestions />
			}}
			data={nonArtistResults}
			refreshing={fetchingResults}
			renderItem={renderItem}
			keyExtractor={(item) => item.Id!}
			getItemType={(item) => (item.Type === 'Audio' ? 'song' : 'item')}
			maxItemsInRecyclePool={MAX_ITEMS_IN_RECYCLE_POOL}
			onScrollBeginDrag={handleScrollBeginDrag}
		/>
	)
}

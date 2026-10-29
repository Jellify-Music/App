import React, { useEffect, useState } from 'react'
import Input from '../Global/helpers/input'
import ItemRow from '../Global/components/item-row'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { H3, H5, SizableText, Spinner, YStack } from 'tamagui'
import Suggestions from './suggestions'
import { isEmpty } from 'lodash'
import HorizontalCardList from '../Global/components/horizontal-list'
import ItemCard from '../Global/components/Card'
import SearchParamList from '../../screens/Search/types'
import { closeAllSwipeableRows } from '../Global/components/SwipeableRow/registery'
import navigationRef from '../../screens/navigation'
import { StackActions, useNavigation } from '@react-navigation/native'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import Track from '../Global/components/Track'
import { pickRandomItemFromArray } from '../../utils/parsing/random'
import { SEARCH_PLACEHOLDERS } from '../../configs/messaging/search'
import { formatArtistName } from '../../utils/formatting/artist-names'
import useSearchResults from '../../api/queries/search'
import List from '../Global/components/Lists/utils'

export default function Search(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<SearchParamList>>()

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
			<ItemRow item={item} />
		)

	return (
		<List
			contentInsetAdjustmentBehavior='automatic'
			ListHeaderComponent={
				<YStack flex={1}>
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
						<YStack accessibilityLabel='Artist results' flex={1}>
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
										size={'10'}
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
						<YStack alignContent='center' justifyContent='center' marginTop='4'>
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
							marginTop='8'
							gap='3'
							paddingHorizontal='4'
						>
							<H5>No Results</H5>
							<SizableText fontSize='2' textAlign='center'>
								{`No results found for "${searchString}". Try a different search term.`}
							</SizableText>
						</YStack>
					)
				}

				// Show suggestions when no search is active
				return !isEmpty(searchString) ? null : <Suggestions />
			}}
			data={nonArtistResults}
			refreshing={fetchingResults}
			renderItem={renderItem}
			getItemType={(item) => (item.Type === 'Audio' ? 'song' : 'item')}
			onScrollBeginDrag={handleScrollBeginDrag}
		/>
	)
}

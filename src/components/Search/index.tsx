import React, { useState } from 'react'
import Input from '../Global/helpers/input'
import { H5, Text } from '../Global/helpers/text'
import ItemRow from '../Global/components/item-row'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { QueryKeys } from '../../enums/query-keys'
import { fetchSearchResults } from '../../api/queries/search'
import { useQuery } from '@tanstack/react-query'
import { getToken, H3, Separator, Spinner, YStack } from 'tamagui'
import Suggestions from './suggestions'
import { isEmpty } from 'lodash'
import HorizontalCardList from '../Global/components/horizontal-list'
import ItemCard from '../Global/components/item-card'
import SearchParamList from '../../screens/Search/types'
import { closeAllSwipeableRows } from '../Global/components/swipeable-row-registry'
import { useApi, useJellifyLibrary, useJellifyUser } from '../../stores'
import { useSearchSuggestions } from '../../api/queries/suggestions'
import { FlashList } from '@shopify/flash-list'
import navigationRef from '../../../navigation'
import { StackActions } from '@react-navigation/native'

export default function Search({
	navigation,
}: {
	navigation: NativeStackNavigationProp<SearchParamList, 'SearchScreen'>
}): React.JSX.Element {
	const api = useApi()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()

	const [searchString, setSearchString] = useState<string | undefined>(undefined)

	const {
		data: items,
		refetch,
		isFetching: fetchingResults,
	} = useQuery({
		queryKey: [QueryKeys.Search, library?.musicLibraryId, searchString],
		queryFn: () => fetchSearchResults(api, user, library?.musicLibraryId, searchString),
	})

	const {
		data: suggestions,
		isFetching: fetchingSuggestions,
		refetch: refetchSuggestions,
	} = useSearchSuggestions()

	const search = () => {
		let timeout: ReturnType<typeof setTimeout>

		return () => {
			clearTimeout(timeout)
			timeout = setTimeout(() => {
				refetch()
				refetchSuggestions()
			}, 1000)
		}
	}

	const handleSearchStringUpdate = (value: string | undefined) => {
		setSearchString(value)
		search()
	}

	const handleScrollBeginDrag = () => {
		closeAllSwipeableRows()
	}

	return (
		<FlashList
			contentInsetAdjustmentBehavior='automatic'
			ListHeaderComponent={
				<YStack paddingTop={'$2'}>
					<Input
						placeholder='Seek and ye shall find'
						onChangeText={(value) => handleSearchStringUpdate(value)}
						value={searchString}
						testID='search-input'
						clearButtonMode='while-editing'
					/>

					{!isEmpty(items) && (
						<YStack>
							<H3>Results</H3>

							<HorizontalCardList
								data={items?.filter((result) => result.Type === 'MusicArtist')}
								testID='artist-search-results'
								renderItem={({ index, item: artistResult }) => {
									return (
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
											caption={artistResult.Name ?? 'Untitled Artist'}
										/>
									)
								}}
							/>
						</YStack>
					)}
				</YStack>
			}
			ItemSeparatorComponent={Separator}
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
				return (
					<YStack alignContent='center' justifyContent='flex-end' marginTop={'$4'}>
						<Suggestions suggestions={suggestions} />
					</YStack>
				)
			}}
			// We're displaying artists separately so we're going to filter them out here
			data={items?.filter((result) => result.Type !== 'MusicArtist')}
			refreshing={fetchingResults}
			renderItem={({ item }) => <ItemRow item={item} navigation={navigation} />}
			onScrollBeginDrag={handleScrollBeginDrag}
			style={{
				paddingHorizontal: getToken('$4'),
			}}
		/>
	)
}

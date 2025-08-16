import React, { useCallback, useState } from 'react'
import Input from '../Global/helpers/input'
import ItemRow from '../Global/components/item-row'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../screens/types'
import { QueryKeys } from '../../enums/query-keys'
import { fetchSearchResults } from '../../api/queries/search'
import { useQuery } from '@tanstack/react-query'
import { FlatList } from 'react-native'
import { H3 } from '../Global/helpers/text'
import { fetchSearchSuggestions } from '../../api/queries/suggestions'
import { getToken, Separator, Spinner, YStack } from 'tamagui'
import Suggestions from './suggestions'
import { isEmpty } from 'lodash'
import HorizontalCardList from '../Global/components/horizontal-list'
import { ItemCard } from '../Global/components/item-card'
import { useJellifyContext } from '../../providers'
import SearchParamList from '../../screens/Search/types'
export default function Search({
	navigation,
}: {
	navigation: NativeStackNavigationProp<SearchParamList, 'SearchScreen'>
}): React.JSX.Element {
	const { api, library, user } = useJellifyContext()

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
	} = useQuery({
		queryKey: [QueryKeys.SearchSuggestions, library?.musicLibraryId],
		queryFn: () => fetchSearchSuggestions(api, user, library?.musicLibraryId),
	})

	const search = useCallback(() => {
		let timeout: ReturnType<typeof setTimeout>

		return () => {
			clearTimeout(timeout)
			timeout = setTimeout(() => {
				refetch()
				refetchSuggestions()
			}, 1000)
		}
	}, [])

	const handleSearchStringUpdate = (value: string | undefined) => {
		setSearchString(value)
		search()
	}

	return (
		<FlatList
			contentInsetAdjustmentBehavior='automatic'
			progressViewOffset={10}
			ListHeaderComponent={
				<YStack>
					<Input
						placeholder='Seek and ye shall find'
						onChangeText={(value) => handleSearchStringUpdate(value)}
						value={searchString}
						marginHorizontal={'$2'}
						testID='search-input'
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
			ItemSeparatorComponent={() => <Separator />}
			ListEmptyComponent={() => {
				return (
					<YStack alignContent='center' justifyContent='flex-end' marginTop={'$4'}>
						{fetchingResults ? <Spinner /> : <Suggestions suggestions={suggestions} />}
					</YStack>
				)
			}}
			// We're displaying artists separately so we're going to filter them out here
			data={items?.filter((result) => result.Type !== 'MusicArtist')}
			refreshing={fetchingResults}
			renderItem={({ item }) => (
				<ItemRow item={item} queueName={searchString ?? 'Search'} navigation={navigation} />
			)}
			style={{
				marginHorizontal: getToken('$2'),
				marginTop: getToken('$4'),
			}}
		/>
	)
}

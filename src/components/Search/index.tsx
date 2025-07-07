import React, { useCallback, useState } from 'react'
import Input from '../Global/helpers/input'
import ItemRow from '../Global/components/item-row'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { StackParamList } from '../types'
import { QueryKeys } from '../../enums/query-keys'
import { fetchSearchResults } from '../../api/queries/search'
import { useQuery } from '@tanstack/react-query'
import { FlatList } from 'react-native'
import { H3 } from '../Global/helpers/text'
import { fetchSearchSuggestions } from '../../api/queries/suggestions'
import { getToken, Spinner, YStack } from 'tamagui'
import Suggestions from './suggestions'
import { isEmpty } from 'lodash'
import HorizontalCardList from '../Global/components/horizontal-list'
import { ItemCard } from '../Global/components/item-card'
import { useJellifyContext } from '../../providers'
export default function Search({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const { api } = useJellifyContext()

	const [searchString, setSearchString] = useState<string | undefined>(undefined)

	const {
		data: items,
		refetch,
		isFetching: fetchingResults,
	} = useQuery({
		queryKey: [QueryKeys.Search, searchString],
		queryFn: () => fetchSearchResults(api, searchString),
	})

	const {
		data: suggestions,
		isFetching: fetchingSuggestions,
		refetch: refetchSuggestions,
	} = useQuery({
		queryKey: [QueryKeys.SearchSuggestions],
		queryFn: () => fetchSearchSuggestions(api),
	})

	const search = useCallback(() => {
		let timeout: NodeJS.Timeout

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
					/>

					{!isEmpty(items) && (
						<YStack>
							<H3>Results</H3>

							<HorizontalCardList
								data={items?.filter((result) => result.Type === 'MusicArtist')}
								renderItem={({ item: artistResult }) => {
									return (
										<ItemCard
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
			ListEmptyComponent={() => {
				return (
					<YStack alignContent='center' justifyContent='flex-end' marginTop={'$4'}>
						{fetchingResults ? (
							<Spinner />
						) : (
							<Suggestions suggestions={suggestions} navigation={navigation} />
						)}
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

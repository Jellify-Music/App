import React, { useEffect, useRef, useState } from 'react'
import { useSearchInputGesture } from '../../hooks/gestures/search'
import Input from '../Global/utils/Input'
import ItemRow from '../Global/components/item-row'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { H3, H5, SizableText, Spinner, TamaguiElement, YStack } from 'tamagui'
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
import { useTranslation } from 'react-i18next'

export default function Search(): React.JSX.Element {
	const { t } = useTranslation()

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

	const inputRef = useRef<TamaguiElement>(null)

	useSearchInputGesture({ inputRef, navigation })

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
				<YStack flex={1} paddingHorizontal='2'>
					<Input
						ref={inputRef}
						placeholder={placeholder}
						onChangeText={handleSearchStringUpdate}
						value={inputValue}
						testID='search-input'
						accessibilityLabel={t('search.inputLabel')}
						accessibilityHint={t('search.inputHint')}
						clearButtonMode='always'
					/>

					{!isEmpty(artistResults) && (
						<YStack accessibilityLabel={t('search.artistResults')} flex={1}>
							<H3>{t('search.results')}</H3>

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
								slice={false}
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
							<H5>{t('search.noResults')}</H5>
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

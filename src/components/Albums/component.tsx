import { ActivityIndicator, RefreshControl } from 'react-native'
import { getToken, Separator, XStack, YStack } from 'tamagui'
import React, { RefObject, useEffect, useRef } from 'react'
import { Text } from '../Global/helpers/text'
import { FlashList, FlashListRef, ViewToken } from '@shopify/flash-list'
import { UseInfiniteQueryResult } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import ItemRow from '../Global/components/item-row'
import { useNavigation } from '@react-navigation/native'
import LibraryStackParamList from '../../screens/Library/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { warmItemContext } from '../../hooks/use-item-context'
import { useJellifyContext } from '../../providers'
import useStreamingDeviceProfile from '../../stores/device-profile'
import AZScroller, { useAlphabetSelector } from '../Global/components/alphabetical-selector'
import { isString } from 'lodash'

interface AlbumsProps {
	albumsInfiniteQuery: UseInfiniteQueryResult<(string | number | BaseItemDto)[], Error>
	showAlphabeticalSelector: boolean
	albumPageParams?: RefObject<Set<string>>
}

export default function Albums({
	albumsInfiniteQuery,
	albumPageParams,
	showAlphabeticalSelector,
}: AlbumsProps): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>()

	const { api, user } = useJellifyContext()

	const deviceProfile = useStreamingDeviceProfile()

	const sectionListRef = useRef<FlashListRef<string | number | BaseItemDto>>(null)

	const pendingLetterRef = useRef<string | null>(null)

	const onViewableItemsChangedRef = useRef(
		({ viewableItems }: { viewableItems: ViewToken<string | number | BaseItemDto>[] }) => {
			viewableItems.forEach(({ isViewable, item }) => {
				if (isViewable && typeof item === 'object')
					warmItemContext(api, user, item, deviceProfile)
			})
		},
	)

	// Memoize expensive stickyHeaderIndices calculation to prevent unnecessary re-computations
	const stickyHeaderIndices = React.useMemo(() => {
		if (!showAlphabeticalSelector || !albumsInfiniteQuery.data) return []

		return albumsInfiniteQuery.data
			.map((album, index) => (typeof album === 'string' ? index : 0))
			.filter((value, index, indices) => indices.indexOf(value) === index)
	}, [showAlphabeticalSelector, albumsInfiniteQuery.data])

	const { mutate: alphabetSelectorMutate } = useAlphabetSelector(
		(letter) => (pendingLetterRef.current = letter.toUpperCase()),
	)

	// Effect for handling the pending alphabet selector letter
	useEffect(() => {
		if (isString(pendingLetterRef.current) && albumsInfiniteQuery.data) {
			const upperLetters = albumsInfiniteQuery.data
				.filter((item): item is string => typeof item === 'string')
				.map((letter) => letter.toUpperCase())
				.sort()

			const index = upperLetters.findIndex((letter) => letter >= pendingLetterRef.current!)

			if (index !== -1) {
				const letterToScroll = upperLetters[index]
				const scrollIndex = albumsInfiniteQuery.data.indexOf(letterToScroll)
				if (scrollIndex !== -1) {
					sectionListRef.current?.scrollToIndex({
						index: scrollIndex,
						viewPosition: 0.1,
						animated: true,
					})
				}
			} else {
				// fallback: scroll to last section
				const lastLetter = upperLetters[upperLetters.length - 1]
				const scrollIndex = albumsInfiniteQuery.data.indexOf(lastLetter)
				if (scrollIndex !== -1) {
					sectionListRef.current?.scrollToIndex({
						index: scrollIndex,
						viewPosition: 0.1,
						animated: true,
					})
				}
			}

			pendingLetterRef.current = null
		}
	}, [pendingLetterRef.current, albumsInfiniteQuery.data])

	return (
		<XStack flex={1}>
			<FlashList
				ref={sectionListRef}
				contentContainerStyle={{
					paddingTop: getToken('$1'),
				}}
				contentInsetAdjustmentBehavior='automatic'
				data={albumsInfiniteQuery.data ?? []}
				keyExtractor={(item) =>
					typeof item === 'string'
						? item
						: typeof item === 'number'
							? item.toString()
							: item.Id!
				}
				renderItem={({ index, item: album }) =>
					typeof album === 'string' ? (
						<XStack
							padding={'$2'}
							backgroundColor={'$background'}
							borderRadius={'$5'}
							borderWidth={'$1'}
							borderColor={'$borderColor'}
							margin={'$2'}
						>
							<Text>{album.toUpperCase()}</Text>
						</XStack>
					) : typeof album === 'number' ? null : typeof album === 'object' ? (
						<ItemRow
							item={album}
							queueName={album.Name ?? 'Unknown Album'}
							navigation={navigation}
						/>
					) : null
				}
				ListEmptyComponent={
					albumsInfiniteQuery.isPending ? (
						<ActivityIndicator />
					) : (
						<YStack justifyContent='center'>
							<Text>No albums</Text>
						</YStack>
					)
				}
				onEndReached={() => {
					if (albumsInfiniteQuery.hasNextPage) albumsInfiniteQuery.fetchNextPage()
				}}
				ListFooterComponent={
					albumsInfiniteQuery.isFetchingNextPage ? <ActivityIndicator /> : null
				}
				ItemSeparatorComponent={() => <Separator />}
				refreshControl={
					<RefreshControl
						refreshing={albumsInfiniteQuery.isFetching}
						onRefresh={albumsInfiniteQuery.refetch}
					/>
				}
				stickyHeaderIndices={stickyHeaderIndices}
				removeClippedSubviews
				onViewableItemsChanged={onViewableItemsChangedRef.current}
			/>

			{showAlphabeticalSelector && albumPageParams && (
				<AZScroller
					onLetterSelect={(letter) =>
						alphabetSelectorMutate({
							letter,
							infiniteQuery: albumsInfiniteQuery,
							pageParams: albumPageParams,
						})
					}
				/>
			)}
		</XStack>
	)
}

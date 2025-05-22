import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getToken, getTokens, Separator, XStack, YStack } from 'tamagui'
import { Text } from '../Global/helpers/text'
import { ActivityIndicator, RefreshControl } from 'react-native'
import { ArtistsProps } from '../types'
import Item from '../Global/components/item'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { alphabet, useLibrarySortAndFilterContext } from '../../providers/Library'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { trigger } from 'react-native-haptic-feedback'
import { FlashList } from '@shopify/flash-list'
import { useLibraryContext } from '../../providers/Library'
import { sleepify } from '../../helpers/sleep'

export default function Artists({
	artists,
	navigation,
	fetchNextPage,
	hasNextPage,
	isPending,
	isFetchingNextPage,
	showAlphabeticalSelector,
}: ArtistsProps): React.JSX.Element {
	const { width, height } = useSafeAreaFrame()

	const { artistPageParams } = useLibraryContext()

	const { isFavorites } = useLibrarySortAndFilterContext()

	const memoizedAlphabet = useMemo(() => alphabet, [])

	const sectionListRef = useRef<FlashList<string | number | BaseItemDto>>(null)

	const itemHeight = getToken('$6')

	const MemoizedItem = React.memo(Item)

	const artistsRef = useRef<(string | number | BaseItemDto)[]>(artists ?? [])

	const [refreshing, setRefreshing] = useState(false)

	const alphabeticalSelectorCallback = useCallback(async (letter: string) => {
		do {
			await sleepify(100)
			fetchNextPage()
			console.debug(
				`Alphabetical Selector Callback: ${letter}, ${artistPageParams.current.join(', ')}`,
			)
		} while (
			artistsRef.current?.indexOf(letter) === -1 ||
			!artistPageParams.current.includes(letter)
		)

		sleepify(250).then(() => {
			sectionListRef.current?.scrollToIndex({
				index:
					(artistsRef.current?.indexOf(letter) ?? 0) > -1
						? artistsRef.current!.indexOf(letter)
						: 0,
				viewPosition: 0.2,
				animated: true,
			})
		})
	}, [])

	useEffect(() => {
		console.debug(`Fetching Artist Component: ${artistPageParams.current.join(', ')}`)
	}, [artistPageParams])

	useEffect(() => {
		artistsRef.current = artists ?? []
	}, [artists])

	return (
		<XStack flex={1}>
			<FlashList
				ref={sectionListRef}
				style={{
					width: getToken('$10'),
					marginRight: getToken('$4'),
				}}
				contentContainerStyle={{
					paddingTop: getToken('$3'),
				}}
				contentInsetAdjustmentBehavior='automatic'
				extraData={isFavorites}
				keyExtractor={(item) =>
					typeof item === 'string'
						? item
						: typeof item === 'number'
							? item.toString()
							: item.Id!
				}
				ItemSeparatorComponent={() => <Separator />}
				estimatedItemSize={itemHeight}
				data={artists}
				refreshControl={<RefreshControl refreshing={isPending} />}
				renderItem={({ index, item: artist }) =>
					typeof artist === 'string' ? (
						<XStack
							padding={'$2'}
							backgroundColor={'$background'}
							borderRadius={'$5'}
							borderWidth={'$1'}
							borderColor={'$borderColor'}
							margin={'$2'}
						>
							<Text>{artist.toUpperCase()}</Text>
						</XStack>
					) : typeof artist === 'number' ? null : typeof artist === 'object' ? (
						<MemoizedItem
							item={artist}
							queueName={artist.Name ?? 'Unknown Artist'}
							navigation={navigation}
						/>
					) : null
				}
				ListEmptyComponent={
					isPending || isFetchingNextPage ? (
						<ActivityIndicator />
					) : (
						<YStack justifyContent='center'>
							<Text>No artists</Text>
						</YStack>
					)
				}
				ListFooterComponent={isPending ? <ActivityIndicator /> : null}
				stickyHeaderIndices={
					showAlphabeticalSelector
						? artists
								?.map((artist, index, artists) =>
									typeof artist === 'string' ? index : 0,
								)
								.filter((value, index, indices) => indices.indexOf(value) === index)
						: []
				}
				onEndReached={() => {
					if (hasNextPage) fetchNextPage()
				}}
				onEndReachedThreshold={0.8}
				removeClippedSubviews={false}
			/>

			{showAlphabeticalSelector && (
				<YStack
					maxWidth={'$4'}
					marginVertical={'auto'}
					minWidth={'$2'}
					width={width / 8}
					alignItems='center'
					justifyContent='center'
					flex={1}
					alignContent='center'
				>
					{memoizedAlphabet.map((letter) => (
						<Text
							height={'$1'}
							paddingHorizontal={'$4'}
							marginHorizontal={'auto'}
							textAlign='center'
							key={letter}
							bold
							color={'$borderColor'}
							fontSize={'$6'}
							onPress={() => {
								trigger('impactLight')
								alphabeticalSelectorCallback(letter)
							}}
							animation={'bouncy'}
							pressStyle={{ scale: 0.875 }}
						>
							{letter.toUpperCase()}
						</Text>
					))}
				</YStack>
			)}
		</XStack>
	)
}

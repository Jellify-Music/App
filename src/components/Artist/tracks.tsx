import React, { useState } from 'react'
import { useArtistContext } from '../../providers/Artist'
import { useArtistTracks } from '../../api/queries/artist'
import { FlashList } from '@shopify/flash-list'
import ItemRow from '../Global/components/item-row'
import { XStack, Button, Text, YStack, Spinner } from 'tamagui'
import { ItemSortBy, BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import Icon from '../Global/components/icon'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '@/src/screens/types'

export default function ArtistTracks({
	navigation,
}: {
	navigation: NativeStackNavigationProp<BaseStackParamList>
}) {
	const { artist } = useArtistContext()
	const [isFavorite, setIsFavorite] = useState(false)
	const [sortDescending, setSortDescending] = useState(false)
	const [sortBy, setSortBy] = useState<ItemSortBy>(ItemSortBy.Name)

	const { data, fetchNextPage, hasNextPage, isFetching } = useArtistTracks(
		artist,
		isFavorite,
		sortDescending,
		sortBy,
	)

	const tracks = data ?? []

	const toggleFavorite = () => setIsFavorite(!isFavorite)
	const toggleSortOrder = () => setSortDescending(!sortDescending)
	const toggleSortBy = () => {
		setSortBy((prev) => (prev === ItemSortBy.Name ? ItemSortBy.PremiereDate : ItemSortBy.Name))
	}

	return (
		<YStack flex={1} backgroundColor='$background'>
			<XStack padding='$3' gap='$3' alignItems='center'>
				<Button
					size='$3'
					circular
					icon={
						<Icon
							name={isFavorite ? 'heart' : 'heart-outline'}
							color={isFavorite ? '$danger' : '$color'}
						/>
					}
					onPress={toggleFavorite}
					backgroundColor={isFavorite ? '$red3' : '$background'}
				/>
				<Button size='$3' onPress={toggleSortBy} flex={1}>
					<Text>{sortBy === ItemSortBy.Name ? 'Name' : 'Release Date'}</Text>
				</Button>
				<Button
					size='$3'
					circular
					icon={<Icon name={sortDescending ? 'sort-descending' : 'sort-ascending'} />}
					onPress={toggleSortOrder}
				/>
			</XStack>
			<FlashList
				data={tracks}
				renderItem={({ item }) => {
					if (typeof item === 'object' && item !== null) {
						return <ItemRow item={item as BaseItemDto} navigation={navigation} />
					}
					return (
						<Text padding='$2' fontWeight='bold' backgroundColor='$background'>
							{item}
						</Text>
					)
				}}
				getItemType={(item) =>
					typeof item === 'object' && item !== null ? 'row' : 'sectionHeader'
				}
				estimatedItemSize={60}
				onEndReached={() => {
					if (hasNextPage) fetchNextPage()
				}}
				onEndReachedThreshold={0.5}
				ListFooterComponent={isFetching ? <Spinner /> : null}
				contentContainerStyle={{ paddingBottom: 100 }}
			/>
		</YStack>
	)
}

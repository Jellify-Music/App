import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { useNavigation } from '@react-navigation/native'
import { FlashList } from '@shopify/flash-list'
import { YStack, H5 } from 'tamagui'
import { ItemCard } from '../Global/components/item-card'

export default function AlbumTrackListFooter({ album }: { album: BaseItemDto }): React.JSX.Element {
	const navigation = useNavigation('Album')

	return (
		<YStack marginLeft={'$2'}>
			{album.ArtistItems && album.ArtistItems.length > 1 && (
				<>
					<H5>Featuring</H5>

					<FlashList
						data={album.ArtistItems}
						horizontal
						renderItem={({ item: artist }) => (
							<ItemCard
								size={'$8'}
								item={artist}
								caption={artist.Name ?? 'Unknown Artist'}
								onPress={() => {
									navigation.navigate('Artist', {
										artist,
									})
								}}
							/>
						)}
					/>
				</>
			)}
		</YStack>
	)
}

import DiscoverStackParamList from '../../screens/Discover/types'
import HomeStackParamList from '../../screens/Home/types'
import LibraryStackParamList from '../../screens/Library/types'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { FlashList } from '@shopify/flash-list'
import { YStack, Spinner, Text } from 'tamagui'
import ItemCard from '../Global/components/item-card'
import { useSimilarItems } from '../../api/queries/suggestions'
import HorizontalCardList from '../Global/components/horizontal-list'
import navigationRef from '../../../navigation'
import Animated, { Easing, FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'
import ItemRow from '../Global/components/item-row'
import formatArtistNames from '../../utils/formatting/artist-names'
import { Freeze } from 'react-freeze'

export default function AlbumTrackListFooter({
	album,
	freeze,
}: {
	album: BaseItemDto
	freeze: boolean
}): React.JSX.Element {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<
				HomeStackParamList | LibraryStackParamList | DiscoverStackParamList
			>
		>()

	const { data: suggestions, isPending: isLoadingSuggestions } = useSimilarItems(album)

	return (
		<Freeze freeze={freeze}>
			<YStack gap={'$3'} marginVertical={'$2'} flex={1}>
				{album.ArtistItems && album.ArtistItems.length > 1 && (
					<YStack>
						<Text marginHorizontal={'$2'} fontWeight='bold'>
							Featuring
						</Text>

						<FlashList
							data={album.ArtistItems}
							renderItem={({ item: artist }) => (
								<ItemRow
									circular
									item={artist}
									onPress={() => {
										navigation.navigate('Artist', {
											artist,
										})
									}}
									onLongPress={() => {
										navigationRef.navigate('Context', { item: artist })
									}}
								/>
							)}
						/>
					</YStack>
				)}

				{suggestions && suggestions.length > 0 && (
					<Animated.View
						entering={FadeIn.easing(Easing.in(Easing.ease))}
						exiting={FadeOut.easing(Easing.out(Easing.ease))}
						layout={LinearTransition.springify()}
						style={{ flex: 1 }}
					>
						<Text marginHorizontal={'$2'} fontWeight='bold'>
							Similar Albums
						</Text>
						<HorizontalCardList
							data={suggestions}
							renderItem={({ item: album }) => (
								<ItemCard
									size={'$8'}
									item={album}
									squared
									caption={album.Name ?? 'Unknown Album'}
									subCaption={formatArtistNames(album.Artists ?? [])}
									onPress={() => {
										navigation.push('Album', {
											album,
										})
									}}
									onLongPress={() => {
										navigationRef.navigate('Context', { item: album })
									}}
									captionAlign='left'
								/>
							)}
							ListEmptyComponent={
								<YStack alignContent='center'>
									{isLoadingSuggestions ? (
										<Spinner alignSelf='center' color={'$primary'} />
									) : (
										<Text justifyContent='center' textAlign='center'>
											No similar albums found
										</Text>
									)}
								</YStack>
							}
						/>
					</Animated.View>
				)}
			</YStack>
		</Freeze>
	)
}

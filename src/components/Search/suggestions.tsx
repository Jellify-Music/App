import ItemRow from '../Global/components/item-row'
import { Text } from '../Global/helpers/text'
import { H5, Separator, Spinner, YStack } from 'tamagui'
import ItemCard from '../Global/components/item-card'
import HorizontalCardList from '../Global/components/horizontal-list'
import { FlashList } from '@shopify/flash-list'
import SearchParamList from '../../screens/Search/types'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { closeAllSwipeableRows } from '../Global/components/swipeable-row-registry'
import Track from '../Global/components/Track'

export default function Suggestions({
	suggestions,
}: {
	suggestions: BaseItemDto[] | undefined
}): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<SearchParamList>>()
	const handleScrollBeginDrag = () => {
		closeAllSwipeableRows()
	}

	const renderItem = ({ item, index }: { item: BaseItemDto; index: number }) =>
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
			<ItemRow item={item} navigation={navigation} />
		)

	return (
		<FlashList
			// Artists are displayed in the header, so we'll filter them out here
			data={suggestions?.filter((suggestion) => suggestion.Type !== 'MusicArtist')}
			ListHeaderComponent={
				<YStack>
					<H5>Suggestions</H5>

					<HorizontalCardList
						data={suggestions?.filter(
							(suggestion) => suggestion.Type === 'MusicArtist',
						)}
						renderItem={({ item: suggestedArtist }) => {
							return (
								<ItemCard
									item={suggestedArtist}
									onPress={() => {
										navigation.push('Artist', {
											artist: suggestedArtist,
										})
									}}
									size={'$8'}
									caption={suggestedArtist.Name ?? 'Untitled Artist'}
								/>
							)
						}}
					/>
				</YStack>
			}
			ItemSeparatorComponent={() => <Separator />}
			ListEmptyComponent={
				<YStack justifyContent='center' alignContent='center'>
					<Text textAlign='center'>
						Wake now, discover that you are the eyes of the world...
					</Text>
					<Spinner color={'$primary'} />
				</YStack>
			}
			onScrollBeginDrag={handleScrollBeginDrag}
			renderItem={renderItem}
		/>
	)
}

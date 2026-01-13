import ItemRow from '../Global/components/item-row'
import { Text } from '../Global/helpers/text'
import { getTokenValue, H5, Spinner, YStack } from 'tamagui'
import ItemCard from '../Global/components/item-card'
import HorizontalCardList from '../Global/components/horizontal-list'
import { FlashList } from '@shopify/flash-list'
import SearchParamList from '../../screens/Search/types'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { closeAllSwipeableRows } from '../Global/components/swipeable-row-registry'
import Track from '../Global/components/Track'
import { useSearchSuggestions } from '../../api/queries/suggestions'
import { pickRandomItemFromArray } from '../../utils/parsing/random'
import { SEARCH_PLACEHOLDERS } from '../../configs/placeholder.config'
import { formatArtistName } from '../../utils/formatting/artist-names'

export default function Suggestions(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<SearchParamList>>()

	const { data: suggestions, isPending: fetchingSuggestions } = useSearchSuggestions()

	const handleScrollBeginDrag = () => {
		closeAllSwipeableRows()
	}

	console.debug(suggestions)

	const renderItem = ({ item }: { item: BaseItemDto }) =>
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

	const placeholder = pickRandomItemFromArray(SEARCH_PLACEHOLDERS)

	return (
		<FlashList
			// Artists are displayed in the header, so we'll filter them out here
			data={suggestions?.filter((suggestion) => suggestion.Type !== 'MusicArtist')}
			contentContainerStyle={{
				marginVertical: getTokenValue('$size.2'),
				flex: 1,
			}}
			ListHeaderComponent={
				<YStack alignItems='center'>
					<Text bold fontSize={'$6'}>
						Suggestions
					</Text>

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
									caption={formatArtistName(suggestedArtist.Name)}
								/>
							)
						}}
					/>
				</YStack>
			}
			ListEmptyComponent={
				<YStack alignContent='center' gap={'$2'} justifyContent='center'>
					<Text textAlign='center'>{placeholder}</Text>
					{fetchingSuggestions && <Spinner color={'$primary'} />}
				</YStack>
			}
			onScrollBeginDrag={handleScrollBeginDrag}
			renderItem={renderItem}
		/>
	)
}

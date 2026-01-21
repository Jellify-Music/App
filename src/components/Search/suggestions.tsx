import ItemRow from '../Global/components/item-row'
import { Text } from '../Global/helpers/text'
import { getTokenValue, Spinner, YStack } from 'tamagui'
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

interface SuggestionsHeaderProps {
	suggestions?: BaseItemDto[]
}

function SuggestionsHeader({ suggestions }: SuggestionsHeaderProps): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<SearchParamList>>()

	const suggestedArtists = suggestions?.filter((suggestion) => suggestion.Type === 'MusicArtist')

	const renderItem = ({ item: suggestedArtist }: { item: BaseItemDto }) => (
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

	return (
		<YStack>
			<Text bold fontSize={'$6'}>
				Suggestions
			</Text>

			<HorizontalCardList data={suggestedArtists} renderItem={renderItem} />
		</YStack>
	)
}

interface EmptyStateProps {
	isFetching: boolean
}

const PLACEHOLDER = pickRandomItemFromArray(SEARCH_PLACEHOLDERS)

function EmptyState({ isFetching }: EmptyStateProps): React.JSX.Element {
	return (
		<YStack alignContent='center' gap={'$2'} justifyContent='center'>
			<Text textAlign='center'>{PLACEHOLDER}</Text>
			{isFetching && <Spinner color={'$primary'} />}
		</YStack>
	)
}

export default function Suggestions(): React.JSX.Element {
	const { data: suggestions, isPending: fetchingSuggestions } = useSearchSuggestions()

	const navigation = useNavigation<NativeStackNavigationProp<SearchParamList>>()

	const handleScrollBeginDrag = () => {
		closeAllSwipeableRows()
	}

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

	const filteredSuggestions = suggestions?.filter(
		(suggestion) => suggestion.Type !== 'MusicArtist',
	)

	return (
		<FlashList
			// Artists are displayed in the header, so we'll filter them out here
			data={filteredSuggestions}
			contentContainerStyle={{
				marginVertical: getTokenValue('$size.2'),
				flex: 1,
			}}
			ListHeaderComponent={<SuggestionsHeader suggestions={suggestions} />}
			ListEmptyComponent={<EmptyState isFetching={fetchingSuggestions} />}
			onScrollBeginDrag={handleScrollBeginDrag}
			renderItem={renderItem}
		/>
	)
}

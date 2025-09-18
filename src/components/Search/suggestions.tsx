import ItemRow from '../Global/components/item-row'
import { Text } from '../Global/helpers/text'
import { H3, Separator, YStack } from 'tamagui'
import { ItemCard } from '../Global/components/item-card'
import HorizontalCardList from '../Global/components/horizontal-list'
import { FlashList } from '@shopify/flash-list'
import SearchParamList from '../../screens/Search/types'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

export default function Suggestions({
	suggestions,
}: {
	suggestions: BaseItemDto[] | undefined
}): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<SearchParamList>>()

	return (
		<FlashList
			// Artists are displayed in the header, so we'll filter them out here
			data={suggestions?.filter((suggestion) => suggestion.Type !== 'MusicArtist')}
			ListHeaderComponent={
				<YStack>
					<H3>Suggestions</H3>

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
				<Text textAlign='center'>
					Wake now, discover that you are the eyes of the world...
				</Text>
			}
			renderItem={({ item }) => {
				return <ItemRow item={item} queueName={'Suggestions'} navigation={navigation} />
			}}
			style={{
				marginHorizontal: 2,
			}}
		/>
	)
}

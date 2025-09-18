import { ItemCard } from '../Global/components/item-card'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '../../screens/types'
import { useNavigation } from '@react-navigation/native'
import { Text } from '../Global/helpers/text'
import { useArtistContext } from '../../providers/Artist'
import { ActivityIndicator } from 'react-native'
import navigationRef from '../../../navigation'
import HorizontalCardList from '../Global/components/horizontal-list'
import { H6, YStack } from 'tamagui'

export default function SimilarArtists(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<BaseStackParamList>>()
	const { artist, similarArtists, fetchingSimilarArtists } = useArtistContext()

	return (
		<YStack flex={1}>
			<Text
				padding={'$3'}
				fontSize={'$6'}
				bold
			>{`Similar to ${artist.Name ?? 'Unknown Artist'}`}</Text>

			<HorizontalCardList
				data={similarArtists}
				renderItem={({ item: artist }) => (
					<ItemCard
						caption={artist.Name ?? 'Unknown Artist'}
						size={'$8'}
						item={artist}
						onPress={() => {
							navigation.push('Artist', {
								artist,
							})
						}}
						onLongPress={() => {
							navigationRef.navigate('Context', {
								item: artist,
								navigation,
							})
						}}
					/>
				)}
				ListEmptyComponent={
					fetchingSimilarArtists ? (
						<ActivityIndicator />
					) : (
						<Text justify={'center'} textAlign='center'>
							No similar artists
						</Text>
					)
				}
				removeClippedSubviews
			/>
		</YStack>
	)
}

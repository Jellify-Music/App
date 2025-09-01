import { ItemCard } from '../Global/components/item-card'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '../../screens/types'
import { useNavigation } from '@react-navigation/native'
import { Text } from '../Global/helpers/text'
import { useArtistContext } from '../../providers/Artist'
import Animated, { useAnimatedScrollHandler } from 'react-native-reanimated'
import { ActivityIndicator } from 'react-native'
import navigationRef from '../../../navigation'

export default function SimilarArtists(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<BaseStackParamList>>()
	const { similarArtists, fetchingSimilarArtists, scroll } = useArtistContext()
	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			'worklet'
			scroll.value = event.contentOffset.y
		},
	})
	return (
		<Animated.FlatList
			contentContainerStyle={{
				flexGrow: 1,
				justifyContent: 'flex-start',
				alignSelf: 'center',
			}}
			data={similarArtists}
			numColumns={2}
			renderItem={({ item: artist }) => (
				<ItemCard
					caption={artist.Name ?? 'Unknown Artist'}
					size={'$14'}
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
			onScroll={scrollHandler}
			removeClippedSubviews
		/>
	)
}

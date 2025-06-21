import { ItemCard } from '../Global/components/item-card'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { StackParamList } from '../types'
import { RouteProp } from '@react-navigation/native'
import { Text } from '../Global/helpers/text'
import { useArtistContext } from '../../providers/Artist'
import Animated, { useAnimatedScrollHandler } from 'react-native-reanimated'
import { ActivityIndicator } from 'react-native'

export default function SimilarArtists({
	route,
	navigation,
}: {
	route: RouteProp<StackParamList, 'SimilarArtists'>
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
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
		/>
	)
}

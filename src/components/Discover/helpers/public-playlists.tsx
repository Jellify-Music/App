import { H5, XStack } from 'tamagui'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Icon from '../../Global/components/icon'
import HorizontalCardList from '../../Global/components/horizontal-list'
import { ItemCard } from '../../Global/components/item-card'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import DiscoverStackParamList from '../../../screens/Discover/types'
import navigationRef from '../../../../navigation'
import { useJellifyServer } from '../../../stores'
import { usePublicPlaylists } from '../../../api/queries/playlist'
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated'

export default function PublicPlaylists() {
	const {
		data: playlists,
		fetchNextPage,
		hasNextPage,
		isPending,
		isFetchingNextPage,
		refetch,
	} = usePublicPlaylists()

	const navigation = useNavigation<NativeStackNavigationProp<DiscoverStackParamList>>()

	const [server] = useJellifyServer()
	const { width } = useSafeAreaFrame()
	return (
		playlists && (
			<Animated.View
				entering={FadeIn.springify()}
				exiting={FadeIn.springify()}
				layout={LinearTransition.springify()}
				testID='discover-public-playlists'
			>
				<XStack
					alignItems='center'
					onPress={() => {
						navigation.navigate('PublicPlaylists', {
							playlists,
							navigation: navigation,
							fetchNextPage,
							hasNextPage,
							isPending,
							isFetchingNextPage,
							refetch,
						})
					}}
				>
					<H5 marginLeft={'$2'} lineBreakStrategyIOS='standard' maxWidth={width * 0.8}>
						Playlists on {server?.name ?? 'Jellyfin'}
					</H5>
					<Icon name='arrow-right' />
				</XStack>
				<HorizontalCardList
					data={playlists?.slice(0, 10) ?? []}
					renderItem={({ item }) => (
						<ItemCard
							caption={item.Name}
							subCaption={`${item.Genres?.join(', ')}`}
							squared
							size={'$10'}
							item={item}
							onPress={() => {
								navigation.navigate('Playlist', { playlist: item, canEdit: false })
							}}
							onLongPress={() =>
								navigationRef.navigate('Context', {
									item,
									navigation,
								})
							}
							marginHorizontal={'$1'}
							captionAlign='left'
						/>
					)}
				/>
			</Animated.View>
		)
	)
}

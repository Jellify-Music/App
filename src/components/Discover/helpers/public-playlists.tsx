import { H4, H5, XStack } from 'tamagui'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Icon from '../../Global/components/icon'
import HorizontalCardList from '../../Global/components/horizontal-list'
import ItemCard from '../../Global/components/Card'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import DiscoverStackParamList from '../../../screens/Discover/types'
import navigationRef from '../../../screens/navigation'
import { useJellifyServer } from '../../../stores/auth'
import { usePublicPlaylists } from '../../../api/queries/playlist'
import AnimatedRow from '../../Global/helpers/Animated/row'
import { useDisplayContext } from '../../../providers/Display/display-provider'

export default function PublicPlaylists(): React.JSX.Element {
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

	const publicPlaylistsExist = playlists && playlists.length > 0

	const { horizontalItems } = useDisplayContext()

	return publicPlaylistsExist ? (
		<AnimatedRow testID='discover-public-playlists'>
			<XStack
				alignItems='center'
				onPress={() => {
					navigation.navigate('PublicPlaylists', {
						playlists,
						fetchNextPage,
						hasNextPage,
						isPending,
						isFetchingNextPage,
						refetch,
					})
				}}
			>
				<H4 marginLeft='2' maxWidth={width * 0.8} lineBreakStrategyIOS='standard'>
					Playlists on {server?.name ?? 'Jellyfin'}
				</H4>
				<Icon name='arrow-right' />
			</XStack>
			<HorizontalCardList
				data={playlists?.slice(0, horizontalItems)}
				renderItem={({ item }) => (
					<ItemCard
						caption={item.Name}
						subCaption={`${item.Genres?.join(', ')}`}
						squared
						size={'8'}
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
						captionAlign='left'
					/>
				)}
			/>
		</AnimatedRow>
	) : (
		<></>
	)
}

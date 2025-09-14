import { View, XStack } from 'tamagui'
import { useDiscoverContext } from '../../../providers/Discover'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Icon from '../../Global/components/icon'
import { useJellifyContext } from '../../../providers'
import HorizontalCardList from '../../Global/components/horizontal-list'
import { ItemCard } from '../../Global/components/item-card'
import { H4 } from '../../Global/helpers/text'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import DiscoverStackParamList from '../../../screens/Discover/types'
import navigationRef from '../../../../navigation'

export default function PublicPlaylists() {
	const {
		publicPlaylists,
		fetchNextPublicPlaylists,
		hasNextPublicPlaylists,
		isFetchingNextPublicPlaylists,
		isPendingPublicPlaylists,
		refetchPublicPlaylists,
	} = useDiscoverContext()

	const navigation = useNavigation<NativeStackNavigationProp<DiscoverStackParamList>>()

	const { server } = useJellifyContext()
	const { width } = useSafeAreaFrame()
	return (
		<View>
			<XStack
				alignItems='center'
				onPress={() => {
					navigation.navigate('PublicPlaylists', {
						playlists: publicPlaylists,
						navigation: navigation,
						fetchNextPage: fetchNextPublicPlaylists,
						hasNextPage: hasNextPublicPlaylists,
						isPending: isPendingPublicPlaylists,
						isFetchingNextPage: isFetchingNextPublicPlaylists,
						refetch: refetchPublicPlaylists,
					})
				}}
			>
				<H4 marginLeft={'$2'} lineBreakStrategyIOS='standard' maxWidth={width * 0.8}>
					Playlists on {server?.name ?? 'Jellyfin'}
				</H4>
				<Icon name='arrow-right' />
			</XStack>
			<HorizontalCardList
				data={publicPlaylists?.slice(0, 10) ?? []}
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
					/>
				)}
			/>
		</View>
	)
}

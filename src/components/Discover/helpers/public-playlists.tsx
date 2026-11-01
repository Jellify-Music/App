import { H4, XStack } from 'tamagui'
import { usePublicServerInfo } from '../../../api/queries/public-server-info'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Icon from '../../Global/components/icon'
import HorizontalCardList from '../../Global/components/horizontal-list'
import ItemCard from '../../Global/components/Card'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import DiscoverStackParamList from '../../../screens/Discover/types'
import navigationRef from '../../../screens/navigation'
import { usePublicPlaylists } from '../../../api/queries/playlist'
import AnimatedRow from '../../Global/helpers/animated-row'

export default function PublicPlaylists(): React.JSX.Element {
	const result = usePublicPlaylists()

	const navigation = useNavigation<NativeStackNavigationProp<DiscoverStackParamList>>()

	const { data: server } = usePublicServerInfo()

	const { width } = useSafeAreaFrame()

	const publicPlaylistsExist = result.data && result.data.length > 0

	return publicPlaylistsExist ? (
		<AnimatedRow testID='discover-public-playlists'>
			<XStack
				alignItems='center'
				onPress={() => {
					navigation.navigate('PublicPlaylists')
				}}
			>
				<H4 marginLeft='2' maxWidth={width * 0.8} lineBreakStrategyIOS='standard'>
					Playlists on {server?.ServerName ?? 'Jellyfin'}
				</H4>
				<Icon name='arrow-right' />
			</XStack>
			<HorizontalCardList
				data={result.data}
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

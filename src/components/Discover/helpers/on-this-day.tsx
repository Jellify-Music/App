import { useNavigation } from '@react-navigation/native'
import { useAlbumsOnThisDay } from '../../../api/queries/album'
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'
import { H5, XStack } from 'tamagui'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import DiscoverStackParamList from '@/src/screens/Discover/types'
import Icon from '../../Global/components/icon'
import HorizontalCardList from '../../Global/components/horizontal-list'
import { ItemCard } from '../../Global/components/item-card'
import navigationRef from '../../../../navigation'

export default function OnThisDay(): React.JSX.Element | null {
	const { data: albumsOnThisDay } = useAlbumsOnThisDay()

	const albumsOnThisDayExist = albumsOnThisDay && albumsOnThisDay.length > 0

	const navigation = useNavigation<NativeStackNavigationProp<DiscoverStackParamList>>()

	return albumsOnThisDayExist ? (
		<Animated.View
			entering={FadeIn.springify()}
			exiting={FadeOut.springify()}
			layout={LinearTransition.springify()}
			testID='discover-public-playlists'
			style={{
				flex: 1,
			}}
		>
			<XStack alignItems='center'>
				<H5 marginLeft={'$2'} lineBreakStrategyIOS='standard'>
					On this day
				</H5>
				<Icon name='arrow-right' />
			</XStack>
			<HorizontalCardList
				data={albumsOnThisDay.slice(0, 10) ?? []}
				renderItem={({ item }) => (
					<ItemCard
						caption={item.Name}
						subCaption={`${item.Artists?.join(', ')}`}
						squared
						size={'$11'}
						item={item}
						onPress={() => {
							navigation.navigate('Album', {
								album: item,
							})
						}}
						onLongPress={() => {
							navigationRef.navigate('Context', {
								item,
								navigation,
							})
						}}
						marginHorizontal={'$1'}
						captionAlign='left'
					/>
				)}
			/>
		</Animated.View>
	) : null
}

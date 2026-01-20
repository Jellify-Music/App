import React from 'react'
import { H5, XStack } from 'tamagui'
import ItemCard from '../../Global/components/item-card'
import { RootStackParamList } from '../../../screens/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { QueuingType } from '../../../enums/queuing-type'
import HorizontalCardList from '../../../components/Global/components/horizontal-list'
import Icon from '../../Global/components/icon'
import { useLoadNewQueue } from '../../../hooks/player/callbacks'
import { useDisplayContext } from '../../../providers/Display/display-provider'
import { useNavigation } from '@react-navigation/native'
import HomeStackParamList from '../../../screens/Home/types'
import { useRecentlyPlayedTracks } from '../../../api/queries/recents'
import Animated, { Easing, FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'
import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client'

export default function RecentlyPlayed(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>()
	const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const loadNewQueue = useLoadNewQueue()

	const tracksInfiniteQuery = useRecentlyPlayedTracks()

	const { horizontalItems } = useDisplayContext()

	const tracks = tracksInfiniteQuery.data?.filter(({ Type }) => Type === BaseItemKind.Audio)

	const handleItemPress = (recentItem: BaseItemDto, index: number) => {
		if (recentItem.Type === BaseItemKind.Audio)
			loadNewQueue({
				track: recentItem,
				index: tracks?.indexOf(recentItem),
				tracklist: tracks ?? [recentItem],
				queue: 'Recently Played',
				queuingType: QueuingType.FromSelection,
				startPlayback: true,
			})
		else {
			navigation.navigate('Album', {
				album: recentItem,
			})
		}
	}

	return tracksInfiniteQuery.data ? (
		<Animated.View
			entering={FadeIn.easing(Easing.in(Easing.ease))}
			exiting={FadeOut.easing(Easing.out(Easing.ease))}
			layout={LinearTransition.springify()}
			style={{
				flex: 1,
			}}
		>
			<XStack
				alignItems='center'
				onPress={() => {
					navigation.navigate('RecentTracks')
				}}
			>
				<H5 marginLeft={'$2'}>Play it again</H5>
				<Icon name='arrow-right' />
			</XStack>

			<HorizontalCardList
				data={
					(tracksInfiniteQuery.data.length ?? 0 > horizontalItems)
						? tracksInfiniteQuery.data.slice(0, horizontalItems)
						: tracksInfiniteQuery.data
				}
				renderItem={({ index, item }) => (
					<ItemCard
						size={'$11'}
						caption={item.Name}
						subCaption={`${item.Artists?.join(', ')}`}
						squared
						testId={`recently-played-${index}`}
						item={item}
						onPress={() => handleItemPress(item, index)}
						onLongPress={() => {
							rootNavigation.navigate('Context', {
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
	) : (
		<></>
	)
}

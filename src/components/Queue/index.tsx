import { useCurrentIndex, usePlayQueue } from '../../stores/player/queue'
import { TrackItem } from 'react-native-nitro-player'
import { reorderQueue } from '../../hooks/player/functions/queue'
import { DraxList, DraxProvider, SortableReorderEvent } from 'react-native-drax'
import QueuedTrack from './components/track'
import { itemDraxViewProps } from '../../configs/styling/drax'
import { useTheme, View, YStack } from 'tamagui'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { PlayerParamList } from '@/src/screens/Player/types'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import { LegendList } from '@legendapp/list/react-native'
import { useEffect } from 'react'
import { ITEM_ROW_HEIGHT } from '../Global/component.config'
import { ListRenderItemInfo } from 'react-native'

export default function Queue(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<PlayerParamList>>()

	const queue = usePlayQueue()

	const currentIndex = useCurrentIndex()

	const keyExtractor = (item: TrackItem) => `${item.id}`

	const onBackPress = () => navigation.goBack()

	const onReorder = async ({ fromIndex, toIndex }: SortableReorderEvent<TrackItem>) =>
		await reorderQueue({
			fromIndex,
			toIndex,
		})

	const { bottom } = useSafeAreaInsets()

	const renderItem = ({ item }: ListRenderItemInfo<TrackItem>) => <QueuedTrack item={item} />

	return (
		<DraxProvider>
			<DraxList<TrackItem>
				animationConfig={'spring'}
				component={LegendList}
				contentInsetAdjustmentBehavior='automatic'
				containerStyle={{
					flex: 1,
					marginBottom: bottom,
				}}
				data={queue}
				keyExtractor={keyExtractor}
				renderItem={renderItem}
				onReorder={onReorder}
				itemDraxViewProps={itemDraxViewProps}
				estimatedItemSize={ITEM_ROW_HEIGHT}
				lockToMainAxis
			/>
		</DraxProvider>
	)
}

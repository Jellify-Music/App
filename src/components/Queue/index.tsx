import { useCurrentIndex, usePlayQueue, useQueueRef } from '../../stores/player/queue'
import { TrackItem } from 'react-native-nitro-player'
import { ListRenderItemInfo, StyleSheet } from 'react-native'
import { reorderQueue } from '../../hooks/player/functions/queue'
import { DraxList, DraxProvider, SortableReorderEvent } from 'react-native-drax'
import QueuedTrack from './components/track'
import { itemDraxViewProps } from '../../configs/styling/drax'
import { LegendList } from '@legendapp/list/react-native'
import { useTheme, View, YStack } from 'tamagui'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { PlayerParamList } from '@/src/screens/Player/types'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'

export default function Queue(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<PlayerParamList>>()

	const queue = usePlayQueue()

	const currentIndex = useCurrentIndex()

	const queueRef = useQueueRef()

	const keyExtractor = (item: TrackItem) => `${item.id}`

	const onBackPress = () => navigation.goBack()

	const onReorder = async ({ fromIndex, toIndex }: SortableReorderEvent<TrackItem>) => {
		await reorderQueue({
			fromIndex,
			toIndex,
		})
	}

	const { bottom } = useSafeAreaInsets()

	const { color } = useTheme()

	const renderItem = (props: ListRenderItemInfo<TrackItem>) => (
		<QueuedTrack {...props} queueRef={queueRef} />
	)

	return (
		<View flex={1} marginBottom={bottom}>
			<YStack alignContent='flex-start' justifyContent='center' margin={'$4'}>
				<MaterialDesignIcons
					size={22}
					onPress={onBackPress}
					name='chevron-left'
					color={color.val}
				/>
			</YStack>
			<DraxProvider>
				<DraxList<TrackItem>
					animationConfig={'spring'}
					extraData={currentIndex}
					component={LegendList}
					data={queue}
					keyExtractor={keyExtractor}
					renderItem={renderItem}
					onReorder={onReorder}
					itemDraxViewProps={itemDraxViewProps}
					lockToMainAxis
					initialScrollIndex={currentIndex}
				/>
			</DraxProvider>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
})

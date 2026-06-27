import { useRef } from 'react'
import { useCurrentIndex, usePlayQueue, useQueueRef } from '../../stores/player/queue'
import { TrackItem } from 'react-native-nitro-player'
import { ListRenderItemInfo, StyleSheet } from 'react-native'
import { reorderQueue } from '../../hooks/player/functions/queue'
import { DraxList, DraxProvider, SortableReorderEvent } from 'react-native-drax'
import QueuedTrack from './components/track'
import { itemDraxViewProps } from '../../configs/styling/drax'
import { LegendList, LegendListRef } from '@legendapp/list/react-native'
import { YStack } from 'tamagui'
import Icon from '../Global/components/icon'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { PlayerParamList } from '@/src/screens/Player/types'
import { useNavigation } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Queue(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<PlayerParamList>>()

	const queue = usePlayQueue()

	const currentIndex = useCurrentIndex()

	const queueRef = useQueueRef()

	const listRef = useRef<LegendListRef>(null)

	const keyExtractor = (item: TrackItem) => `${item.id}`

	const onBackPress = () => navigation.goBack()

	const onReorder = async ({ fromIndex, toIndex }: SortableReorderEvent<TrackItem>) => {
		await reorderQueue({
			fromIndex,
			toIndex,
		})
	}

	const renderItem = (props: ListRenderItemInfo<TrackItem>) => (
		<QueuedTrack {...props} queueRef={queueRef} />
	)

	return (
		<SafeAreaView edges={['bottom']} style={styles.container}>
			<YStack
				alignContent='flex-start'
				justifyContent='center'
				marginHorizontal={'$2'}
				marginVertical='$4'
			>
				<Icon small onPress={onBackPress} name='chevron-left' />
			</YStack>
			<DraxProvider>
				<DraxList<TrackItem>
					component={LegendList}
					data={queue}
					keyExtractor={keyExtractor}
					ref={listRef}
					renderItem={renderItem}
					onReorder={onReorder}
					itemDraxViewProps={itemDraxViewProps}
					lockToMainAxis
					initialScrollIndex={currentIndex}
				/>
			</DraxProvider>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
})

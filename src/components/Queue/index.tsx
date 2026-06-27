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
import { LegendList, LegendListRef } from '@legendapp/list/react-native'
import { useRef } from 'react'

export default function Queue(): React.JSX.Element {
	const ref = useRef<LegendListRef>(null)

	const navigation = useNavigation<NativeStackNavigationProp<PlayerParamList>>()

	const queue = usePlayQueue()

	const currentIndex = useCurrentIndex()

	const keyExtractor = (item: TrackItem, index: number) => `${index}-${item.id}`

	const onBackPress = () => navigation.goBack()

	const onReorder = async ({ fromIndex, toIndex }: SortableReorderEvent<TrackItem>) =>
		await reorderQueue({
			fromIndex,
			toIndex,
		})

	const { bottom } = useSafeAreaInsets()

	const { color } = useTheme()

	const onLoad = () => {
		if (currentIndex !== undefined)
			ref.current?.scrollToIndex({
				animated: true,
				index: currentIndex,
			})
	}

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
					ref={ref}
					component={LegendList}
					data={queue}
					keyExtractor={keyExtractor}
					renderItem={({ item }) => <QueuedTrack item={item} />}
					onReorder={onReorder}
					itemDraxViewProps={itemDraxViewProps}
					lockToMainAxis
					onLoad={onLoad}
				/>
			</DraxProvider>
		</View>
	)
}

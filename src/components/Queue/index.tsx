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
import { useRef } from 'react'
import { FlatList } from 'react-native'

export default function Queue(): React.JSX.Element {
	const ref = useRef<FlatList<TrackItem>>(null)

	const navigation = useNavigation<NativeStackNavigationProp<PlayerParamList>>()

	const queue = usePlayQueue()

	const currentIndex = useCurrentIndex()

	const keyExtractor = (item: TrackItem, index: number) => `${item.id}`

	const onBackPress = () => navigation.goBack()

	const onReorder = async ({ fromIndex, toIndex }: SortableReorderEvent<TrackItem>) =>
		await reorderQueue({
			fromIndex,
			toIndex,
		})

	const { bottom } = useSafeAreaInsets()

	const { color } = useTheme()

	const getItemLayout = (_: TrackItem[], index: number) => ({
		length: 60,
		offset: 60 * index,
		index,
	})

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
					ref={ref}
					data={queue}
					keyExtractor={keyExtractor}
					renderItem={({ item }) => <QueuedTrack item={item} />}
					onReorder={onReorder}
					itemDraxViewProps={itemDraxViewProps}
					getItemLayout={getItemLayout}
					lockToMainAxis
					initialScrollIndex={currentIndex}
				/>
			</DraxProvider>
		</View>
	)
}

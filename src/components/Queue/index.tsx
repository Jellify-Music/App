import { usePlayQueue } from '../../stores/player/queue'
import { TrackItem } from 'react-native-nitro-player'
import QueuedTrack from './components/track'
import { useTheme, View, YStack } from 'tamagui'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { PlayerParamList } from '@/src/screens/Player/types'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import { Sortable } from 'react-native-reanimated-dnd'

export default function Queue(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<PlayerParamList>>()

	const queue = usePlayQueue()

	const keyExtractor = (item: TrackItem) => `${item.id}`

	const onBackPress = () => navigation.goBack()

	const { bottom } = useSafeAreaInsets()

	const { color } = useTheme()

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
			<Sortable
				data={queue}
				itemKeyExtractor={keyExtractor}
				renderItem={(props) => <QueuedTrack {...props} />}
				itemHeight={60}
			/>
		</View>
	)
}

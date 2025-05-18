import { StackParamList } from '../../../components/types'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { getTokens, Separator, Spacer, View, XStack, YStack } from 'tamagui'
import { Text } from '../helpers/text'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import Icon from './icon'
import { QueuingType } from '../../../enums/queuing-type'
import { RunTimeTicks } from '../helpers/time-codes'
import { useQueueContext } from '../../../providers/Player/queue'
import { usePlayerContext } from '../../../providers/Player'
import ItemImage from './image'
import FavoriteIcon from './favorite-icon'

export default function Item({
	item,
	queueName,
	navigation,
}: {
	item: BaseItemDto
	queueName: string
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const { useStartPlayback } = usePlayerContext()
	const { useLoadNewQueue } = useQueueContext()

	const { width } = useSafeAreaFrame()

	return (
		<View>
			<Separator />

			<XStack
				alignContent='center'
				minHeight={'$7'}
				width={'100%'}
				onPress={() => {
					switch (item.Type) {
						case 'MusicArtist': {
							navigation.navigate('Artist', {
								artist: item,
							})
							break
						}

						case 'MusicAlbum': {
							navigation.navigate('Album', {
								album: item,
							})
							break
						}

						case 'Audio': {
							useLoadNewQueue.mutate(
								{
									track: item,
									tracklist: [item],
									index: 0,
									queue: 'Search',
									queuingType: QueuingType.FromSelection,
								},
								{
									onSuccess: () => useStartPlayback.mutate(),
								},
							)
							break
						}
					}
				}}
				onLongPress={() => {
					navigation.navigate('Details', {
						item,
						isNested: false,
					})
				}}
				paddingVertical={'$2'}
				paddingRight={'$2'}
			>
				<YStack marginHorizontal={'$3'} justifyContent='center'>
					<ItemImage item={item} height={'$12'} width={'$12'} />
				</YStack>

				<YStack alignContent='center' justifyContent='center' flex={4}>
					<Text bold lineBreakStrategyIOS='standard' numberOfLines={1}>
						{item.Name ?? ''}
					</Text>
					{(item.Type === 'Audio' || item.Type === 'MusicAlbum') && (
						<Text
							lineBreakStrategyIOS='standard'
							numberOfLines={1}
							color={'$borderColor'}
							bold
						>
							{item.AlbumArtist ?? 'Untitled Artist'}
						</Text>
					)}

					{item.Type === 'MusicAlbum' && <RunTimeTicks>{item.RunTimeTicks}</RunTimeTicks>}
				</YStack>

				<XStack
					justifyContent='flex-end'
					alignItems='center'
					flex={item.Type === 'Audio' ? 2 : 1}
				>
					<FavoriteIcon item={item} />
					{/* Runtime ticks for Songs */}
					{item.Type === 'Audio' ? (
						<RunTimeTicks>{item.RunTimeTicks}</RunTimeTicks>
					) : null}

					{item.Type === 'Audio' || item.Type === 'MusicAlbum' ? (
						<Icon
							name='dots-horizontal'
							onPress={() => {
								navigation.navigate('Details', {
									item,
									isNested: false,
								})
							}}
						/>
					) : null}
				</XStack>
			</XStack>
		</View>
	)
}

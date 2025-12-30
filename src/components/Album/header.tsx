import { fetchAlbumDiscs } from '../../api/queries/item'
import { QueryKeys } from '../../enums/query-keys'
import { QueuingType } from '../../enums/queuing-type'
import { useLoadNewQueue } from '../../providers/Player/hooks/mutations'
import { BaseStackParamList } from '../../screens/types'
import { useApi } from '../../stores'
import useStreamingDeviceProfile from '../../stores/device-profile'
import { useNetworkStatus } from '../../stores/network'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery } from '@tanstack/react-query'
import Animated, { FadeInUp, FadeOutDown, LinearTransition } from 'react-native-reanimated'
import { YStack, H5, XStack, Separator } from 'tamagui'
import Icon from '../Global/components/icon'
import ItemImage from '../Global/components/image'
import { RunTimeTicks } from '../Global/helpers/time-codes'
import Button from '../Global/helpers/button'
import { Text } from '../Global/helpers/text'
import { InstantMixButton } from '../Global/components/instant-mix-button'

/**
 * Renders a header for an Album's track list
 * @param album The {@link BaseItemDto} of the album to render the header for
 * @param navigation The navigation object from the parent {@link Album}
 * @param playAlbum The function to call to play the album
 * @returns A React component
 */
export default function AlbumTrackListHeader({ album }: { album: BaseItemDto }): React.JSX.Element {
	const api = useApi()

	const [networkStatus] = useNetworkStatus()
	const streamingDeviceProfile = useStreamingDeviceProfile()

	const loadNewQueue = useLoadNewQueue()

	const { data: discs, isPending } = useQuery({
		queryKey: [QueryKeys.ItemTracks, album.Id],
		queryFn: () => fetchAlbumDiscs(api, album),
	})

	const navigation = useNavigation<NativeStackNavigationProp<BaseStackParamList>>()

	const playAlbum = (shuffled: boolean = false) => {
		if (!discs || discs.length === 0) return

		const allTracks = discs.flatMap((disc) => disc.data) ?? []
		if (allTracks.length === 0) return

		loadNewQueue({
			api,
			networkStatus,
			deviceProfile: streamingDeviceProfile,
			track: allTracks[0],
			index: 0,
			tracklist: allTracks,
			queue: album,
			queuingType: QueuingType.FromSelection,
			shuffled,
			startPlayback: true,
		})
	}

	return (
		<YStack alignContent='center' flex={1} marginTop={'$4'}>
			<ItemImage
				item={album}
				width={200}
				height={200}
				imageOptions={{
					maxHeight: 750,
					maxWidth: 750,
				}}
			/>

			<YStack marginTop={'$2'} alignContent='center' justifyContent='center' gap={'$2'}>
				<H5 lineBreakStrategyIOS='standard' textAlign='center' numberOfLines={5}>
					{album.Name ?? 'Untitled Album'}
				</H5>

				{album.AlbumArtists && album.AlbumArtists.length > 0 && (
					<Text
						bold
						color={'$primary'}
						onPress={() =>
							navigation.navigate('Artist', {
								artist: album.AlbumArtists![0],
							})
						}
						textAlign='center'
						fontSize={'$5'}
						paddingBottom={'$2'}
					>
						{album.AlbumArtists[0].Name ?? 'Untitled Artist'}
					</Text>
				)}

				<XStack justify='center' gap={'$3'} marginBottom={'$2'}>
					<YStack flex={1}>
						{album.ProductionYear ? (
							<Text fontVariant={['tabular-nums']} textAlign='right'>
								{album.ProductionYear?.toString() ?? 'Unknown Year'}
							</Text>
						) : null}
					</YStack>

					<Separator vertical />

					<RunTimeTicks props={{ flex: 1, textAlign: 'left' }}>
						{album.RunTimeTicks}
					</RunTimeTicks>
				</XStack>

				{discs && (
					<XStack alignContent='center' gap={'$2'} marginHorizontal={'$2'}>
						<Animated.View
							style={{
								flex: 2,
							}}
							entering={FadeInUp.springify()}
							exiting={FadeOutDown.springify()}
							layout={LinearTransition.springify()}
						>
							<Button
								icon={() => <Icon small name='play' color='$primary' />}
								borderWidth={'$1'}
								borderColor={'$primary'}
								flex={1}
								onPress={() => playAlbum(false)}
								pressStyle={{ scale: 0.875 }}
								hoverStyle={{ scale: 0.925 }}
								animation={'bouncy'}
							>
								<Text bold color={'$primary'}>
									Play
								</Text>
							</Button>
						</Animated.View>

						<InstantMixButton item={album} navigation={navigation} />

						<Animated.View
							style={{
								flex: 2,
							}}
							entering={FadeInUp.springify()}
							exiting={FadeOutDown.springify()}
							layout={LinearTransition.springify()}
						>
							<Button
								icon={() => <Icon small name='shuffle' color='$primary' />}
								borderWidth={'$1'}
								borderColor={'$primary'}
								flex={1}
								onPress={() => playAlbum(true)}
								pressStyle={{ scale: 0.875 }}
								hoverStyle={{ scale: 0.925 }}
								animation={'bouncy'}
							>
								<Text bold color={'$primary'}>
									Shuffle
								</Text>
							</Button>
						</Animated.View>
					</XStack>
				)}
			</YStack>
		</YStack>
	)
}

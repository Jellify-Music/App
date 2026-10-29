import { BaseStackParamList } from '../../screens/types'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { YStack, H5, XStack, Separator, SizableText } from 'tamagui'
import Icon from '../Global/components/icon'
import ItemImage from '../Global/components/image'
import { RunTimeTicks } from '../Global/helpers/time-codes'
import Button from '../Global/helpers/button'
import { InstantMixButton } from '../Global/components/instant-mix-button'
import { useAlbumDiscs } from '../../api/queries/album'
import { formatArtistName } from '../../utils/formatting/artist-names'
import { ICON_PRESS_STYLES } from '../../configs/styling/elements'
import { loadNewQueue } from '../../player/queuing'

/**
 * Renders a header for an Album's track list
 * @param album The {@link BaseItemDto} of the album to render the header for
 * @param navigation The navigation object from the parent {@link Album}
 * @param playAlbum The function to call to play the album
 * @returns A React component
 */
export default function AlbumTrackListHeader({ album }: { album: BaseItemDto }): React.JSX.Element {
	const { data: discs } = useAlbumDiscs(album)

	const navigation = useNavigation<NativeStackNavigationProp<BaseStackParamList>>()

	const playAlbum = (shuffled: boolean = false) => {
		if (!discs || discs.length === 0) return

		const allTracks = discs.flatMap((disc) => disc.data) ?? []
		if (allTracks.length === 0) return

		loadNewQueue({
			track: allTracks[0],
			index: 0,
			tracklist: allTracks,
			queue: album,
			shuffled,
			startPlayback: true,
		})
	}

	return (
		<YStack alignContent='center' flex={1} marginBottom='2'>
			<XStack justifyContent='center'>
				<ItemImage
					item={album}
					width={'15'}
					height={'15'}
					imageOptions={{
						maxHeight: 750,
						maxWidth: 750,
					}}
					elevate
				/>
			</XStack>

			<YStack marginTop='2' alignContent='center' justifyContent='center' gap='2'>
				<H5 lineBreakStrategyIOS='standard' textAlign='center' numberOfLines={5}>
					{album.Name ?? 'Untitled Album'}
				</H5>

				{album.AlbumArtists && album.AlbumArtists.length > 0 && (
					<SizableText
						fontWeight='6'
						color='primary'
						textAlign='center'
						fontSize='3'
						{...ICON_PRESS_STYLES}
						onPress={() =>
							navigation.navigate('Artist', {
								artist: album.AlbumArtists![0],
							})
						}
					>
						{formatArtistName(album.AlbumArtists[0].Name)}
					</SizableText>
				)}

				<XStack justify='center' gap='3' marginBottom='2'>
					<YStack flex={1} justifyContent='center'>
						{album.ProductionYear ? (
							<SizableText
								fontSize='2'
								fontVariant={['tabular-nums']}
								textAlign='right'
							>
								{album.ProductionYear?.toString() ?? 'Unknown Year'}
							</SizableText>
						) : null}
					</YStack>

					<Separator vertical borderColor='borderColor' />

					<RunTimeTicks props={{ flex: 1, textAlign: 'left' }}>
						{album.RunTimeTicks}
					</RunTimeTicks>
				</XStack>

				{discs && (
					<XStack alignContent='center' gap='2' marginHorizontal='2'>
						<Button
							flex={1}
							icon={<Icon size='7' name='play' color='background' />}
							borderRadius={'2'}
							backgroundColor={'primary'}
							onPress={() => playAlbum(false)}
						>
							<SizableText fontSize='2' fontWeight='6' color='background'>
								Play
							</SizableText>
						</Button>

						<Button
							icon={<Icon size='7' name='shuffle' color='primary' />}
							borderWidth={'1'}
							borderRadius={'2'}
							borderColor={'primary'}
							flex={1}
							onPress={() => playAlbum(true)}
						>
							<SizableText fontSize='2' fontWeight='6' color='primary'>
								Shuffle
							</SizableText>
						</Button>

						<InstantMixButton item={album} navigation={navigation} />
					</XStack>
				)}
			</YStack>
		</YStack>
	)
}

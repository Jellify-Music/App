import { useAddToPlaylist, useRemoveFromPlaylist } from '../../../api/mutations/playlist'
import { usePlaylistTracks } from '../../../api/queries/playlist'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { XStack, YStack, SizableText, Spinner, View } from 'tamagui'
import Icon from '../../Global/components/icon'
import ItemImage from '../../Global/components/image'
import { Ticker } from '../../Global/utils/Animated/text'

/**
 * Props for the AddToPlaylistRow component
 */
interface AddToPlaylistRowProps {
	playlist: BaseItemDto
	tracks: BaseItemDto[]
}

/**
 * Renders a row for the AddToPlaylist component, displaying the playlist and its tracks, along with an accessory indicating whether the tracks are in the playlist and the fetching status.
 *
 * @param param0 The props for the AddToPlaylistRow component, including the playlist and the list of tracks.
 *
 * @returns The JSX element representing a row in the AddToPlaylist component, displaying the playlist and its tracks.
 */
export default function AddToPlaylistRow({
	playlist,
	tracks,
}: AddToPlaylistRowProps): React.JSX.Element {
	// The list is virtualized, so rows only mount (and fetch) when near the viewport
	const { data: playlistTracks, isPending: fetchingPlaylistTracks } = usePlaylistTracks(playlist)

	const { mutate: addToPlaylist, isPending: addingToPlaylist } = useAddToPlaylist(playlist)
	const { mutate: removeFromPlaylist, isPending: removingFromPlaylist } =
		useRemoveFromPlaylist(playlist)

	const isInPlaylist =
		tracks.filter((track) =>
			playlistTracks?.map((playlistTrack) => playlistTrack.Id).includes(track.Id!),
		).length > 0

	const onPress = () =>
		isInPlaylist
			? removeFromPlaylist({
					tracks,
					playlist,
				})
			: addToPlaylist({
					tracks,
					playlist,
				})

	return (
		<XStack
			transition={'quick'}
			alignItems='center'
			gap='2'
			margin='2'
			opacity={`1 press:0.6`}
			onPress={onPress}
		>
			<ItemImage
				item={playlist}
				height={'4'}
				width={'4'}
				imageOptions={{ maxWidth: 140, maxHeight: 140, quality: 90 }}
				elevate
			/>

			<YStack alignItems='flex-start' justifyContent='space-evenly' flex={1}>
				<Ticker>
					<SizableText fontWeight='6' fontSize='3' numberOfLines={1}>
						{playlist.Name ?? 'Untitled Playlist'}
					</SizableText>
				</Ticker>

				<SizableText
					color={'neutral'}
					fontSize='2'
				>{`${playlistTracks?.length ?? 0} tracks`}</SizableText>
			</YStack>

			<AddToPlaylistRowEndAccessory
				isInPlaylist={isInPlaylist}
				isFetching={fetchingPlaylistTracks || addingToPlaylist || removingFromPlaylist}
			/>
		</XStack>
	)
}

interface AddToPlaylistRowEndAccessoryProps {
	isInPlaylist: boolean
	isFetching: boolean
}

function AddToPlaylistRowEndAccessory({
	isInPlaylist,
	isFetching,
}: AddToPlaylistRowEndAccessoryProps): React.JSX.Element {
	const iconName = isInPlaylist ? 'check-circle-outline' : 'circle-outline'
	const iconColor = isInPlaylist ? 'success' : 'borderColor'
	return (
		<View>
			{isFetching ? (
				<Spinner color='primary' />
			) : (
				<Icon
					name={iconName}
					color={iconColor}
					transition={'bouncy'}
					opacity='1 enter:0 exit:0'
				/>
			)}
		</View>
	)
}

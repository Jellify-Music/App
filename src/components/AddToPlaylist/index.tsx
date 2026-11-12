import { useMutation } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { addManyToPlaylist } from '../../api/mutations/playlist/utils/playlists'
import { YStack, XStack, Spacer, Spinner, View, useTheme, SizableText } from 'tamagui'
import Icon from '../Global/components/icon'
import { AddToPlaylistMutation } from './types'
import ItemImage from '../Global/components/image'
import { Ticker } from '../../components/Global/helpers/Animated/text'
import { getItemName } from '../../utils/formatting/item-names'
import { usePlaylistTracks, useRecentlyUpdatedPlaylists } from '../../api/queries/playlist'
import { getApi, getUser } from '../../stores/auth/utils'
import { appendPlaylistTracks } from '../../api/queries/playlist/cache'
import { AnimatedList } from '../Global/components/Lists/utils'
import type { LegendListRenderItemProps } from '@legendapp/list/react-native'
import { SequencedTransition, useReducedMotion } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { applyHapticFeedback } from '../../utils/haptics'
import { handleError } from '../../utils/errors'
import { LoggingContext } from '../../utils/logging'

export default function AddToPlaylist({
	tracks,
	source,
}: {
	tracks: BaseItemDto[]
	source?: BaseItemDto
}): React.JSX.Element {
	const {
		data: playlists,
		isPending: playlistsFetchPending,
		isSuccess: playlistsFetchSuccess,
	} = useRecentlyUpdatedPlaylists()

	const { bottom } = useSafeAreaInsets()

	const reducedMotion = useReducedMotion()

	const { darkBackground75 } = useTheme()

	const headerShadowStyle = {
		boxShadow: [
			{
				offsetY: 2,
				offsetX: 0,
				blurRadius: 4,
				spreadDistance: 1,
				color: darkBackground75.val,
			},
		],
	}

	const renderItem = ({ item: playlist }: LegendListRenderItemProps<BaseItemDto>) => (
		<AddToPlaylistRow
			playlist={playlist}
			tracks={tracks ? tracks : tracks[0] ? [tracks[0]] : []}
		/>
	)

	return (
		<View flex={1}>
			{(source ?? tracks[0]) && (
				<XStack gap='2' margin='2' style={headerShadowStyle}>
					<ItemImage
						item={source ?? tracks[0]}
						width={'6'}
						height={'6'}
						imageOptions={{ maxWidth: 150, maxHeight: 150, quality: 90 }}
					/>

					<YStack justifyContent='space-evenly'>
						<Ticker>
							<SizableText fontWeight='6' fontSize={'3'}>
								{getItemName(source ?? tracks[0])}
							</SizableText>
						</Ticker>

						{(source ?? tracks[0])?.ArtistItems && (
							<Ticker>
								<SizableText fontWeight='6' fontSize={'3'}>
									{`${(source ?? tracks[0])!.ArtistItems?.map((artist) => getItemName(artist)).join(', ')}`}
								</SizableText>
							</Ticker>
						)}
					</YStack>
				</XStack>
			)}

			{!playlistsFetchPending && playlistsFetchSuccess && (
				// Adding to a playlist moves it to the front of the list, so animate the reorder
				<AnimatedList<BaseItemDto>
					data={playlists}
					itemLayoutAnimation={reducedMotion ? undefined : SequencedTransition}
					renderItem={renderItem}
					contentContainerStyle={{
						paddingBottom: bottom,
					}}
				/>
			)}
		</View>
	)
}

function AddToPlaylistRow({
	playlist,
	tracks,
}: {
	playlist: BaseItemDto
	tracks: BaseItemDto[]
}): React.JSX.Element {
	// The list is virtualized, so rows only mount (and fetch) when near the viewport
	const { data: playlistTracks, isPending: fetchingPlaylistTracks } = usePlaylistTracks(playlist)

	const useAddToPlaylist = useMutation({
		mutationFn: ({ playlist, tracks }: AddToPlaylistMutation) => {
			applyHapticFeedback('info')

			const api = getApi()
			const user = getUser()

			return addManyToPlaylist(api, user, tracks, playlist)
		},
		onSuccess: (_, { tracks }) => {
			applyHapticFeedback('success')

			appendPlaylistTracks(playlist, tracks)
		},
		onError: (error) => {
			handleError(
				error,
				LoggingContext.Playlist,
				`Failed to add to ${playlist.Name ?? 'playlist'}`,
			)
		},
	})

	const isInPlaylist =
		tracks.filter((track) =>
			playlistTracks?.map((playlistTrack) => playlistTrack.Id).includes(track.Id!),
		).length > 0

	return (
		<XStack
			transition={'quick'}
			alignItems='center'
			gap='2'
			margin='2'
			opacity={`${isInPlaylist ? 0.5 : 1} press:0.6`}
			disabled={isInPlaylist}
			onPress={() => {
				if (!isInPlaylist) {
					useAddToPlaylist.mutate({
						tracks,
						playlist,
					})
				}
			}}
		>
			<ItemImage
				item={playlist}
				height={'4'}
				width={'4'}
				imageOptions={{ maxWidth: 140, maxHeight: 140, quality: 90 }}
			/>

			<YStack alignItems='flex-start' justifyContent='space-evenly' flexGrow={1}>
				<SizableText fontWeight='6' fontSize='3'>
					{playlist.Name ?? 'Untitled Playlist'}
				</SizableText>

				<SizableText
					color={'neutral'}
					fontSize='2'
				>{`${playlistTracks?.length ?? 0} tracks`}</SizableText>
			</YStack>

			<AddToPlaylistEndAccessory
				isInPlaylist={isInPlaylist}
				isFetching={fetchingPlaylistTracks || useAddToPlaylist.isPending}
			/>
		</XStack>
	)
}

interface AddToPlaylistEndAccessoryProps {
	isInPlaylist: boolean
	isFetching: boolean
}

function AddToPlaylistEndAccessory({
	isInPlaylist,
	isFetching,
}: AddToPlaylistEndAccessoryProps): React.JSX.Element {
	if (isInPlaylist) {
		return (
			<Icon
				name='check-circle-outline'
				color={'success'}
				transition={'quick'}
				opacity='1 enter:0 exit:0'
			/>
		)
	}

	if (isFetching) {
		return <Spinner color='primary' />
	}

	return <Spacer width='4' />
}

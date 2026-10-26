import { useMutation, InfiniteData } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { addManyToPlaylist } from '../../api/mutations/playlist/utils/playlists'
import { YStack, XStack, Spacer, Spinner, View, useTheme, SizableText } from 'tamagui'
import Icon from '../Global/components/icon'
import { AddToPlaylistMutation } from './types'
import ItemImage from '../Global/components/image'
import TextTicker from 'react-native-text-ticker'
import { TextTickerConfig } from '../Player/component.config'
import { getItemName } from '../../utils/formatting/item-names'
import { usePlaylistTracks, useUserPlaylists } from '../../api/queries/playlist'
import { getApi, getUser } from '../../stores/auth/utils'
import { queryClient } from '../../constants/query-client'
import { PlaylistTracksQueryKey } from '../../api/queries/playlist/keys'
import List from '../Global/components/Lists/utils'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { applyHapticFeedback } from '../../utils/haptics'

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
	} = useUserPlaylists()

	const { bottom } = useSafeAreaInsets()

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

	return (
		<View flex={1}>
			{(source ?? tracks[0]) && (
				<XStack gap='2' margin='2' style={headerShadowStyle}>
					<ItemImage
						item={source ?? tracks[0]}
						width={'6'}
						height={'6'}
						imageOptions={{ maxWidth: 50, maxHeight: 50, quality: 90 }}
					/>

					<YStack justifyContent='space-evenly'>
						<TextTicker {...TextTickerConfig}>
							<SizableText fontWeight='6' fontSize={'3'}>
								{getItemName(source ?? tracks[0])}
							</SizableText>
						</TextTicker>

						{(source ?? tracks[0])?.ArtistItems && (
							<TextTicker {...TextTickerConfig}>
								<SizableText fontWeight='6' fontSize={'3'}>
									{`${(source ?? tracks[0])!.ArtistItems?.map((artist) => getItemName(artist)).join(', ')}`}
								</SizableText>
							</TextTicker>
						)}
					</YStack>
				</XStack>
			)}

			{!playlistsFetchPending && playlistsFetchSuccess && (
				<List
					data={playlists}
					renderItem={({ item: playlist }) => (
						<AddToPlaylistRow
							key={playlist.Id}
							playlist={playlist}
							tracks={tracks ? tracks : tracks[0] ? [tracks[0]] : []}
						/>
					)}
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

			queryClient.setQueryData(
				PlaylistTracksQueryKey(playlist),
				(prev: InfiniteData<BaseItemDto[]> | undefined) => {
					if (!prev) return prev

					return {
						...prev,
						pages: prev.pages.map((page: BaseItemDto[], idx: number) =>
							idx === prev.pages.length - 1 ? [...page, ...tracks] : page,
						),
					}
				},
			)
		},
		onError: (error) => {
			console.error(error)
			applyHapticFeedback('error')
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

			{isInPlaylist ? (
				<Icon
					name='check-circle-outline'
					color={'success'}
					transition={'quick'}
					opacity='1 enter:0 exit:0'
				/>
			) : fetchingPlaylistTracks || useAddToPlaylist.isPending ? (
				<Spinner color='primary' />
			) : (
				<Spacer flex={1} />
			)}
		</XStack>
	)
}

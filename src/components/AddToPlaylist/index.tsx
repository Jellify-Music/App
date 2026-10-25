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
import { triggerHaptic } from '../../hooks/use-haptic-feedback'
import { usePlaylistTracks, useUserPlaylists } from '../../api/queries/playlist'
import { getApi, getUser } from '../../stores/auth/utils'
import { useState } from 'react'
import { queryClient } from '../../constants/query-client'
import { PlaylistTracksQueryKey } from '../../api/queries/playlist/keys'
import { ViewToken } from '@legendapp/list/react-native'
import List from '../Global/components/Lists/utils'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

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

	const [visiblePlaylistIds, setVisiblePlaylistIds] = useState<string[]>([])

	const onViewableItemsChanged = ({
		viewableItems,
	}: {
		viewableItems: ViewToken<BaseItemDto>[]
	}) => {
		const visibleIds = viewableItems.map(({ item }) => item.Id!)
		setVisiblePlaylistIds(visibleIds)
	}

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
							<SizableText fontWeight='6' size={'6'}>
								{getItemName(source ?? tracks[0])}
							</SizableText>
						</TextTicker>

						{(source ?? tracks[0])?.ArtistItems && (
							<TextTicker {...TextTickerConfig}>
								<SizableText fontWeight='6'>
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
							visible={visiblePlaylistIds.includes(playlist.Id!)}
						/>
					)}
					contentContainerStyle={{
						paddingBottom: bottom,
					}}
					onViewableItemsChanged={onViewableItemsChanged}
				/>
			)}
		</View>
	)
}

function AddToPlaylistRow({
	playlist,
	tracks,
	visible,
}: {
	playlist: BaseItemDto
	tracks: BaseItemDto[]
	visible: boolean
}): React.JSX.Element {
	const { data: playlistTracks, isPending: fetchingPlaylistTracks } = usePlaylistTracks(
		playlist,
		!visible,
	)

	const useAddToPlaylist = useMutation({
		mutationFn: ({ playlist, tracks }: AddToPlaylistMutation) => {
			triggerHaptic('impactLight')

			const api = getApi()
			const user = getUser()

			return addManyToPlaylist(api, user, tracks, playlist)
		},
		onSuccess: (_, { tracks }) => {
			triggerHaptic('notificationSuccess')

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
			triggerHaptic('notificationError')
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
				<SizableText fontWeight='6'>{playlist.Name ?? 'Untitled Playlist'}</SizableText>

				<SizableText
					color={'neutral'}
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

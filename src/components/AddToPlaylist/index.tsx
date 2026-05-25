import { useMutation, InfiniteData } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { addManyToPlaylist } from '../../api/mutations/playlist/utils/playlists'
import { YStack, XStack, Spacer, Spinner, View } from 'tamagui'
import Icon from '../Global/components/icon'
import { AddToPlaylistMutation } from './types'
import { Text } from '../Global/helpers/text'
import ItemImage from '../Global/components/image'
import TextTicker from 'react-native-text-ticker'
import { TextTickerConfig } from '../Player/component.config'
import { getItemName } from '../../utils/formatting/item-names'
import { usePlaylistTracks, useUserPlaylists } from '../../api/queries/playlist'
import { getApi, getUser } from '../../stores/auth/utils'
import Animated, { Easing, FadeIn, FadeOut } from 'react-native-reanimated'
import { useState } from 'react'
import { queryClient } from '../../constants/query-client'
import { PlaylistTracksQueryKey } from '../../api/queries/playlist/keys'
import LegendItemList from '../Global/helpers/legend-item-list'
import { OnViewableItemsChangedInfo } from '@legendapp/list/react-native'
import { Presets } from 'react-native-pulsar'
import { captureError, LoggingContext } from '../../utils/logging'

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

	const onViewableItemsChanged = ({ viewableItems }: OnViewableItemsChangedInfo<BaseItemDto>) => {
		const visibleIds = viewableItems.map(({ item }) => item.Id!)
		setVisiblePlaylistIds(visibleIds)
	}

	return (
		<View flex={1}>
			{(source ?? tracks[0]) && (
				<XStack gap={'$2'} margin={'$4'}>
					<ItemImage
						item={source ?? tracks[0]}
						width={'$12'}
						height={'$12'}
						imageOptions={{ maxWidth: 85, maxHeight: 85, quality: 90 }}
					/>

					<YStack gap={'$2'}>
						<TextTicker {...TextTickerConfig}>
							<Text bold fontSize={'$6'}>
								{getItemName(source ?? tracks[0])}
							</Text>
						</TextTicker>

						{(source ?? tracks[0])?.ArtistItems && (
							<TextTicker {...TextTickerConfig}>
								<Text bold>
									{`${(source ?? tracks[0])!.ArtistItems?.map((artist) => getItemName(artist)).join(', ')}`}
								</Text>
							</TextTicker>
						)}
					</YStack>
				</XStack>
			)}

			{!playlistsFetchPending && playlistsFetchSuccess && (
				<LegendItemList
					data={playlists}
					renderItem={({ item: playlist }) => (
						<AddToPlaylistRow
							key={playlist.Id}
							playlist={playlist}
							tracks={tracks ? tracks : tracks[0] ? [tracks[0]] : []}
							visible={visiblePlaylistIds.includes(playlist.Id!)}
						/>
					)}
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
			Presets.peck()

			const api = getApi()
			const user = getUser()

			return addManyToPlaylist(api, user, tracks, playlist)
		},
		onSuccess: (_, { tracks }) => {
			Presets.dewdrop()

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
			captureError(error, LoggingContext.AddToPlaylist, 'Unable to add track to playlist')
		},
	})

	const isInPlaylist =
		tracks.filter((track) =>
			playlistTracks?.map((playlistTrack) => playlistTrack.Id).includes(track.Id),
		).length > 0

	return (
		<XStack
			transition={'quick'}
			disabled={isInPlaylist}
			alignItems='center'
			gap={'$2'}
			margin={'$2'}
			opacity={isInPlaylist ? 0.5 : 1}
			pressStyle={{ opacity: 0.6 }}
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
				height={'$11'}
				width={'$11'}
				imageOptions={{ maxWidth: 85, maxHeight: 85, quality: 90 }}
			/>

			<YStack alignItems='flex-start' flexGrow={1}>
				<Text bold>{playlist.Name ?? 'Untitled Playlist'}</Text>

				<Text color={'$neutral'}>{`${playlistTracks?.length ?? 0} tracks`}</Text>
			</YStack>

			<Animated.View
				entering={FadeIn.easing(Easing.in(Easing.ease))}
				exiting={FadeOut.easing(Easing.out(Easing.ease))}
			>
				{isInPlaylist ? (
					<Icon flex={1} name='check-circle-outline' color={'$success'} />
				) : fetchingPlaylistTracks || useAddToPlaylist.isPending ? (
					<Spinner color={'$primary'} />
				) : (
					<Spacer flex={1} />
				)}
			</Animated.View>
		</XStack>
	)
}

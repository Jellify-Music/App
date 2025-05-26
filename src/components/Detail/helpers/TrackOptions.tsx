import { StackParamList } from '../../../components/types'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import {
	Circle,
	getToken,
	getTokens,
	ListItem,
	Separator,
	Spacer,
	Spinner,
	XStack,
	YGroup,
	YStack,
} from 'tamagui'
import { QueuingType } from '../../../enums/queuing-type'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import IconButton from '../../../components/Global/helpers/icon-button'
import { Text } from '../../../components/Global/helpers/text'
import React, { useMemo } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AddToPlaylistMutation } from '../../../components/Detail/types'
import { addToPlaylist } from '../../../api/mutations/playlists'
import { trigger } from 'react-native-haptic-feedback'
import { queryClient } from '../../../constants/query-client'
import { QueryKeys } from '../../../enums/query-keys'
import { fetchItem } from '../../../api/queries/item'
import { fetchUserPlaylists } from '../../../api/queries/playlists'

import { useJellifyContext } from '../../../providers'
import { getImageApi, getItemsApi } from '@jellyfin/sdk/lib/utils/api'
import { useNetworkContext } from '../../../providers/Network'
import { useQueueContext } from '../../../providers/Player/queue'
import Toast from 'react-native-toast-message'
import FastImage from 'react-native-fast-image'
import Icon from '../../../components/Global/components/icon'

interface TrackOptionsProps {
	track: BaseItemDto
	navigation: NativeStackNavigationProp<StackParamList>

	/**
	 * Whether this is nested in the player modal
	 */
	isNested: boolean | undefined
}

export default function TrackOptions({
	track,
	navigation,
	isNested,
}: TrackOptionsProps): React.JSX.Element {
	const { api, user, library } = useJellifyContext()

	const { data: album, isSuccess: albumFetchSuccess } = useQuery({
		queryKey: [QueryKeys.Item, track.AlbumId!],
		queryFn: () => fetchItem(api, track.AlbumId!),
	})

	const { useDownload, useRemoveDownload, downloadedTracks } = useNetworkContext()

	const isDownloaded = downloadedTracks?.find((t) => t.item.Id === track.Id)?.item?.Id

	const {
		data: playlists,
		isPending: playlistsFetchPending,
		isSuccess: playlistsFetchSuccess,
	} = useQuery({
		queryKey: [QueryKeys.UserPlaylists],
		queryFn: () => fetchUserPlaylists(api, user, library),
	})

	// Fetch all playlist tracks to check if the current track is already in any playlists
	const playlistsWithTracks = useQuery({
		queryKey: [QueryKeys.PlaylistItemCheckCache, playlists?.map((p) => p.Id).join(',')],
		enabled: !!playlists && playlists.length > 0,
		queryFn: () => {
			console.debug('Fetching playlist contents')
			return Promise.all(
				playlists!.map(async (playlist) => {
					const response = await getItemsApi(api!).getItems({
						parentId: playlist.Id!,
					})
					return {
						playlistId: playlist.Id!,
						tracks: response.data.Items || [],
					}
				}),
			)
		},
	})

	// Check if a track is in a playlist
	const isTrackInPlaylist = useMemo(() => {
		if (!playlistsWithTracks.data) return {}

		const result: Record<string, boolean> = {}
		playlistsWithTracks.data.forEach((playlistData) => {
			result[playlistData.playlistId] = playlistData.tracks.some(
				(playlistTrack) => playlistTrack.Id === track.Id,
			)
		})
		return result
	}, [playlistsWithTracks.data, track.Id])

	const { useAddToQueue } = useQueueContext()

	const { width } = useSafeAreaFrame()

	const useAddToPlaylist = useMutation({
		mutationFn: ({ track, playlist }: AddToPlaylistMutation) => {
			trigger('impactLight')
			return addToPlaylist(api, user, track, playlist)
		},
		onSuccess: (data, { playlist }) => {
			Toast.show({
				text1: 'Added to playlist',
				type: 'success',
			})

			trigger('notificationSuccess')

			queryClient.invalidateQueries({
				queryKey: [QueryKeys.UserPlaylists],
			})

			queryClient.invalidateQueries({
				queryKey: [QueryKeys.ItemTracks, playlist.Id!],
			})

			// Invalidate our playlist check cache
			queryClient.invalidateQueries({
				queryKey: [QueryKeys.PlaylistItemCheckCache],
			})
		},
		onError: () => {
			Toast.show({
				text1: 'Unable to add',
				type: 'error',
			})

			trigger('notificationError')
		},
	})

	return (
		<YStack>
			<XStack marginHorizontal={'$2'} justifyContent='space-evenly'>
				{albumFetchSuccess && album ? (
					<IconButton
						name='music-box'
						title='Go to Album'
						onPress={() => {
							if (isNested) navigation.goBack()

							navigation.goBack()

							if (isNested)
								navigation.navigate('Tabs', {
									screen: 'Home',
									params: {
										screen: 'Album',
										params: {
											album,
										},
									},
								})
							else
								navigation.navigate('Album', {
									album,
								})
						}}
						size={getToken('$12') + getToken('$10')}
					/>
				) : (
					<Spacer />
				)}

				<IconButton
					circular
					name='table-column-plus-before'
					title='Play Next'
					onPress={() => {
						useAddToQueue.mutate({
							track: track,
							queuingType: QueuingType.PlayingNext,
						})
					}}
					size={getToken('$12') + getToken('$10')}
				/>

				<IconButton
					circular
					name='table-column-plus-after'
					title='Queue'
					onPress={() => {
						useAddToQueue.mutate({
							track: track,
						})
					}}
					size={getToken('$12') + getToken('$10')}
				/>

				{useDownload.isPending ? (
					<Circle size={width / 6} disabled>
						<Spinner marginHorizontal={10} size='small' color={'$amethyst'} />
					</Circle>
				) : (
					<IconButton
						disabled={!!isDownloaded}
						circular
						name={isDownloaded ? 'delete' : 'download'}
						title={isDownloaded ? 'Remove Download' : 'Download'}
						onPress={() => {
							if (isDownloaded) useRemoveDownload.mutate(track)
							else useDownload.mutate(track)
						}}
						size={getToken('$12') + getToken('$10')}
					/>
				)}
			</XStack>

			<Spacer />

			{(playlistsFetchPending || playlistsWithTracks.isFetching) && <Spinner />}

			{!playlistsFetchPending && playlistsFetchSuccess && (
				<>
					<Text bold fontSize={'$6'}>
						Add to Playlist
					</Text>

					<YGroup separator={<Separator />}>
						{playlists?.map((playlist) => {
							const isInPlaylist = isTrackInPlaylist[playlist.Id!]

							return (
								<YGroup.Item key={playlist.Id!}>
									<ListItem
										hoverTheme
										disabled={isInPlaylist}
										opacity={isInPlaylist ? 0.7 : 1}
										onPress={() => {
											if (!isInPlaylist) {
												useAddToPlaylist.mutate({
													track,
													playlist,
												})
											}
										}}
									>
										<XStack alignItems='center'>
											<YStack flex={1}>
												<FastImage
													source={{
														uri: getImageApi(api!).getItemImageUrlById(
															playlist.Id!,
														),
													}}
													style={{
														borderRadius: getToken('$1.5'),
														width: getToken('$12'),
														height: getToken('$12'),
													}}
												/>
											</YStack>

											<YStack alignItems='flex-start' flex={5}>
												<Text bold fontSize={'$6'}>
													{playlist.Name ?? 'Untitled Playlist'}
												</Text>

												<Text color={getTokens().color.amethyst.val}>{`${
													playlist.ChildCount ?? 0
												} tracks`}</Text>
											</YStack>

											{isInPlaylist && (
												<Icon
													name='check-circle-outline'
													color={'$success'}
												/>
											)}
										</XStack>
									</ListItem>
								</YGroup.Item>
							)
						})}
					</YGroup>
				</>
			)}
		</YStack>
	)
}

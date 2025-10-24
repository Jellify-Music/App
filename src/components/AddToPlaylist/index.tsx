import { useMutation, useQuery } from '@tanstack/react-query'
import { useJellifyContext } from '../../providers'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { QueryKeys } from '../../enums/query-keys'
import { addManyToPlaylist, addToPlaylist } from '../../api/mutations/playlists'
import { queryClient } from '../../constants/query-client'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api'
import { useMemo } from 'react'
import Toast from 'react-native-toast-message'
import { YStack, XStack, Spacer, YGroup, Separator, ListItem, getTokens, ScrollView } from 'tamagui'
import Icon from '../Global/components/icon'
import { AddToPlaylistMutation } from './types'
import { Text } from '../Global/helpers/text'
import ItemImage from '../Global/components/image'
import TextTicker from 'react-native-text-ticker'
import { TextTickerConfig } from '../Player/component.config'
import { getItemName } from '../../utils/text'
import useHapticFeedback from '../../hooks/use-haptic-feedback'
import { useUserPlaylists } from '../../api/queries/playlist'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function AddToPlaylist({
	track,
	tracks,
	source,
}: {
	track?: BaseItemDto
	tracks?: BaseItemDto[]
	source?: BaseItemDto
}): React.JSX.Element {
	const { api, user } = useJellifyContext()

	const trigger = useHapticFeedback()

	const { bottom } = useSafeAreaInsets()

	const {
		data: playlists,
		refetch,
		isPending: playlistsFetchPending,
		isSuccess: playlistsFetchSuccess,
	} = useUserPlaylists()

	// Fetch all playlist tracks to check if the current track(s) is/are already in any playlists
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
		const selectedTracks = tracks ?? (track ? [track] : [])
		const result: Record<string, boolean> = {}
		playlistsWithTracks.data.forEach((playlistData) => {
			result[playlistData.playlistId] = selectedTracks.length
				? selectedTracks.every((t) =>
						playlistData.tracks.some((playlistTrack) => playlistTrack.Id === t.Id),
					)
				: false
		})
		return result
	}, [playlistsWithTracks.data, track?.Id, tracks?.length])

	const useAddToPlaylist = useMutation({
		mutationFn: ({
			track,
			playlist,
			tracks,
		}: AddToPlaylistMutation & { tracks?: BaseItemDto[] }) => {
			trigger('impactLight')
			if (tracks && tracks.length > 0) {
				return addManyToPlaylist(api, user, tracks, playlist)
			}

			return addToPlaylist(api, user, track!, playlist)
		},
		onSuccess: (data, { playlist }) => {
			Toast.show({
				text1: 'Added to playlist',
				type: 'success',
			})

			trigger('notificationSuccess')

			if (refetch) void refetch()

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
		<ScrollView>
			{(source ?? track) && (
				<XStack gap={'$2'} margin={'$4'}>
					<ItemImage item={source ?? track!} width={'$12'} height={'$12'} />

					<YStack gap={'$2'} margin={'$2'}>
						<TextTicker {...TextTickerConfig}>
							<Text bold fontSize={'$6'}>
								{getItemName(source ?? track!)}
							</Text>
						</TextTicker>

						{(source ?? track)?.ArtistItems && (
							<TextTicker {...TextTickerConfig}>
								<Text bold>
									{`${(source ?? track)!.ArtistItems?.map((artist) => getItemName(artist)).join(',')}`}
								</Text>
							</TextTicker>
						)}
					</YStack>
				</XStack>
			)}

			{!playlistsFetchPending && playlistsFetchSuccess && (
				<YGroup separator={<Separator />} marginBottom={bottom} paddingBottom={'$10'}>
					{playlists?.map((playlist) => {
						const isInPlaylist = isTrackInPlaylist[playlist.Id!]

						return (
							<YGroup.Item key={playlist.Id!}>
								<ListItem
									animation={'quick'}
									disabled={isInPlaylist}
									hoverTheme
									opacity={isInPlaylist ? 0.7 : 1}
									pressStyle={{ opacity: 0.5 }}
									onPress={() => {
										if (!isInPlaylist) {
											useAddToPlaylist.mutate({
												track,
												tracks,
												playlist,
											})
										}
									}}
								>
									<XStack alignItems='center' gap={'$2'}>
										<ItemImage item={playlist} height={'$11'} width={'$11'} />

										<YStack alignItems='flex-start' flex={5}>
											<Text bold>{playlist.Name ?? 'Untitled Playlist'}</Text>

											<Text color={getTokens().color.amethyst.val}>{`${
												playlist.ChildCount ?? 0
											} tracks`}</Text>
										</YStack>

										{isInPlaylist ? (
											<Icon
												flex={1}
												name='check-circle-outline'
												color={'$success'}
											/>
										) : (
											<Spacer flex={1} />
										)}
									</XStack>
								</ListItem>
							</YGroup.Item>
						)
					})}
				</YGroup>
			)}
		</ScrollView>
	)
}

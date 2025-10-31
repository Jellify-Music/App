import { useMutation, useQuery } from '@tanstack/react-query'
import { useJellifyContext } from '../../providers'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { QueryKeys } from '../../enums/query-keys'
import { addManyToPlaylist, addToPlaylist } from '../../api/mutations/playlists'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api'
import { useState } from 'react'
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
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

export default function AddToPlaylist({
	track,
	tracks,
	source,
}: {
	track?: BaseItemDto
	tracks?: BaseItemDto[]
	source?: BaseItemDto
}): React.JSX.Element {
	const { bottom } = useSafeAreaInsets()

	const {
		data: playlists,
		isPending: playlistsFetchPending,
		isSuccess: playlistsFetchSuccess,
	} = useUserPlaylists()

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
									{`${(source ?? track)!.ArtistItems?.map((artist) => getItemName(artist)).join(', ')}`}
								</Text>
							</TextTicker>
						)}
					</YStack>
				</XStack>
			)}

			{!playlistsFetchPending && playlistsFetchSuccess && (
				<YGroup separator={<Separator />} marginBottom={bottom} paddingBottom={'$10'}>
					{playlists?.map((playlist) => (
						<AddToPlaylistRow
							key={playlist.Id}
							playlist={playlist}
							tracks={tracks ? tracks : track ? [track] : []}
						/>
					))}
				</YGroup>
			)}
		</ScrollView>
	)
}

function AddToPlaylistRow({
	playlist,
	tracks,
}: {
	playlist: BaseItemDto
	tracks: BaseItemDto[]
}): React.JSX.Element {
	const { api, user } = useJellifyContext()

	const trigger = useHapticFeedback()

	const {
		data: playlistTracks,
		isPending: fetchingPlaylistTracks,
		refetch: refetchPlaylistTracks,
	} = useQuery({
		queryKey: [QueryKeys.ItemTracks, playlist.Id!],
		queryFn: () => {
			return getItemsApi(api!)
				.getItems({
					parentId: playlist.Id!,
				})
				.then((response) => {
					return response.data.Items ? response.data.Items! : []
				})
		},
	})

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
			trigger('notificationSuccess')

			setIsInPlaylist(true)

			refetchPlaylistTracks()
		},
		onError: () => {
			Toast.show({
				text1: 'Unable to add',
				type: 'error',
			})

			trigger('notificationError')
		},
	})

	const [isInPlaylist, setIsInPlaylist] = useState<boolean>(
		tracks.filter((track) =>
			playlistTracks?.map((playlistTrack) => playlistTrack.Id).includes(track.Id),
		).length > 0,
	)

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
							track: undefined,
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
							playlistTracks?.length ?? 0
						} tracks`}</Text>
					</YStack>

					<Animated.View entering={FadeIn} exiting={FadeOut}>
						{isInPlaylist ? (
							<Icon flex={1} name='check-circle-outline' color={'$success'} />
						) : (
							<Spacer flex={1} />
						)}
					</Animated.View>
				</XStack>
			</ListItem>
		</YGroup.Item>
	)
}

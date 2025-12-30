import { useMutation } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { addManyToPlaylist, addToPlaylist } from '../../api/mutations/playlists'
import { useState } from 'react'
import Toast from 'react-native-toast-message'
import {
	YStack,
	XStack,
	Spacer,
	YGroup,
	Separator,
	ListItem,
	getTokens,
	ScrollView,
	useTheme,
	Spinner,
} from 'tamagui'
import Icon from '../Global/components/icon'
import { AddToPlaylistMutation } from './types'
import { Text } from '../Global/helpers/text'
import ItemImage from '../Global/components/image'
import TextTicker from 'react-native-text-ticker'
import { TextTickerConfig } from '../Player/component.config'
import { getItemName } from '../../utils/text'
import useHapticFeedback from '../../hooks/use-haptic-feedback'
import { usePlaylistTracks, useUserPlaylists } from '../../api/queries/playlist'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useApi, useJellifyUser } from '../../stores'
import Animated, { Easing, FadeIn, FadeOut } from 'react-native-reanimated'
import JellifyToastConfig from '../../configs/toast.config'

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

	const theme = useTheme()

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

			<Toast
				position='bottom'
				bottomOffset={bottom * 2.5}
				config={JellifyToastConfig(theme)}
			/>
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
	const api = useApi()
	const [user] = useJellifyUser()

	const trigger = useHapticFeedback()

	const {
		data: playlistTracks,
		isPending: fetchingPlaylistTracks,
		refetch: refetchPlaylistTracks,
	} = usePlaylistTracks(playlist)

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
				opacity={isInPlaylist ? 0.5 : 1}
				pressStyle={{ opacity: 0.6 }}
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

					<Animated.View
						entering={FadeIn.easing(Easing.in(Easing.ease))}
						exiting={FadeOut.easing(Easing.out(Easing.ease))}
					>
						{isInPlaylist ? (
							<Icon flex={1} name='check-circle-outline' color={'$success'} />
						) : fetchingPlaylistTracks ? (
							<Spinner color={'$primary'} />
						) : (
							<Spacer flex={1} />
						)}
					</Animated.View>
				</XStack>
			</ListItem>
		</YGroup.Item>
	)
}

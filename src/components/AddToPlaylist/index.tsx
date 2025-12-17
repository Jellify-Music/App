import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
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
import { Text } from '../Global/helpers/text'
import ItemImage from '../Global/components/image'
import TextTicker from 'react-native-text-ticker'
import { TextTickerConfig } from '../Player/component.config'
import { getItemName } from '../../utils/text'
import useHapticFeedback from '../../hooks/use-haptic-feedback'
import { useUserPlaylists } from '../../api/queries/playlist'
import { useAddToPlaylist, usePlaylistTracks } from '../../hooks/adapter/usePlaylists'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
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
	const trigger = useHapticFeedback()

	// Use adapter hook for playlist tracks - pass playlist ID string
	const { data: playlistTracks, isPending: fetchingPlaylistTracks } = usePlaylistTracks(
		playlist.Id,
	)

	// Use adapter hook for adding to playlist
	const addToPlaylistMutation = useAddToPlaylist()

	const [isInPlaylist, setIsInPlaylist] = useState<boolean>(
		tracks.filter((track) =>
			playlistTracks?.map((playlistTrack) => playlistTrack.id).includes(track.Id!),
		).length > 0,
	)

	const handleAddToPlaylist = async () => {
		if (isInPlaylist) return

		trigger('impactLight')
		try {
			const trackIds = tracks.map((t) => t.Id!).filter(Boolean)
			await addToPlaylistMutation.mutateAsync(playlist.Id!, trackIds)

			trigger('notificationSuccess')
			setIsInPlaylist(true)
		} catch {
			Toast.show({
				text1: 'Unable to add',
				type: 'error',
			})
			trigger('notificationError')
		}
	}

	return (
		<YGroup.Item key={playlist.Id!}>
			<ListItem
				animation={'quick'}
				disabled={isInPlaylist || addToPlaylistMutation.isPending}
				hoverTheme
				opacity={isInPlaylist ? 0.5 : 1}
				pressStyle={{ opacity: 0.6 }}
				onPress={handleAddToPlaylist}
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
						) : fetchingPlaylistTracks || addToPlaylistMutation.isPending ? (
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

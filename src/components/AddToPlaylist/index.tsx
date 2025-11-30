import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { addManyToPlaylist, addToPlaylist } from '../../api/mutations/playlists'
import { memo, useCallback, useMemo, useState } from 'react'
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
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useApi, useJellifyUser } from '../../stores'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import JellifyToastConfig from '../../configs/toast.config'
import { QueryKeys } from '../../enums/query-keys'

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

	// Memoize the tracks array to prevent unnecessary re-renders
	const tracksToAdd = useMemo(() => (tracks ? tracks : track ? [track] : []), [tracks, track])

	// Memoize the display item to prevent recalculation
	const displayItem = useMemo(() => source ?? track, [source, track])

	return (
		<ScrollView>
			{displayItem && (
				<XStack gap={'$2'} margin={'$4'}>
					<ItemImage item={displayItem} width={'$12'} height={'$12'} />

					<YStack gap={'$2'} margin={'$2'}>
						<TextTicker {...TextTickerConfig}>
							<Text bold fontSize={'$6'}>
								{getItemName(displayItem)}
							</Text>
						</TextTicker>

						{displayItem.ArtistItems && (
							<TextTicker {...TextTickerConfig}>
								<Text bold>
									{displayItem.ArtistItems.map((artist) =>
										getItemName(artist),
									).join(', ')}
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
							tracks={tracksToAdd}
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

interface AddToPlaylistRowProps {
	playlist: BaseItemDto
	tracks: BaseItemDto[]
}

/**
 * Memoized row component to prevent unnecessary re-renders.
 * Uses ChildCount from playlist metadata instead of fetching all tracks,
 * significantly reducing API calls.
 */
const AddToPlaylistRow = memo(function AddToPlaylistRow({
	playlist,
	tracks,
}: AddToPlaylistRowProps): React.JSX.Element {
	const api = useApi()
	const [user] = useJellifyUser()
	const queryClient = useQueryClient()
	const trigger = useHapticFeedback()

	// Track local state for optimistic updates
	const [isAdded, setIsAdded] = useState(false)
	// Use ChildCount from playlist metadata - no need to fetch all tracks
	const [trackCount, setTrackCount] = useState(playlist.ChildCount ?? 0)

	const addToPlaylistMutation = useMutation({
		mutationFn: async () => {
			trigger('impactLight')
			if (tracks.length > 1) {
				return addManyToPlaylist(api, user, tracks, playlist)
			}
			return addToPlaylist(api, user, tracks[0], playlist)
		},
		onSuccess: () => {
			trigger('notificationSuccess')
			// Optimistic update
			setIsAdded(true)
			setTrackCount((prev) => prev + tracks.length)
			// Invalidate the playlist tracks cache for this specific playlist
			queryClient.invalidateQueries({
				queryKey: [QueryKeys.ItemTracks, playlist.Id],
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

	const handlePress = useCallback(() => {
		if (!isAdded && !addToPlaylistMutation.isPending) {
			addToPlaylistMutation.mutate()
		}
	}, [isAdded, addToPlaylistMutation])

	const isDisabled = isAdded || addToPlaylistMutation.isPending

	return (
		<YGroup.Item key={playlist.Id!}>
			<ListItem
				animation={'quick'}
				disabled={isDisabled}
				hoverTheme
				opacity={isDisabled ? 0.5 : 1}
				pressStyle={{ opacity: 0.6 }}
				onPress={handlePress}
			>
				<XStack alignItems='center' gap={'$2'}>
					<ItemImage item={playlist} height={'$11'} width={'$11'} />

					<YStack alignItems='flex-start' flex={5}>
						<Text bold>{playlist.Name ?? 'Untitled Playlist'}</Text>

						<Text color={getTokens().color.amethyst.val}>{`${trackCount} tracks`}</Text>
					</YStack>

					<Animated.View entering={FadeIn} exiting={FadeOut}>
						{isAdded ? (
							<Icon flex={1} name='check-circle-outline' color={'$success'} />
						) : addToPlaylistMutation.isPending ? (
							<Spinner color={'$primary'} />
						) : (
							<Spacer flex={1} />
						)}
					</Animated.View>
				</XStack>
			</ListItem>
		</YGroup.Item>
	)
})

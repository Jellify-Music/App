import React, { useCallback, useEffect, useState } from 'react'
import Track from '../Global/components/track'
import { FlatList } from 'react-native'
import { getTokens, Separator, XStack, YStack, Button } from 'tamagui'
import { Text } from '../Global/helpers/text'
import { StackParamList } from '../types'
import { BaseItemDto, UserItemDataDto } from '@jellyfin/sdk/lib/generated-client/models'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Queue } from '../../player/types/queue-item'
import { InfiniteData, useQuery, useMutation } from '@tanstack/react-query'
import { useNetworkContext } from '../../providers/Network'
import { queryClient } from '../../constants/query-client'
import { QueryKeys } from '../../enums/query-keys'
import { useJellifyContext } from '../../providers'
import { fetchUserPlaylists } from '../../api/queries/playlists'
import { addToPlaylist } from '../../api/mutations/playlists'
import Toast from 'react-native-toast-message'
import { trigger } from 'react-native-haptic-feedback'
import MultiSelectAddToPlaylistModal from '../Global/components/MultiSelectAddToPlaylistModal'

export default function Tracks({
	tracks,
	queue,
	fetchNextPage,
	hasNextPage,
	navigation,
	filterDownloaded,
	filterFavorites,
}: {
	tracks: InfiniteData<BaseItemDto[], unknown> | undefined
	queue: Queue
	fetchNextPage: () => void
	hasNextPage: boolean
	navigation: NativeStackNavigationProp<StackParamList>
	filterDownloaded?: boolean | undefined
	filterFavorites?: boolean | undefined
}): React.JSX.Element {
	const { downloadedTracks } = useNetworkContext()
	const { api, user, library } = useJellifyContext()

	// Multi-select state
	const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
	const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set())
	const [isPlaylistModalVisible, setIsPlaylistModalVisible] = useState(false)

	// Fetch user playlists for multi-select operations
	const { data: playlists } = useQuery({
		queryKey: [QueryKeys.UserPlaylists],
		queryFn: () => fetchUserPlaylists(api, user, library),
		enabled: isMultiSelectMode,
	})

	// Mutation for adding multiple tracks to playlist
	const useAddToPlaylist = useMutation({
		mutationFn: async ({
			tracks,
			playlist,
		}: {
			tracks: BaseItemDto[]
			playlist: BaseItemDto
		}) => {
			// Add tracks one by one (the API might not support batch operations)
			for (const track of tracks) {
				await addToPlaylist(api, user, track, playlist)
			}
			return { tracks, playlist }
		},
		onSuccess: (data) => {
			Toast.show({
				text1: `Added ${data.tracks.length} tracks to playlist`,
				type: 'success',
			})
			trigger('notificationSuccess')

			// Clear selection and exit multi-select mode
			setSelectedTracks(new Set())
			setIsMultiSelectMode(false)

			// Invalidate queries
			queryClient.invalidateQueries({
				queryKey: [QueryKeys.UserPlaylists],
			})
			queryClient.invalidateQueries({
				queryKey: [QueryKeys.ItemTracks, data.playlist.Id!],
			})
			setIsPlaylistModalVisible(false)
		},
		onError: () => {
			Toast.show({
				text1: 'Unable to add tracks to playlist',
				type: 'error',
			})
			trigger('notificationError')
		},
	})

	const handleStartMultiSelect = (track: BaseItemDto) => {
		trigger('impactMedium')
		setIsMultiSelectMode(true)
		setSelectedTracks(new Set([track.Id!]))
	}

	const handleSelectTrack = (track: BaseItemDto) => {
		setSelectedTracks((prev) => {
			const newSet = new Set(prev)
			if (newSet.has(track.Id!)) {
				newSet.delete(track.Id!)
			} else {
				newSet.add(track.Id!)
			}
			return newSet
		})
	}

	const handleExitMultiSelect = () => {
		setIsMultiSelectMode(false)
		setSelectedTracks(new Set())
	}

	const handleAddSelectedToPlaylist = (playlist: BaseItemDto) => {
		const allTracks = tracksToDisplay()
		const tracksToAdd = allTracks.filter((track) => selectedTracks.has(track.Id!))

		if (tracksToAdd.length > 0) {
			useAddToPlaylist.mutate({ tracks: tracksToAdd, playlist })
		}
	}

	const handleOpenPlaylistModal = () => {
		if (selectedTracks.size > 0) {
			setIsPlaylistModalVisible(true)
		}
	}

	const handleSelectAll = () => {
		const allTracks = tracksToDisplay()
		const allTrackIds = allTracks.map((track) => track.Id!).filter(Boolean)

		if (selectedTracks.size === allTrackIds.length) {
			// Deselect all if all are selected
			setSelectedTracks(new Set())
			trigger('impactLight')
		} else {
			// Select all tracks
			setSelectedTracks(new Set(allTrackIds))
			trigger('impactMedium')
		}
	}

	const tracksToDisplay: () => BaseItemDto[] = useCallback(() => {
		if (filterDownloaded) {
			return (
				downloadedTracks
					?.map((downloadedTrack) => downloadedTrack.item)
					.filter((downloadedTrack) => {
						if (filterFavorites) {
							return (
								(
									queryClient.getQueryData([
										QueryKeys.UserData,
										downloadedTrack.Id,
									]) as UserItemDataDto | undefined
								)?.IsFavorite ?? false
							)
						}
						return true
					}) ?? []
			)
		}
		return tracks?.pages.flatMap((page) => page) ?? []
	}, [filterDownloaded, downloadedTracks, tracks, filterFavorites])

	return (
		<>
			{isMultiSelectMode && (
				<YStack
					backgroundColor={'$background'}
					borderBottomWidth={1}
					borderBottomColor={'$borderColor'}
					paddingBottom={'$2'}
				>
					<XStack padding={'$3'} alignItems='center' justifyContent='space-between'>
						<XStack alignItems='center' gap={'$3'}>
							<Button variant='outlined' size={'$3'} onPress={handleExitMultiSelect}>
								Cancel
							</Button>
							<Text
								bold
							>{`${selectedTracks.size} of ${tracksToDisplay().length} selected`}</Text>
						</XStack>

						<Button variant='outlined' size={'$3'} onPress={handleSelectAll}>
							{selectedTracks.size === tracksToDisplay().length
								? 'Deselect All'
								: 'Select All'}
						</Button>
					</XStack>

					{selectedTracks.size > 0 && (
						<XStack paddingHorizontal={'$3'} paddingTop={'$2'} justifyContent='center'>
							<Button
								flex={1}
								onPress={handleOpenPlaylistModal}
								disabled={!playlists || playlists.length === 0}
							>
								Add to Playlist...
							</Button>
						</XStack>
					)}
				</YStack>
			)}

			<FlatList
				contentInsetAdjustmentBehavior='automatic'
				contentContainerStyle={{
					marginVertical: getTokens().size.$1.val,
				}}
				ItemSeparatorComponent={() => <Separator />}
				numColumns={1}
				data={tracksToDisplay()}
				renderItem={({ index, item: track }) => (
					<Track
						navigation={navigation}
						showArtwork
						index={0}
						track={track}
						tracklist={tracksToDisplay().slice(index, index + 50)}
						queue={queue}
						isMultiSelectMode={isMultiSelectMode}
						isSelected={selectedTracks.has(track.Id!)}
						onSelect={handleSelectTrack}
						onStartMultiSelect={handleStartMultiSelect}
					/>
				)}
				removeClippedSubviews
				onEndReached={() => {
					if (hasNextPage) fetchNextPage()
				}}
				onEndReachedThreshold={0.0}
			/>
			{isMultiSelectMode && playlists && (
				<MultiSelectAddToPlaylistModal
					isVisible={isPlaylistModalVisible}
					onClose={() => setIsPlaylistModalVisible(false)}
					playlists={playlists}
					onSelectPlaylist={handleAddSelectedToPlaylist}
					isLoading={useAddToPlaylist.isPending}
				/>
			)}
		</>
	)
}

import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { useMutation, UseMutationResult, useQuery } from '@tanstack/react-query'
import { QueryKeys } from '../../enums/query-keys'
import { useJellifyContext } from '..'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api'
import { removeFromPlaylist, updatePlaylist } from '../../api/mutations/playlists'
import { RemoveFromPlaylistMutation } from '../../components/Playlist/interfaces'
import { SharedValue, useSharedValue } from 'react-native-reanimated'
import useHapticFeedback from '../../hooks/use-haptic-feedback'

interface PlaylistContext {
	playlist: BaseItemDto
	playlistTracks: BaseItemDto[] | undefined
	refetch: () => void
	isPending: boolean
	editing: boolean
	setEditing: (editing: boolean) => void
	setPlaylistTracks: (tracks: BaseItemDto[]) => void
	useUpdatePlaylist: UseMutationResult<
		void,
		Error,
		{ playlist: BaseItemDto; tracks: BaseItemDto[] }
	>
	useRemoveFromPlaylist: UseMutationResult<
		void,
		Error,
		{ playlist: BaseItemDto; track: BaseItemDto; index: number }
	>
	scroll: SharedValue<number>
}

const PlaylistContextInitializer = (playlist: BaseItemDto) => {
	const { api } = useJellifyContext()

	const canEdit = playlist.CanDelete
	const [editing, setEditing] = useState<boolean>(false)

	const [playlistTracks, setPlaylistTracks] = useState<BaseItemDto[] | undefined>(undefined)

	const scroll = useSharedValue(0)

	const trigger = useHapticFeedback()

	const {
		data: tracks,
		isPending,
		refetch,
		isSuccess,
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

	const useUpdatePlaylist = useMutation({
		mutationFn: ({ playlist, tracks }: { playlist: BaseItemDto; tracks: BaseItemDto[] }) => {
			return updatePlaylist(
				api,
				playlist.Id!,
				playlist.Name!,
				tracks.map((track) => track.Id!),
			)
		},
		onSuccess: () => {
			trigger('notificationSuccess')

			// Refresh playlist component data
			refetch()
		},
		onError: () => {
			trigger('notificationError')

			setPlaylistTracks(tracks ?? [])
		},
	})

	const useRemoveFromPlaylist = useMutation({
		mutationFn: ({ playlist, track, index }: RemoveFromPlaylistMutation) => {
			return removeFromPlaylist(api, track, playlist)
		},
		onSuccess: (data, { index }) => {
			trigger('notificationSuccess')

			if (playlistTracks) {
				setPlaylistTracks(
					playlistTracks
						.slice(0, index)
						.concat(playlistTracks.slice(index + 1, playlistTracks.length - 1)),
				)
			}
		},
		onError: () => {
			trigger('notificationError')
		},
	})

	useEffect(() => {
		if (!isPending && isSuccess) setPlaylistTracks(tracks)
	}, [tracks, isPending, isSuccess])

	useEffect(() => {
		if (!editing) refetch()
	}, [editing])

	return {
		playlist,
		playlistTracks,
		refetch,
		isPending,
		editing,
		setEditing,
		setPlaylistTracks,
		useUpdatePlaylist,
		useRemoveFromPlaylist,
		scroll,
	}
}

const PlaylistContext = createContext<PlaylistContext>({
	playlist: {},
	playlistTracks: undefined,
	refetch: () => {},
	isPending: false,
	editing: false,
	setEditing: () => {},
	setPlaylistTracks: () => {},
	useUpdatePlaylist: {
		mutate: () => {},
		mutateAsync: async (variables) => {},
		data: undefined,
		error: null,
		variables: undefined,
		isError: false,
		isIdle: true,
		isPaused: false,
		isPending: false,
		isSuccess: false,
		status: 'idle',
		reset: () => {},
		context: {},
		failureCount: 0,
		failureReason: null,
		submittedAt: 0,
	},
	useRemoveFromPlaylist: {
		mutate: () => {},
		mutateAsync: async (variables) => {},
		data: undefined,
		error: null,
		variables: undefined,
		isError: false,
		isIdle: true,
		isPaused: false,
		isPending: false,
		isSuccess: false,
		status: 'idle',
		reset: () => {},
		context: {},
		failureCount: 0,
		failureReason: null,
		submittedAt: 0,
	},
	scroll: { value: 0 } as SharedValue<number>,
})

export const PlaylistProvider = ({
	playlist,
	children,
}: {
	playlist: BaseItemDto
	children: ReactNode
}) => {
	const context = PlaylistContextInitializer(playlist)

	return <PlaylistContext.Provider value={context}>{children}</PlaylistContext.Provider>
}

export const usePlaylistContext = () => useContext(PlaylistContext)

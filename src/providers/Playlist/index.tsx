import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { UseMutateFunction, useMutation, useQueryClient } from '@tanstack/react-query'
import {
	createContext,
	ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react'
import { updatePlaylist } from '../../api/mutations/playlists'
import useHapticFeedback from '../../hooks/use-haptic-feedback'
import { useApi } from '../../stores'
import { usePlaylistTracks } from '../../api/queries/playlist'
import { PlaylistTracksQueryKey } from '../../api/queries/playlist/keys'
import uuid from 'react-native-uuid'

export type PlaylistTrack = BaseItemDto & { _uniqueId: string }

interface PlaylistContext {
	playlist: BaseItemDto
	playlistTracks: PlaylistTrack[] | undefined
	refetch: () => void
	isPending: boolean
	editing: boolean
	setEditing: (editing: boolean) => void
	newName: string
	setNewName: (name: string) => void
	setPlaylistTracks: (tracks: PlaylistTrack[]) => void
	useUpdatePlaylist: UseMutateFunction<
		void,
		Error,
		{
			playlist: BaseItemDto
			tracks: PlaylistTrack[]
			newName: string
		},
		unknown
	>
	isUpdating?: boolean
	handleCancel: () => void
}

const PlaylistContextInitializer = (playlist: BaseItemDto) => {
	const api = useApi()
	const queryClient = useQueryClient()

	const [editing, setEditing] = useState<boolean>(false)
	const [newName, setNewName] = useState<string>(playlist.Name ?? '')
	const [playlistTracks, setPlaylistTracks] = useState<PlaylistTrack[] | undefined>(undefined)

	const trigger = useHapticFeedback()

	const { data: tracks, isPending, refetch, isSuccess } = usePlaylistTracks(playlist)

	const { mutate: useUpdatePlaylist, isPending: isUpdating } = useMutation({
		mutationFn: ({
			playlist,
			tracks,
			newName,
		}: {
			playlist: BaseItemDto
			tracks: PlaylistTrack[]
			newName: string
		}) => {
			return updatePlaylist(
				api,
				playlist.Id!,
				newName,
				tracks.map((track) => track.Id!),
			)
		},
		onSuccess: () => {
			trigger('notificationSuccess')
			// Invalidate cache to trigger refetch
			queryClient.invalidateQueries({
				queryKey: PlaylistTracksQueryKey(playlist.Id!),
			})
		},
		onError: () => {
			trigger('notificationError')
			setNewName(playlist.Name ?? '')
			if (tracks) {
				setPlaylistTracks(tracks.map((t) => ({ ...t, _uniqueId: uuid.v4() as string })))
			}
		},
		onSettled: () => {
			setEditing(false)
		},
	})

	const handleCancel = useCallback(() => {
		setEditing(false)
		setNewName(playlist.Name ?? '')
		if (tracks) {
			setPlaylistTracks(tracks.map((t) => ({ ...t, _uniqueId: uuid.v4() as string })))
		}
	}, [playlist.Name, tracks])

	// Sync tracks from query to local state when data loads
	useEffect(() => {
		if (!isPending && isSuccess && tracks && Array.isArray(tracks)) {
			setPlaylistTracks(tracks.map((t) => ({ ...t, _uniqueId: uuid.v4() as string })))
		}
	}, [tracks, isPending, isSuccess])

	// Refetch when exiting edit mode
	useEffect(() => {
		if (!editing) {
			refetch()
		}
	}, [editing, refetch])

	return useMemo(
		() => ({
			playlist,
			playlistTracks,
			refetch,
			isPending,
			editing,
			setEditing,
			newName,
			setNewName,
			setPlaylistTracks,
			useUpdatePlaylist,
			handleCancel,
			isUpdating,
		}),
		[
			playlist,
			playlistTracks,
			refetch,
			isPending,
			editing,
			newName,
			useUpdatePlaylist,
			handleCancel,
			isUpdating,
		],
	)
}

const PlaylistContext = createContext<PlaylistContext>({
	playlist: {},
	playlistTracks: undefined,
	refetch: () => {},
	isPending: false,
	editing: false,
	setEditing: () => {},
	newName: '',
	setNewName: () => {},
	setPlaylistTracks: () => {},
	useUpdatePlaylist: () => {},
	handleCancel: () => {},
	isUpdating: false,
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

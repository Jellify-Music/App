import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { UseMutateFunction, useMutation } from '@tanstack/react-query'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { updatePlaylist } from '../../api/mutations/playlists'
import { SharedValue, useSharedValue } from 'react-native-reanimated'
import useHapticFeedback from '../../hooks/use-haptic-feedback'
import { useApi } from '../../stores'
import { usePlaylistTracks } from '../../api/queries/playlist'

interface PlaylistContext {
	playlist: BaseItemDto
	playlistTracks: BaseItemDto[] | undefined
	refetch: () => void
	isPending: boolean
	editing: boolean
	setEditing: (editing: boolean) => void
	newName: string
	setNewName: (name: string) => void
	setPlaylistTracks: (tracks: BaseItemDto[]) => void
	useUpdatePlaylist: UseMutateFunction<
		void,
		Error,
		{
			playlist: BaseItemDto
			tracks: BaseItemDto[]
			newName: string
		},
		unknown
	>
	isUpdating?: boolean
	handleCancel: () => void
}

const PlaylistContextInitializer = (playlist: BaseItemDto) => {
	const api = useApi()

	const canEdit = playlist.CanDelete
	const [editing, setEditing] = useState<boolean>(false)

	const [newName, setNewName] = useState<string>(playlist.Name ?? '')

	const [playlistTracks, setPlaylistTracks] = useState<BaseItemDto[] | undefined>(undefined)

	const trigger = useHapticFeedback()

	const { data: tracks, isPending, refetch, isSuccess } = usePlaylistTracks(playlist)

	const { mutate: useUpdatePlaylist, isPending: isUpdating } = useMutation({
		mutationFn: ({
			playlist,
			tracks,
			newName,
		}: {
			playlist: BaseItemDto
			tracks: BaseItemDto[]
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

			// Refresh playlist component data
			refetch()
		},
		onError: () => {
			trigger('notificationError')
			setNewName(playlist.Name ?? '')
			setPlaylistTracks(tracks ?? [])
		},
		onSettled: () => {
			setEditing(false)
		},
	})

	const handleCancel = () => {
		setEditing(false)
		setNewName(playlist.Name ?? '')
		setPlaylistTracks(tracks)
	}

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
		newName,
		setNewName,
		setPlaylistTracks,
		useUpdatePlaylist,
		handleCancel,
		isUpdating,
	}
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

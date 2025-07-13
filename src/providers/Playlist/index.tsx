import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { UseMutateFunction, useMutation, UseMutationResult, useQuery } from '@tanstack/react-query'
import { QueryKeys } from '../../enums/query-keys'
import { useJellifyContext } from '..'
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api'
import { trigger } from 'react-native-haptic-feedback'
import { removeFromPlaylist, updatePlaylist } from '../../api/mutations/playlists'
import { RemoveFromPlaylistMutation } from '../../components/Playlist/interfaces'
import { SharedValue, useSharedValue } from 'react-native-reanimated'

interface PlaylistContext {
	playlist: BaseItemDto
	playlistTracks: BaseItemDto[] | undefined
	setPlaylistTracks: (tracks: BaseItemDto[]) => void
	refetch: () => void
	isPending: boolean
	editing: boolean
	setEditing: (editing: boolean) => void
	mutatePlaylist: UseMutateFunction<
		void,
		Error,
		{
			playlist: BaseItemDto
			tracks: BaseItemDto[]
		},
		unknown
	>
	useRemoveFromPlaylist: UseMutationResult<
		void,
		Error,
		{ playlist: BaseItemDto; track: BaseItemDto; index: number }
	>
}

function PlaylistContextInitializer(playlist: BaseItemDto): PlaylistContext {
	const { api } = useJellifyContext()

	const [editing, setEditing] = useState<boolean>(false)

	const [playlistTracks, setPlaylistTracks] = useState<BaseItemDto[] | undefined>(undefined)

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

	const { mutate: mutatePlaylist } = useMutation({
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
		setPlaylistTracks,
		refetch,
		isPending,
		editing,
		setEditing,
		mutatePlaylist,
		useRemoveFromPlaylist,
	}
}

const PlaylistContext = createContext<PlaylistContext>({
	playlist: {},
	playlistTracks: undefined,
	setPlaylistTracks: () => {},
	refetch: () => {},
	isPending: false,
	editing: false,
	setEditing: () => {},
	mutatePlaylist: () => {},
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
})

export const PlaylistProvider = ({
	playlist,
	children,
}: {
	playlist: BaseItemDto
	children: ReactNode
}) => {
	const context = PlaylistContextInitializer(playlist)

	const value = useMemo(() => context, [context.editing, context.playlistTracks])
	return <PlaylistContext.Provider value={value}>{children}</PlaylistContext.Provider>
}

export const usePlaylistContext = () => useContext(PlaylistContext)

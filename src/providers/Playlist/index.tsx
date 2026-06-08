import { useUpdatePlaylist } from '../../api/mutations/playlist'
import { usePlaylistTracks } from '../../api/queries/playlist'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import {
	FetchNextPageOptions,
	InfiniteQueryObserverResult,
	QueryObserverResult,
	RefetchOptions,
	UseMutateFunction,
} from '@tanstack/react-query'
import {
	createContext,
	Dispatch,
	ReactNode,
	RefObject,
	SetStateAction,
	use,
	useEffect,
	useRef,
	useState,
} from 'react'
import { applyHapticFeedback } from '../../utils/haptics'
import { SortableReorderEvent } from 'react-native-drax'

interface PlaylistContext {
	playlist: BaseItemDto
	canEdit?: boolean
	editing: boolean
	setEditing: Dispatch<SetStateAction<boolean>>
	newName: string
	setNewName: Dispatch<SetStateAction<string>>
	onCancelEditing: () => void
	onRemoveTrack: (track: BaseItemDto) => void
	onReorder: (event: SortableReorderEvent<BaseItemDto>) => void
	updatePlaylist: UseMutateFunction<
		void,
		Error,
		{
			playlist: BaseItemDto
			tracks: BaseItemDto[]
			newName: string
		},
		unknown
	>
	isUpdatingPlaylist: boolean
	playlistTracks: BaseItemDto[] | undefined

	playlistTrackIds: RefObject<string[]>

	refetch: (
		options?: RefetchOptions | undefined,
	) => Promise<QueryObserverResult<BaseItemDto[], Error>>
	isPending: boolean
	hasNextPage: boolean
	fetchNextPage: (
		options?: FetchNextPageOptions,
	) => Promise<InfiniteQueryObserverResult<BaseItemDto[], Error>>
	isFetchingNextPage: boolean
}

const PlaylistContext = createContext<PlaylistContext>({
	playlist: {},
	canEdit: true,
	editing: false,
	setEditing: () => {},
	newName: '',
	setNewName: () => {},
	onCancelEditing: () => {},
	onReorder: (e) => {},
	onRemoveTrack: (track) => {},
	updatePlaylist: () => Promise.resolve(),
	isUpdatingPlaylist: false,
	playlistTracks: undefined,
	playlistTrackIds: {
		current: [],
	},
	refetch: () => Promise.resolve({} as QueryObserverResult<BaseItemDto[], Error>),
	isPending: false,
	hasNextPage: false,
	fetchNextPage: () => Promise.resolve({} as InfiniteQueryObserverResult<BaseItemDto[], Error>),
	isFetchingNextPage: false,
})

interface PlaylistProviderProps {
	playlist: BaseItemDto
	canEdit?: boolean
	children: ReactNode
}

export const PlaylistProvider = ({ playlist, canEdit, children }: PlaylistProviderProps) => {
	const playlistTrackIds = useRef<string[]>([])

	const [editing, setEditing] = useState<boolean>(false)

	const [newName, setNewName] = useState<string>(playlist.Name ?? 'Untitled Playlist')

	const [playlistTracks, setPlaylistTracks] = useState<BaseItemDto[]>([])

	const {
		data: tracks,
		isPending,
		refetch,
		isSuccess,
		hasNextPage,
		fetchNextPage,
		isFetchingNextPage,
	} = usePlaylistTracks(playlist)

	const { mutate: updatePlaylist, isPending: isUpdatingPlaylist } = useUpdatePlaylist({
		onSettled: () => {
			setEditing(false)
		},
		onError: () => {
			applyHapticFeedback('error')
			setNewName(playlist.Name ?? '')
			setPlaylistTracks(tracks ?? [])
			playlistTrackIds.current = tracks?.map((track) => track.Id!) ?? []
		},
	})

	const onCancelEditing = () => {
		setEditing(false)
		setNewName(playlist.Name ?? '')
		setPlaylistTracks(tracks ?? [])
	}

	const onRemoveTrack = (track: BaseItemDto) => {
		;(playlistTracks ?? []).filter(({ Id }) => Id !== track.Id)
	}

	const onReorder = (event: SortableReorderEvent<BaseItemDto>) => {
		setPlaylistTracks(event.data)
	}

	useEffect(() => {
		if (!isPending && isSuccess) setPlaylistTracks(tracks)
	}, [tracks, isPending, isSuccess])

	useEffect(() => {
		if (!editing) refetch()
	}, [editing])

	const value = {
		playlist,
		canEdit,
		editing,
		setEditing,
		onCancelEditing,
		onRemoveTrack,
		onReorder,
		updatePlaylist,
		refetch,
		newName,
		setNewName,
		isUpdatingPlaylist,
		playlistTracks,
		playlistTrackIds,
		isPending,
		hasNextPage,
		fetchNextPage,
		isFetchingNextPage,
	}

	return <PlaylistContext value={value}>{children}</PlaylistContext>
}

export const usePlaylistContext = () => use(PlaylistContext)

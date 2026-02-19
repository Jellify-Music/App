import {
	PlaylistTracksQueryKey,
	PlaylistUsersQueryKey,
	PublicPlaylistsQueryKey,
	UserPlaylistsQueryKey,
} from './keys'
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query'
import { fetchUserPlaylists, fetchPublicPlaylists, fetchPlaylistTracks } from './utils'
import { ApiLimits } from '../../../configs/query.config'
import { getApi, getUser, useJellifyLibrary } from '../../../stores'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { QueryKeys } from '../../../enums/query-keys'
import { addPlaylistUser, getPlaylistUsers, removePlaylistUser } from './utils/users'
import { ONE_MINUTE } from '@/src/constants/query-client'

export const useUserPlaylists = () => {
	const api = getApi()
	const user = getUser()
	const [library] = useJellifyLibrary()

	return useInfiniteQuery({
		queryKey: UserPlaylistsQueryKey(library),
		queryFn: () => fetchUserPlaylists(api, user, library),
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			if (!lastPage) return undefined
			return lastPage.length === ApiLimits.Library ? lastPageParam + 1 : undefined
		},
	})
}

export const usePlaylistTracks = (playlist: BaseItemDto, disabled?: boolean | undefined) => {
	const api = getApi()

	return useInfiniteQuery({
		// Changed from QueryKeys.ItemTracks to avoid cache conflicts with old useQuery data
		queryKey: PlaylistTracksQueryKey(playlist),
		queryFn: ({ pageParam }) => fetchPlaylistTracks(api, playlist.Id!, pageParam),
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam) => {
			if (!lastPage) return undefined
			return lastPage.length === ApiLimits.Library ? lastPageParam + 1 : undefined
		},
		enabled: Boolean(api && playlist.Id && !disabled),
	})
}

export const usePublicPlaylists = () => {
	const api = getApi()
	const [library] = useJellifyLibrary()

	return useInfiniteQuery({
		queryKey: PublicPlaylistsQueryKey(library),
		queryFn: ({ pageParam }) => fetchPublicPlaylists(api, library, pageParam),
		select: (data) => data.pages.flatMap((page) => page),
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) =>
			lastPage.length > 0 ? lastPageParam + 1 : undefined,
		initialPageParam: 0,
	})
}

//hooks - used in react components
//invoke user functions (getPlaylistUsers, etc)
//following react convention
export const usePlaylistUsers = (playlist: BaseItemDto) => {
	return useQuery({
		queryKey: PlaylistUsersQueryKey(playlist),
		queryFn: () => getPlaylistUsers(playlist.Id!),
		staleTime: ONE_MINUTE * 15, //refreshes every 15mins
	})
}

interface addPlaylistUserMutation {
	playlistId: string
	userId: string
	CanEdit: boolean
}

//mutations not queries for add/remove
//no params
export const useAddPlaylistUser = () => {
	return useMutation({
		//playlistId: string, userId: string, CanEdit: boolean
		mutationFn: (variables: addPlaylistUserMutation) =>
			addPlaylistUser(variables.playlistId, variables.userId, variables.CanEdit),
	})
}

interface removePlaylistUser {
	playlistId: string
	userId: string
}

export const useRemovePlaylistUser = () => {
	return useMutation({
		mutationFn: (variables: removePlaylistUser) =>
			removePlaylistUser(variables.playlistId, variables.userId),
	})
}

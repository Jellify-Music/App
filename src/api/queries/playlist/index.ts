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
import { BaseItemDto, PlaylistUserPermissions, UserDto } from '@jellyfin/sdk/lib/generated-client'
import { QueryKeys } from '../../../enums/query-keys'
import { addPlaylistUser, getPlaylistUsers, removePlaylistUser } from './utils/users'
import { ONE_MINUTE, queryClient } from '../../../constants/query-client'
import { User } from '@sentry/react-native'
import { triggerHaptic } from '@/src/hooks/use-haptic-feedback'
import { previous } from '@/src/hooks/player/functions/controls'
import { userEvent } from '@testing-library/react-native'
import Toast from 'react-native-toast-message'

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
	playlist: BaseItemDto
	user: UserDto
	CanEdit: boolean
}

//mutations not queries for add/remove
//no params
export const useAddPlaylistUser = () => {
	return useMutation({
		//playlistId: string, userId: string, CanEdit: boolean
		mutationFn: (variables: addPlaylistUserMutation) =>
			addPlaylistUser(variables.playlist.Id!, variables.user.Id!, variables.CanEdit),

		onSuccess: (data, variables) => {
			triggerHaptic('notificationSuccess')
			queryClient.setQueryData(
				PlaylistUsersQueryKey(variables.playlist),
				(previous: PlaylistUserPermissions[] | undefined) => {
					if (previous == undefined) {
						//return
						return [{ userId: variables.user.Id, canEdit: true }]
					} else {
						return [...previous, { userId: variables.user.Id, canEdit: true }]
					}
				},
			)
		},

		onError: (error, variables) => {
			console.log(error)
			Toast.show({ type: 'error', text1: 'Unable to add user to playlist.' })
		},
	})
}

interface removePlaylistUser {
	playlist: BaseItemDto
	user: UserDto
}

//remove user as playlist collaborator
export const useRemovePlaylistUser = () => {
	return useMutation({
		mutationFn: (variables: removePlaylistUser) =>
			removePlaylistUser(variables.playlist.Id!, variables.user.Id!),
		onSuccess: (data, variables) => {
			triggerHaptic('notificationSuccess')
			queryClient.setQueryData(
				PlaylistUsersQueryKey(variables.playlist),
				(previous: PlaylistUserPermissions[] | undefined) => {
					if (previous == undefined) {
						//return
						return []
					} else {
						return previous.filter((user) => user.UserId != variables.user.Id)
					}
				},
			)
		},
	})
}

import { PlaylistUsersQueryKey } from './keys'
import { useMutation, useQuery } from '@tanstack/react-query'
import { BaseItemDto, PlaylistUserPermissions, UserDto } from '@jellyfin/sdk/lib/generated-client'
import { addPlaylistUser, getPlaylistUsers, removePlaylistUser } from './utils/users'
import Toast from 'react-native-toast-message'
import { PlaylistTracksQuery, PublicPlaylistsQuery, UserPlaylistsQuery } from './queries'
import { sortPlaylistsByName } from './utils/sort'
import { applyHapticFeedback } from '../../../utils/haptics'
import { queryClient } from '../../client'
import { QueryAges } from '../../../constants/durations'

/**
 * Fetches the user's playlists from the cache or server, sorted by name
 *
 * @returns The user's playlists, sorted by name
 */
export const useUserPlaylists = () =>
	useQuery({ ...UserPlaylistsQuery(), select: sortPlaylistsByName })

/**
 * The user's playlists, most recently updated first
 *
 * Reads from the same cache as {@link useUserPlaylists}, which Jellyfin returns
 * in this order, so it's kept in sync by the helpers in `cache.ts` without a
 * second request to the server
 *
 * @returns The user's playlists, most recently updated first
 */
export const useRecentlyUpdatedPlaylists = () => useQuery(UserPlaylistsQuery())

/**
 * The "public" playlists, which are accessible to all users and
 * are in the form of a .m3u or .m3u8 file in the music library.
 *
 * @returns The public playlists, sorted by name
 */
export const usePublicPlaylists = () => useQuery(PublicPlaylistsQuery())

/**
 * Fetches a playlist's tracks from the cache or server
 *
 * @param playlist The playlist whose tracks should be fetched
 * @param disabled Whether the query should be disabled
 * @returns The playlist's tracks
 */
export const usePlaylistTracks = (playlist: BaseItemDto, disabled?: boolean | undefined) => {
	const query = PlaylistTracksQuery(playlist)

	return useQuery({ ...query, enabled: query.enabled && !disabled })
}

//hooks - used in react components
//invoke user functions (getPlaylistUsers, etc)
//following react convention
export const usePlaylistUsers = (playlist: BaseItemDto) => {
	return useQuery({
		queryKey: PlaylistUsersQueryKey(playlist),
		queryFn: () => getPlaylistUsers(playlist.Id!),
		staleTime: QueryAges.OneMinute * 15, //refreshes every 15mins
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
			applyHapticFeedback('success')
			queryClient.setQueryData<PlaylistUserPermissions[] | undefined>(
				PlaylistUsersQueryKey(variables.playlist),
				(previous: PlaylistUserPermissions[] | undefined) => {
					if (previous == undefined) {
						//return
						return [{ UserId: variables.user.Id, CanEdit: true }]
					} else {
						return [...previous, { UserId: variables.user.Id, CanEdit: true }]
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
			applyHapticFeedback('success')
			queryClient.setQueryData<PlaylistUserPermissions[] | undefined>(
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

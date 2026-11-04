import { useEffect } from 'react'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { useUserPlaylists, usePublicPlaylists } from '../api/queries/playlist'
import usePlaylistArtistsStore from '../stores/playlist-artists'
import {
	retryPlaylistIndexing,
	startPlaylistIndexing,
	usePlaylistIndexStatus,
} from '../services/playlist-indexer'
import { mergePlaylists, summaryVersion } from '../utils/artist-playlists'

interface MergedPlaylists {
	user: BaseItemDto[] | undefined
	public: BaseItemDto[] | undefined
	playlists: BaseItemDto[]
	userPlaylistIds: Set<string>
}

let merged: MergedPlaylists | undefined

/**
 * Both playlist lists as one, sorted by name. Sorting thousands of playlists takes a moment, and
 * the lists change identity far less often than the hook renders, so the last result is kept
 * for as long as the lists are the same ones.
 */
function mergeLists(
	user: BaseItemDto[] | undefined,
	publicLists: BaseItemDto[] | undefined,
): MergedPlaylists {
	if (merged && merged.user === user && merged.public === publicLists) return merged

	const lists: MergedPlaylists = {
		user,
		public: publicLists,
		playlists: mergePlaylists(user, publicLists),
		userPlaylistIds: new Set((user ?? []).flatMap(({ Id }) => (Id ? [Id] : []))),
	}

	merged = lists

	return lists
}

/**
 * The playlists (the user's own and public ones) that an artist appears on.
 *
 * Jellyfin can't list the playlists containing an artist, so this relies on the playlist indexer,
 * which summarises every playlist by the artists on it. The indexer is shared and saves its work,
 * so a playlist is only ever read once until it changes, however many artists are looked at.
 * What's found so far is shown while the rest is still being read.
 */
export const useArtistPlaylists = (artist: BaseItemDto) => {
	const userPlaylistsQuery = useUserPlaylists()

	const publicPlaylistsQuery = usePublicPlaylists()

	const { playlists, userPlaylistIds } = mergeLists(
		userPlaylistsQuery.data,
		publicPlaylistsQuery.data,
	)

	const listsComplete = userPlaylistsQuery.isSuccess && publicPlaylistsQuery.isSuccess

	useEffect(() => startPlaylistIndexing(playlists, listsComplete), [playlists, listsComplete])

	const summaries = usePlaylistArtistsStore((state) => state.summaries)

	const failedPlaylists = usePlaylistIndexStatus((state) => state.failed)

	// A summary only counts while its playlist is unchanged
	const found: BaseItemDto[] = []
	let checked = 0

	for (const playlist of playlists) {
		const summary = summaries[playlist.Id!]

		if (summary?.version !== summaryVersion(playlist)) continue

		checked++

		if (artist.Id && summary.artistIds.includes(artist.Id)) found.push(playlist)
	}

	const failedLists = [userPlaylistsQuery, publicPlaylistsQuery].filter(
		(query) => query.isError,
	).length

	const retry = () => {
		if (userPlaylistsQuery.isError) userPlaylistsQuery.refetch()
		if (publicPlaylistsQuery.isError) publicPlaylistsQuery.refetch()

		retryPlaylistIndexing()
	}

	/** Fetches the playlist lists again, to pick up playlists added or edited since they were loaded */
	const refresh = async () => {
		await Promise.all([userPlaylistsQuery.refetch(), publicPlaylistsQuery.refetch()])
	}

	return {
		/** The playlists the artist was found on so far */
		playlists: found,
		userPlaylistIds,
		/** Whether there are playlists still to be looked at */
		isPending:
			userPlaylistsQuery.isPending ||
			publicPlaylistsQuery.isPending ||
			checked + failedPlaylists < playlists.length,
		/** How many playlists have been looked at, out of how many there are */
		checked,
		total: playlists.length,
		/** How many playlists couldn't be looked at */
		failedPlaylists,
		/** How many of the playlist lists couldn't be loaded */
		failedLists,
		retry,
		refresh,
		isRefreshing: userPlaylistsQuery.isRefetching || publicPlaylistsQuery.isRefetching,
	}
}

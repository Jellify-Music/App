import { useCallback, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useApi, useJellifyLibrary, useJellifyUser } from '../stores'
import { storage } from '../constants/storage'
import { QueryKeys } from '../enums/query-keys'
import { nitroFetch } from '../api/utils/nitro'
import useAppActive from './use-app-active'

const CACHE_COUNT_KEY = 'LIBRARY_CACHE_COUNTS'

interface LibraryCounts {
	artists: number
	albums: number
	tracks: number
	timestamp: number
}

/**
 * Hook that validates library cache on app focus.
 * Uses lightweight Limit=0 requests to check if total counts have changed.
 * If counts differ, invalidates relevant queries to trigger refetch.
 */
export default function useLibraryCacheValidation() {
	const api = useApi()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()
	const queryClient = useQueryClient()
	const isAppActive = useAppActive()
	const isValidating = useRef(false)
	const lastValidationTime = useRef(0)

	const getCachedCounts = useCallback((): LibraryCounts | null => {
		const stored = storage.getString(CACHE_COUNT_KEY)
		if (!stored) return null
		try {
			return JSON.parse(stored) as LibraryCounts
		} catch {
			return null
		}
	}, [])

	const setCachedCounts = useCallback((counts: LibraryCounts) => {
		storage.set(CACHE_COUNT_KEY, JSON.stringify(counts))
	}, [])

	const fetchCounts = useCallback(async (): Promise<LibraryCounts | null> => {
		if (!api || !user || !library?.musicLibraryId) return null

		try {
			// Fetch all counts in parallel using Limit=0
			const [artistsResponse, albumsResponse, tracksResponse] = await Promise.all([
				nitroFetch<{ TotalRecordCount: number }>(api, '/Artists/AlbumArtists', {
					ParentId: library.musicLibraryId,
					UserId: user.id,
					Limit: 0,
				}),
				nitroFetch<{ TotalRecordCount: number }>(api, '/Items', {
					ParentId: library.musicLibraryId,
					UserId: user.id,
					IncludeItemTypes: 'MusicAlbum',
					Recursive: true,
					Limit: 0,
				}),
				nitroFetch<{ TotalRecordCount: number }>(api, '/Items', {
					ParentId: library.musicLibraryId,
					UserId: user.id,
					IncludeItemTypes: 'Audio',
					Recursive: true,
					Limit: 0,
				}),
			])

			return {
				artists: artistsResponse.TotalRecordCount ?? 0,
				albums: albumsResponse.TotalRecordCount ?? 0,
				tracks: tracksResponse.TotalRecordCount ?? 0,
				timestamp: Date.now(),
			}
		} catch (error) {
			console.warn('[CacheValidation] Failed to fetch counts:', error)
			return null
		}
	}, [api, user, library])

	const validateCache = useCallback(async () => {
		// Prevent concurrent validations
		if (isValidating.current) return

		// Don't validate more than once per minute
		const now = Date.now()
		if (now - lastValidationTime.current < 60000) return

		isValidating.current = true
		lastValidationTime.current = now

		try {
			const serverCounts = await fetchCounts()
			if (!serverCounts) {
				isValidating.current = false
				return
			}

			const cachedCounts = getCachedCounts()

			// If no cached counts, just store current and return
			if (!cachedCounts) {
				setCachedCounts(serverCounts)
				isValidating.current = false
				return
			}

			// Check if any counts changed
			const artistsChanged = cachedCounts.artists !== serverCounts.artists
			const albumsChanged = cachedCounts.albums !== serverCounts.albums
			const tracksChanged = cachedCounts.tracks !== serverCounts.tracks

			if (artistsChanged) {
				console.debug(
					`[CacheValidation] Artists count changed: ${cachedCounts.artists} -> ${serverCounts.artists}`,
				)
				queryClient.invalidateQueries({ queryKey: [QueryKeys.InfiniteArtists] })
			}

			if (albumsChanged) {
				console.debug(
					`[CacheValidation] Albums count changed: ${cachedCounts.albums} -> ${serverCounts.albums}`,
				)
				queryClient.invalidateQueries({ queryKey: [QueryKeys.InfiniteAlbums] })
			}

			if (tracksChanged) {
				console.debug(
					`[CacheValidation] Tracks count changed: ${cachedCounts.tracks} -> ${serverCounts.tracks}`,
				)
				queryClient.invalidateQueries({ queryKey: [QueryKeys.InfiniteTracks] })
			}

			// Update cached counts
			setCachedCounts(serverCounts)
		} finally {
			isValidating.current = false
		}
	}, [fetchCounts, getCachedCounts, setCachedCounts, queryClient])

	// Validate cache when app becomes active
	useEffect(() => {
		if (isAppActive && api && user && library?.musicLibraryId) {
			validateCache()
		}
	}, [isAppActive, api, user, library?.musicLibraryId, validateCache])

	return { validateCache }
}

import { InfiniteData, QueryKey } from '@tanstack/react-query'
import {
	BaseItemDto,
	BaseItemDtoQueryResult,
	ItemSortBy,
} from '@jellyfin/sdk/lib/generated-client/models'
import { ArtistsApiGetAlbumArtistsRequest } from '@jellyfin/sdk/lib/generated-client/api/artists-api'
import { ItemsApiGetItemsRequest } from '@jellyfin/sdk/lib/generated-client/api/items-api'
import { getArtistsApi, getItemsApi } from '@jellyfin/sdk/lib/utils/api'
import { getApi } from '../../../stores/auth/utils'
import { queryClient } from '../../../constants/query-client'
import { ApiLimits } from '../../../configs/query.config'
import { getSectionLetter } from '../../../utils/query-selectors'
import {
	azRank,
	KnownPoint,
	locateBoundaryInPage,
	narrowBoundaryToPage,
	normalizedRank,
	recordKnownPoint,
} from './utils'

/**
 * The result of a completed A-Z jump, used to scroll the section list to the
 * start of the selected letter's section
 */
export type LetterJump = {
	letter: string

	/**
	 * Index of the first item of the letter's section within the full
	 * server-side result set
	 */
	targetIndex: number

	/**
	 * Index within the full server-side result set of the first item now
	 * held in the infinite query's cache
	 */
	windowStartIndex: number
}

/**
 * Jumps a library list to the given section letter, resolving to null when
 * there is nothing to jump to (empty result set)
 */
export type JumpToLetter = (letter: string) => Promise<LetterJump | null>

/**
 * The endpoint and query params backing the list being jumped. The params
 * must match the list's own query exactly — same filters, sort, and scope,
 * minus paging — or the resolved indices would point into the wrong list
 */
export type LetterJumpScope =
	| { endpoint: 'albumArtists'; params: ArtistsApiGetAlbumArtistsRequest }
	| { endpoint: 'items'; params: ItemsApiGetItemsRequest }

export type LetterJumpConfig = {
	scope: LetterJumpScope

	sortDescending: boolean

	/**
	 * Sort mode used to derive section letters, mirroring the sectioning in
	 * {@link flattenInfiniteQueryPages}
	 */
	sectionSortBy?: ItemSortBy

	/**
	 * When true, boundaries are resolved with a single NameLessThan count
	 * query per jump instead of a probe search. Only valid for lists ordered
	 * by SortName whose section letters also derive from SortName: the
	 * server applies NameLessThan to the stored (lowercased) SortName, so
	 * filter and order must agree. Never valid for tracks — Audio sort
	 * names are disc/track-number prefixed and unrelated to display order
	 */
	sortNameAligned: boolean

	/**
	 * Query key of the infinite query whose cache the jump repositions
	 */
	queryKey: QueryKey

	/**
	 * Fetches one page of the list, identical to the infinite query's own
	 * queryFn. pageNumber is the same pageParam the query uses
	 */
	fetchPage: (pageNumber: number) => Promise<BaseItemDto[]>

	pageSize?: number
}

/**
 * Accumulated knowledge about one list's server-side ordering: its total size
 * and every (index, letter-rank) sample resolved so far. Lives for the app
 * session, keyed by the list's query key — every jump makes later jumps on
 * the same list cheaper, typically reaching 0-1 probes after a few uses.
 */
type JumpMemo = {
	total?: number
	points: KnownPoint[]
}

const memoRegistry = new Map<string, JumpMemo>()

const MEMO_MAX_LISTS = 12

function memoFor(queryKey: QueryKey): JumpMemo {
	const key = JSON.stringify(queryKey)
	let memo = memoRegistry.get(key)

	if (!memo) {
		memo = { points: [] }
		memoRegistry.set(key, memo)

		if (memoRegistry.size > MEMO_MAX_LISTS) {
			const oldest = memoRegistry.keys().next().value
			if (oldest !== undefined) memoRegistry.delete(oldest)
		}
	}

	return memo
}

/** Test hook: drop all accumulated ordering knowledge */
export function clearLetterJumpMemo(): void {
	memoRegistry.clear()
}

/**
 * The network and cache operations a jump needs, injected so the jump logic
 * is testable without the SDK. {@link createLetterJump} binds the real ones.
 */
export type LetterJumpDeps = {
	/** Rank (and optionally result-set total) of the item at an index */
	probeAt: (index: number, withTotal: boolean) => Promise<{ rank?: number; total?: number }>

	/** Items sorting strictly before the (lowercase) letter, via NameLessThan */
	countSortingBefore: (lowercaseLetter: string) => Promise<number | undefined>

	fetchPage: (pageNumber: number) => Promise<BaseItemDto[]>

	/** The infinite query's raw (pre-select) cached pages, if any */
	readCachedWindow: () => { pageParams: number[]; pages: BaseItemDto[][] } | undefined

	/** Replaces the infinite query's cache with the single given page */
	repositionCache: (pageNumber: number, items: BaseItemDto[]) => Promise<void>

	rankOf: (item: BaseItemDto) => number

	pageSize: number
	sortDescending: boolean
	sortNameAligned: boolean
	memo: JumpMemo
}

/** The lowercase letter for a rank, for NameLessThan bounds: 1 → 'a' … 26 → 'z' */
function lowercaseLetterForRank(rank: number): string {
	return String.fromCharCode(96 + rank)
}

/**
 * Seeds the known-point list with the edges of the currently loaded window —
 * the cache already tells us which letters live at those indices for free
 */
function seedPointsFromWindow(deps: LetterJumpDeps): void {
	const window = deps.readCachedWindow()
	if (!window || window.pageParams.length === 0) return

	const windowStart = Math.min(...window.pageParams) * deps.pageSize
	const items = window.pages.flat()
	if (items.length === 0) return

	recordKnownPoint(deps.memo.points, { index: windowStart, rank: deps.rankOf(items[0]) })
	recordKnownPoint(deps.memo.points, {
		index: windowStart + items.length - 1,
		rank: deps.rankOf(items[items.length - 1]),
	})
}

/**
 * Repositions the query cache for a boundary, reusing the already-loaded
 * window or an already-fetched page when possible — at most one page fetch
 * per jump in every path.
 *
 * @returns The window start index and the letter jump's final shape
 */
async function finalizeJump(
	deps: LetterJumpDeps,
	letter: string,
	boundary: number,
	prefetched?: { pageNumber: number; items: BaseItemDto[] },
): Promise<LetterJump> {
	const pageNumber = Math.floor(boundary / deps.pageSize)

	const window = deps.readCachedWindow()
	const loadedPages = window?.pageParams ?? []

	if (loadedPages.includes(pageNumber)) {
		return {
			letter,
			targetIndex: boundary,
			windowStartIndex: Math.min(...loadedPages) * deps.pageSize,
		}
	}

	const items =
		prefetched && prefetched.pageNumber === pageNumber
			? prefetched.items
			: await deps.fetchPage(pageNumber)

	await deps.repositionCache(pageNumber, items)

	return { letter, targetIndex: boundary, windowStartIndex: pageNumber * deps.pageSize }
}

/**
 * Resolves where the letter's section starts and repositions the query cache
 * onto the page containing it.
 *
 * Request budget per jump on a SortName-aligned list: one COUNT query (plus a
 * one-time total probe per list) and at most one page fetch. On other lists:
 * an interpolated, memoized probe search narrowed only to page granularity —
 * the exact boundary comes from scanning the page that gets fetched anyway.
 */
export async function executeLetterJump(
	deps: LetterJumpDeps,
	letter: string,
): Promise<LetterJump | null> {
	const targetRank = azRank(letter)
	const targetNorm = normalizedRank(targetRank, deps.sortDescending)

	// The head of the list needs no resolution at all: '#' ascending and 'Z'
	// descending always sort first when present, and lower-bound semantics
	// put absent sections at the top anyway
	if (targetNorm === 0) {
		return finalizeJump(deps, letter, 0)
	}

	let total = deps.memo.total
	if (total === undefined) {
		const first = await deps.probeAt(0, true)
		total = first.total ?? 0
		deps.memo.total = total
		if (first.rank !== undefined) {
			recordKnownPoint(deps.memo.points, { index: 0, rank: first.rank })
		}
	}

	if (total === 0) return null

	// First item already sorts at-or-past the target: jump to the top
	const headPoint = deps.memo.points.find((point) => point.index === 0)
	if (headPoint && normalizedRank(headPoint.rank, deps.sortDescending) >= targetNorm) {
		return finalizeJump(deps, letter, 0)
	}

	if (deps.sortNameAligned) {
		// Ascending: the count of items before the letter is its start index.
		// Descending: everything at-or-after the section in ascending order
		// sorts before it when reversed, so the boundary is the complement
		// of the count before the NEXT letter
		const count = deps.sortDescending
			? await deps
					.countSortingBefore(lowercaseLetterForRank(targetRank + 1))
					.then((value) => (value === undefined ? undefined : total - value))
			: await deps.countSortingBefore(lowercaseLetterForRank(targetRank))

		if (count !== undefined) {
			const boundary = Math.min(Math.max(count, 0), total - 1)
			return finalizeJump(deps, letter, boundary)
		}
		// Count failed — fall through to the probe search
	}

	seedPointsFromWindow(deps)

	const bracket = await narrowBoundaryToPage({
		targetRank,
		total,
		pageSize: deps.pageSize,
		sortDescending: deps.sortDescending,
		probeRankAt: (index) => deps.probeAt(index, false).then((probe) => probe.rank),
		knownPoints: deps.memo.points,
	})

	const searchIndex = Math.min(Math.max(bracket.low, 0), total - 1)
	const pageNumber = Math.floor(searchIndex / deps.pageSize)
	const pageStartIndex = pageNumber * deps.pageSize

	// The bracket fits within one page: fetch it once and resolve the exact
	// boundary from its items. The same page then becomes the new window.
	const window = deps.readCachedWindow()
	const cachedPageIndex = window?.pageParams.indexOf(pageNumber) ?? -1
	const items =
		cachedPageIndex >= 0 ? window!.pages[cachedPageIndex] : await deps.fetchPage(pageNumber)

	const boundary = Math.min(
		locateBoundaryInPage({
			items,
			pageStartIndex,
			targetRank,
			sortDescending: deps.sortDescending,
			rankOf: deps.rankOf,
		}),
		total - 1,
	)

	if (items.length > 0) {
		recordKnownPoint(deps.memo.points, {
			index: pageStartIndex,
			rank: deps.rankOf(items[0]),
		})
		recordKnownPoint(deps.memo.points, {
			index: pageStartIndex + items.length - 1,
			rank: deps.rankOf(items[items.length - 1]),
		})
	}

	return finalizeJump(deps, letter, boundary, { pageNumber, items })
}

type ItemsResponse = BaseItemDtoQueryResult

type ProbeOverrides = {
	startIndex: number
	limit: number
	enableTotalRecordCount: boolean
	nameLessThan?: string
}

/**
 * Runs a probe query against the scope's endpoint. Probes skip images and
 * user data — only the item's name fields matter for resolving a boundary.
 */
async function fetchScope(
	scope: LetterJumpScope,
	overrides: ProbeOverrides,
): Promise<ItemsResponse> {
	const api = getApi()

	if (!api) throw new Error('No API instance available for letter jump')

	const probeParams = {
		enableImages: false,
		enableUserData: false,
		...overrides,
	}

	if (scope.endpoint === 'albumArtists') {
		const { data } = await getArtistsApi(api).getAlbumArtists({
			...scope.params,
			...probeParams,
		})
		return data
	}

	const { data } = await getItemsApi(api).getItems({ ...scope.params, ...probeParams })
	return data
}

/**
 * Builds the {@link JumpToLetter} for a server-backed library list
 */
export function createLetterJump(config: LetterJumpConfig): JumpToLetter {
	const pageSize = config.pageSize ?? ApiLimits.Library

	const rankOf = (item: BaseItemDto) => azRank(getSectionLetter(item, config.sectionSortBy))

	const deps: Omit<LetterJumpDeps, 'memo'> = {
		probeAt: async (index, withTotal) => {
			const response = await fetchScope(config.scope, {
				startIndex: index,
				limit: 1,
				// COUNT queries are skipped on bisection probes to spare the
				// server a full count per request on very large libraries
				enableTotalRecordCount: withTotal,
			})
			const item = response.Items?.[0]
			return {
				rank: item ? rankOf(item) : undefined,
				total: response.TotalRecordCount ?? undefined,
			}
		},

		countSortingBefore: async (lowercaseLetter) => {
			const response = await fetchScope(config.scope, {
				startIndex: 0,
				limit: 1,
				enableTotalRecordCount: true,
				nameLessThan: lowercaseLetter,
			})
			return response.TotalRecordCount ?? undefined
		},

		fetchPage: config.fetchPage,

		readCachedWindow: () => {
			const cached = queryClient.getQueryData<InfiniteData<BaseItemDto[], number>>(
				config.queryKey,
			)
			if (!cached) return undefined
			return { pageParams: cached.pageParams as number[], pages: cached.pages }
		},

		repositionCache: async (pageNumber, items) => {
			// Drop any in-flight page fetches so they can't clobber the
			// repositioned window
			await queryClient.cancelQueries({ queryKey: config.queryKey, exact: true })
			queryClient.setQueryData<InfiniteData<BaseItemDto[], number>>(config.queryKey, {
				pages: [items],
				pageParams: [pageNumber],
			})
		},

		rankOf,
		pageSize,
		sortDescending: config.sortDescending,
		sortNameAligned: config.sortNameAligned,
	}

	return (letter: string) =>
		executeLetterJump({ ...deps, memo: memoFor(config.queryKey) }, letter)
}

/**
 * Builds the {@link JumpToLetter} for a fully-local list (e.g. downloaded
 * tracks), where every item is already in the query cache and the jump is a
 * pure scroll — no network involved
 */
export function createLocalLetterJump({
	queryKey,
	sortDescending,
	sectionSortBy,
}: {
	queryKey: QueryKey
	sortDescending: boolean
	sectionSortBy?: ItemSortBy
}): JumpToLetter {
	return async (letter: string) => {
		const cached = queryClient.getQueryData<InfiniteData<BaseItemDto[], number>>(queryKey)
		const items = cached?.pages.flat() ?? []

		if (items.length === 0) return null

		const targetNorm = normalizedRank(azRank(letter), sortDescending)
		const boundary = items.findIndex(
			(item) =>
				normalizedRank(azRank(getSectionLetter(item, sectionSortBy)), sortDescending) >=
				targetNorm,
		)

		return {
			letter,
			targetIndex: boundary === -1 ? items.length - 1 : boundary,
			windowStartIndex: 0,
		}
	}
}

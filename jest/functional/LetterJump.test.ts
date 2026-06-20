import { BaseItemDto, BaseItemKind, ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models'
import {
	azRank,
	KnownPoint,
	locateBoundaryInPage,
	narrowBoundaryToPage,
	normalizedRank,
	recordKnownPoint,
	sectionLocationForOffset,
} from '../../src/api/queries/letter-jump/utils'
import {
	clearLetterJumpMemo,
	createLocalLetterJump,
	executeLetterJump,
	LetterJumpDeps,
} from '../../src/api/queries/letter-jump'
import { getSectionLetter } from '../../src/utils/query-selectors'
import { queryClient } from '../../src/constants/query-client'

const PAGE_SIZE = 400

describe('azRank and normalizedRank', () => {
	it('ranks # and non-alphabetic characters as 0', () => {
		expect(azRank('#')).toBe(0)
		expect(azRank('1')).toBe(0)
		expect(azRank('~')).toBe(0)
		expect(azRank('')).toBe(0)
	})

	it('ranks A-Z as 1-26 regardless of case', () => {
		expect(azRank('A')).toBe(1)
		expect(azRank('a')).toBe(1)
		expect(azRank('M')).toBe(13)
		expect(azRank('z')).toBe(26)
	})

	it('normalizes ranks to be increasing along the list in both directions', () => {
		expect(normalizedRank(1, false)).toBeLessThan(normalizedRank(26, false))
		expect(normalizedRank(26, true)).toBeLessThan(normalizedRank(1, true))
	})
})

describe('recordKnownPoint', () => {
	it('keeps points sorted by index and replaces samples at the same index', () => {
		const points: KnownPoint[] = []
		recordKnownPoint(points, { index: 100, rank: 5 })
		recordKnownPoint(points, { index: 10, rank: 1 })
		recordKnownPoint(points, { index: 50, rank: 3 })
		recordKnownPoint(points, { index: 50, rank: 4 })

		expect(points.map((point) => point.index)).toEqual([10, 50, 100])
		expect(points[1].rank).toBe(4)
	})

	it('caps the list without losing coverage at the edges', () => {
		const points: KnownPoint[] = []
		for (let i = 0; i < 200; i++) {
			recordKnownPoint(points, { index: i * 10, rank: 1 })
		}
		expect(points.length).toBeLessThanOrEqual(64)
		expect(points[0].index).toBe(0)
	})
})

/**
 * A synthetic server-sorted result set: 27 sections (#, A-Z) spread over the
 * given total according to the weights, ascending or descending
 */
const buildLibrary = (
	total: number,
	sortDescending = false,
	weights?: Partial<Record<number, number>>,
) => {
	const sectionWeights = Array.from({ length: 27 }, (_, rank) => weights?.[rank] ?? 1)
	const weightSum = sectionWeights.reduce((sum, weight) => sum + weight, 0)

	const ranks: number[] = []
	for (let rank = 0; rank <= 26 && ranks.length < total; rank++) {
		const count =
			rank === 26
				? total - ranks.length
				: Math.round((sectionWeights[rank] / weightSum) * total)
		for (let i = 0; i < count && ranks.length < total; i++) ranks.push(rank)
	}
	while (ranks.length < total) ranks.push(26)

	if (sortDescending) ranks.reverse()
	return ranks
}

/** The lower-bound boundary index for a letter rank within a rank array */
const expectedBoundary = (ranks: number[], targetRank: number, sortDescending: boolean) => {
	const targetNorm = normalizedRank(targetRank, sortDescending)
	const index = ranks.findIndex((rank) => normalizedRank(rank, sortDescending) >= targetNorm)
	return index === -1 ? ranks.length : index
}

describe('narrowBoundaryToPage', () => {
	const probeFor = (ranks: number[]) => {
		let probeCount = 0
		const probe = async (index: number) => {
			probeCount++
			return ranks[index]
		}
		return { probe, probeCalls: () => probeCount }
	}

	it('brackets the boundary page of a 200k library in a handful of probes', async () => {
		const ranks = buildLibrary(200_000)
		const { probe, probeCalls } = probeFor(ranks)
		const points: KnownPoint[] = []

		const bracket = await narrowBoundaryToPage({
			targetRank: azRank('Q'),
			total: ranks.length,
			pageSize: PAGE_SIZE,
			sortDescending: false,
			probeRankAt: probe,
			knownPoints: points,
		})

		const boundary = expectedBoundary(ranks, azRank('Q'), false)
		expect(boundary).toBeGreaterThanOrEqual(bracket.low)
		expect(boundary).toBeLessThanOrEqual(bracket.high)
		expect(Math.floor(bracket.low / PAGE_SIZE)).toBe(Math.floor(bracket.high / PAGE_SIZE))
		// Interpolation over an even letter spread converges faster than
		// pure bisection (which would need ~9 probes to reach page granularity)
		expect(probeCalls()).toBeLessThanOrEqual(8)
	})

	it('stays within twice the bisection bound on a pathologically skewed library', async () => {
		// 95% of the library lives under one letter
		const ranks = buildLibrary(200_000, false, { 13: 500 })
		const { probe, probeCalls } = probeFor(ranks)

		const bracket = await narrowBoundaryToPage({
			targetRank: azRank('Z'),
			total: ranks.length,
			pageSize: PAGE_SIZE,
			sortDescending: false,
			probeRankAt: probe,
			knownPoints: [],
		})

		const boundary = expectedBoundary(ranks, azRank('Z'), false)
		expect(boundary).toBeGreaterThanOrEqual(bracket.low)
		expect(boundary).toBeLessThanOrEqual(bracket.high)
		const bisectionBound = Math.ceil(Math.log2(200_000 / PAGE_SIZE))
		expect(probeCalls()).toBeLessThanOrEqual(2 * bisectionBound + 2)
	})

	it('needs no probes when known points already bracket the page', async () => {
		const ranks = buildLibrary(200_000)
		const boundary = expectedBoundary(ranks, azRank('Q'), false)
		const { probe, probeCalls } = probeFor(ranks)

		const knownPoints: KnownPoint[] = []
		recordKnownPoint(knownPoints, { index: boundary - 10, rank: ranks[boundary - 10] })
		recordKnownPoint(knownPoints, { index: boundary + 10, rank: ranks[boundary + 10] })

		const bracket = await narrowBoundaryToPage({
			targetRank: azRank('Q'),
			total: ranks.length,
			pageSize: PAGE_SIZE,
			sortDescending: false,
			probeRankAt: probe,
			knownPoints,
		})

		expect(probeCalls()).toBe(0)
		expect(boundary).toBeGreaterThanOrEqual(bracket.low)
		expect(boundary).toBeLessThanOrEqual(bracket.high)
	})

	it('handles descending order', async () => {
		const ranks = buildLibrary(50_000, true)
		const { probe } = probeFor(ranks)

		const bracket = await narrowBoundaryToPage({
			targetRank: azRank('C'),
			total: ranks.length,
			pageSize: PAGE_SIZE,
			sortDescending: true,
			probeRankAt: probe,
			knownPoints: [],
		})

		const boundary = expectedBoundary(ranks, azRank('C'), true)
		expect(boundary).toBeGreaterThanOrEqual(bracket.low)
		expect(boundary).toBeLessThanOrEqual(bracket.high)
	})

	it('stops early when a probe fails instead of throwing', async () => {
		const bracket = await narrowBoundaryToPage({
			targetRank: azRank('M'),
			total: 100_000,
			pageSize: PAGE_SIZE,
			sortDescending: false,
			probeRankAt: async () => undefined,
			knownPoints: [],
		})
		expect(bracket.low).toBe(0)
	})
})

describe('locateBoundaryInPage', () => {
	const item = (name: string): BaseItemDto => ({
		Id: name,
		Type: BaseItemKind.Audio,
		Name: name,
	})
	const rankOf = (track: BaseItemDto) => azRank(getSectionLetter(track))

	it('finds the first item of the target section', () => {
		const items = [item('Alpha'), item('Atom'), item('Beta'), item('Bravo'), item('Cap')]
		expect(
			locateBoundaryInPage({
				items,
				pageStartIndex: 800,
				targetRank: azRank('B'),
				sortDescending: false,
				rankOf,
			}),
		).toBe(802)
	})

	it('lands on the next section when the letter has no items', () => {
		const items = [item('Alpha'), item('Cap')]
		expect(
			locateBoundaryInPage({
				items,
				pageStartIndex: 0,
				targetRank: azRank('B'),
				sortDescending: false,
				rankOf,
			}),
		).toBe(1)
	})

	it('returns the index past the page when every item sorts before the target', () => {
		const items = [item('Alpha'), item('Atom')]
		expect(
			locateBoundaryInPage({
				items,
				pageStartIndex: 400,
				targetRank: azRank('Z'),
				sortDescending: false,
				rankOf,
			}),
		).toBe(402)
	})
})

describe('sectionLocationForOffset', () => {
	const sections = [
		{ title: 'A', data: [1, 2, 3] },
		{ title: 'B', data: [4] },
		{ title: 'C', data: [5, 6] },
	]

	it('maps offsets to section list locations', () => {
		expect(sectionLocationForOffset(sections, 0)).toEqual({ sectionIndex: 0, itemIndex: 0 })
		expect(sectionLocationForOffset(sections, 3)).toEqual({ sectionIndex: 1, itemIndex: 0 })
		expect(sectionLocationForOffset(sections, 5)).toEqual({ sectionIndex: 2, itemIndex: 1 })
	})

	it('clamps to the last loaded item when the offset is beyond the window', () => {
		expect(sectionLocationForOffset(sections, 99)).toEqual({ sectionIndex: 2, itemIndex: 1 })
	})

	it('handles empty sections input', () => {
		expect(sectionLocationForOffset([], 5)).toEqual({ sectionIndex: 0, itemIndex: 0 })
	})
})

describe('executeLetterJump', () => {
	/**
	 * Fake deps over a synthetic library, counting every network operation
	 * so each path's request budget can be asserted
	 */
	const buildDeps = (
		ranks: number[],
		options?: { sortDescending?: boolean; aligned?: boolean },
	) => {
		const sortDescending = options?.sortDescending ?? false

		const itemAt = (index: number): BaseItemDto => ({
			Id: `item-${index}`,
			Type: BaseItemKind.Audio,
			// Ranks map back to '#', 'A'.. 'Z' names so rankOf round-trips
			Name: ranks[index] === 0 ? '#0' : String.fromCharCode(64 + ranks[index]),
		})

		const calls = { probes: 0, counts: 0, pageFetches: 0 }
		let window: { pageParams: number[]; pages: BaseItemDto[][] } | undefined

		const deps: LetterJumpDeps = {
			probeAt: async (index, withTotal) => {
				calls.probes++
				return {
					rank: ranks[index],
					total: withTotal ? ranks.length : undefined,
				}
			},
			countSortingBefore: async (lowercaseLetter) => {
				calls.counts++
				// NameLessThan semantics over an ascending SortName order
				const bound = azRank(lowercaseLetter)
				let count = 0
				const ascendingRanks = sortDescending ? [...ranks].reverse() : ranks
				for (const rank of ascendingRanks) {
					if (rank < bound) count++
					else break
				}
				return count
			},
			fetchPage: async (pageNumber) => {
				calls.pageFetches++
				const start = pageNumber * PAGE_SIZE
				return Array.from(
					{ length: Math.min(PAGE_SIZE, Math.max(ranks.length - start, 0)) },
					(_, i) => itemAt(start + i),
				)
			},
			readCachedWindow: () => window,
			repositionCache: async (pageNumber, items) => {
				window = { pageParams: [pageNumber], pages: [items] }
			},
			rankOf: (track) => azRank(getSectionLetter(track)),
			pageSize: PAGE_SIZE,
			sortDescending,
			sortNameAligned: options?.aligned ?? false,
			memo: { points: [] },
		}

		return { deps, calls, getWindow: () => window }
	}

	it('resolves an aligned ascending jump with one count query and one page fetch', async () => {
		const ranks = buildLibrary(200_000)
		const { deps, calls } = buildDeps(ranks, { aligned: true })

		const jump = await executeLetterJump(deps, 'q')

		expect(jump?.targetIndex).toBe(expectedBoundary(ranks, azRank('Q'), false))
		expect(jump?.windowStartIndex).toBe(Math.floor(jump!.targetIndex / PAGE_SIZE) * PAGE_SIZE)
		expect(calls.counts).toBe(1)
		expect(calls.pageFetches).toBe(1)
		expect(calls.probes).toBe(1) // the one-time total probe
	})

	it('resolves an aligned descending jump as the complement of the next letter count', async () => {
		const ranks = buildLibrary(50_000, true)
		const { deps, calls } = buildDeps(ranks, { aligned: true, sortDescending: true })

		const jump = await executeLetterJump(deps, 'q')

		expect(jump?.targetIndex).toBe(expectedBoundary(ranks, azRank('Q'), true))
		expect(calls.counts).toBe(1)
		expect(calls.pageFetches).toBe(1)
	})

	it('jumps to the list head with no resolution requests at all', async () => {
		const ranks = buildLibrary(10_000)
		const { deps, calls } = buildDeps(ranks, { aligned: true })

		const jump = await executeLetterJump(deps, '#')

		expect(jump?.targetIndex).toBe(0)
		expect(calls.probes + calls.counts).toBe(0)
		expect(calls.pageFetches).toBe(1)
	})

	it('resolves a cold 200k unaligned jump exactly, within a small probe budget', async () => {
		const ranks = buildLibrary(200_000)
		const { deps, calls } = buildDeps(ranks)

		const jump = await executeLetterJump(deps, 's')

		expect(jump?.targetIndex).toBe(expectedBoundary(ranks, azRank('S'), false))
		expect(calls.pageFetches).toBe(1)
		// 1 total probe + interpolated search to page granularity; pure
		// bisection to the exact index would need ~18-19
		expect(calls.probes).toBeLessThanOrEqual(11)
	})

	it('repeats a jump to the same letter with no probes at all', async () => {
		const ranks = buildLibrary(200_000)
		const { deps, calls } = buildDeps(ranks)

		const first = await executeLetterJump(deps, 's')
		const probesAfterFirst = calls.probes
		const fetchesAfterFirst = calls.pageFetches

		const second = await executeLetterJump(deps, 's')

		expect(second).toEqual(first)
		// The prior search's samples bracket the boundary within one page,
		// and that page is already the loaded window
		expect(calls.probes).toBe(probesAfterFirst)
		expect(calls.pageFetches).toBe(fetchesAfterFirst)
	})

	it('reuses memoized samples so repeat jumps cost fewer probes', async () => {
		const ranks = buildLibrary(200_000)
		const { deps, calls } = buildDeps(ranks)

		await executeLetterJump(deps, 's')
		const coldProbes = calls.probes

		await executeLetterJump(deps, 't')
		const warmProbes = calls.probes - coldProbes

		expect(warmProbes).toBeLessThan(coldProbes)
		expect(warmProbes).toBeLessThanOrEqual(8)
	})

	it('skips fetching when the target page is already the loaded window', async () => {
		// ~37 items per letter: adjacent letters share a 400-item page
		const ranks = buildLibrary(1_000)
		const { deps, calls } = buildDeps(ranks, { aligned: true })

		const first = await executeLetterJump(deps, 'b')
		const fetchesAfterFirst = calls.pageFetches

		// Jumping to an adjacent letter on the same page reuses the window
		const second = await executeLetterJump(deps, 'c')

		expect(Math.floor(second!.targetIndex / PAGE_SIZE)).toBe(
			Math.floor(first!.targetIndex / PAGE_SIZE),
		)
		expect(calls.pageFetches).toBe(fetchesAfterFirst)
	})

	it('resolves to null for an empty result set', async () => {
		const { deps } = buildDeps([])
		expect(await executeLetterJump(deps, 'm')).toBeNull()
	})
})

describe('createLocalLetterJump', () => {
	afterEach(() => {
		queryClient.clear()
		clearLetterJumpMemo()
	})

	const tracks: BaseItemDto[] = [
		{ Id: '1', Type: BaseItemKind.Audio, Name: 'Apple' },
		{ Id: '2', Type: BaseItemKind.Audio, Name: 'Banana' },
		{ Id: '3', Type: BaseItemKind.Audio, Name: 'Cherry' },
	]

	it('resolves the first item of the letter section without any fetching', async () => {
		const queryKey = ['local-jump-test', 'ascending']
		queryClient.setQueryData(queryKey, { pages: [tracks], pageParams: [0] })

		const jump = createLocalLetterJump({ queryKey, sortDescending: false })

		expect(await jump('b')).toEqual({ letter: 'b', targetIndex: 1, windowStartIndex: 0 })
	})

	it('respects descending order', async () => {
		const queryKey = ['local-jump-test', 'descending']
		queryClient.setQueryData(queryKey, {
			pages: [[...tracks].reverse()],
			pageParams: [0],
		})

		const jump = createLocalLetterJump({ queryKey, sortDescending: true })

		expect(await jump('b')).toEqual({ letter: 'b', targetIndex: 1, windowStartIndex: 0 })
	})

	it('resolves to null when nothing is cached', async () => {
		const jump = createLocalLetterJump({
			queryKey: ['local-jump-test', 'empty'],
			sortDescending: false,
		})

		expect(await jump('b')).toBeNull()
	})
})

describe('getSectionLetter', () => {
	it('uses the display name for audio, ignoring number-prefixed sort names', () => {
		const track: BaseItemDto = {
			Type: BaseItemKind.Audio,
			Name: 'Hey Jude',
			SortName: '0001 - 0005 - hey jude',
		}
		expect(getSectionLetter(track)).toBe('H')
	})

	it('uses the sort name for non-audio items', () => {
		const artist: BaseItemDto = {
			Type: BaseItemKind.MusicArtist,
			Name: 'The Beatles',
			SortName: 'beatles',
		}
		expect(getSectionLetter(artist)).toBe('B')
	})

	it('uses the artist when sorting by artist', () => {
		const track: BaseItemDto = { Name: 'Around the World', AlbumArtist: 'Daft Punk' }
		expect(getSectionLetter(track, ItemSortBy.Artist)).toBe('D')
	})

	it('uses the album when sorting by album', () => {
		const track: BaseItemDto = { Name: 'Get Lucky', Album: 'Random Access Memories' }
		expect(getSectionLetter(track, ItemSortBy.Album)).toBe('R')
	})

	it('buckets non-alphabetic names under #', () => {
		expect(getSectionLetter({ Type: BaseItemKind.Audio, Name: '99 Problems' })).toBe('#')
		expect(getSectionLetter({ Type: BaseItemKind.MusicArtist, SortName: '311' })).toBe('#')
		expect(getSectionLetter({})).toBe('#')
	})
})

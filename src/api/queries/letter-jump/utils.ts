import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'

/**
 * Rank of a section letter for ordering comparisons.
 *
 * '#' (and anything non-alphabetic) is 0, 'A' through 'Z' are 1 through 26,
 * mirroring how the server sorts non-alphabetic sort names before letters.
 */
export function azRank(letter: string): number {
	const upper = letter.toUpperCase()
	return upper >= 'A' && upper <= 'Z' ? upper.charCodeAt(0) - 64 : 0
}

/**
 * Rank remapped so it is monotonically non-decreasing along the list order
 * regardless of sort direction, which lets one lower-bound search serve both
 */
export function normalizedRank(rank: number, sortDescending: boolean): number {
	return sortDescending ? 26 - rank : rank
}

/**
 * A resolved (index, rank) sample of the server-sorted result set. Probes are
 * recorded as known points so later searches start from a tighter bracket.
 */
export type KnownPoint = { index: number; rank: number }

const MAX_KNOWN_POINTS = 64

/**
 * Inserts a sample into the sorted known-point list, replacing any existing
 * sample at the same index and capping the list size
 */
export function recordKnownPoint(points: KnownPoint[], point: KnownPoint): void {
	let insertAt = points.length
	for (let i = 0; i < points.length; i++) {
		if (points[i].index === point.index) {
			points[i] = point
			return
		}
		if (points[i].index > point.index) {
			insertAt = i
			break
		}
	}
	points.splice(insertAt, 0, point)

	if (points.length > MAX_KNOWN_POINTS) {
		// Drop every other point to keep coverage spread across the list
		for (let i = points.length - 2; i > 0; i -= 2) {
			points.splice(i, 1)
		}
	}
}

/**
 * Resolves the section-letter rank of the item at the given index of the
 * server-sorted result set, or undefined if the item couldn't be fetched
 */
export type RankProbe = (index: number) => Promise<number | undefined>

/**
 * Narrows a [low, high] bracket around the boundary of the target letter's
 * section until the bracket fits within a single page — the exact boundary is
 * then resolved locally from that page's items, which the jump has to fetch
 * anyway. Stopping at page granularity saves ~log2(pageSize) probes per jump.
 *
 * Probe positions interpolate between the bracketing samples (section letters
 * are spread roughly evenly through a music library), alternating with plain
 * bisection so a skewed distribution can't degrade beyond 2x the bisection
 * worst case. Every probe is recorded into knownPoints, so repeated jumps on
 * the same list converge toward zero probes.
 */
export async function narrowBoundaryToPage({
	targetRank,
	total,
	pageSize,
	sortDescending,
	probeRankAt,
	knownPoints,
}: {
	targetRank: number
	total: number
	pageSize: number
	sortDescending: boolean
	probeRankAt: RankProbe
	knownPoints: KnownPoint[]
}): Promise<{ low: number; high: number; probeCount: number }> {
	const targetNorm = normalizedRank(targetRank, sortDescending)

	let low = 0
	let lowNorm = -1
	let high = total
	let highNorm = 27

	// Initialize the bracket from prior samples: the last one sorting before
	// the target and the first one sorting at-or-after it
	for (const point of knownPoints) {
		if (point.index >= total) continue
		const pointNorm = normalizedRank(point.rank, sortDescending)
		if (pointNorm < targetNorm) {
			if (point.index + 1 > low) {
				low = point.index + 1
				lowNorm = pointNorm
			}
		} else if (point.index < high) {
			high = point.index
			highNorm = pointNorm
		}
	}

	let probeCount = 0
	let useInterpolation = true

	while (low < high && Math.floor(low / pageSize) !== Math.floor(high / pageSize)) {
		let middle: number
		// Interpolation only carries information while the bracket spans more
		// than one letter transition; inside a single transition the boundary
		// is uniformly distributed, so bisection is optimal
		if (useInterpolation && highNorm - lowNorm > 1) {
			// Aim at the estimated START of the target's section: half a rank
			// before the target, assuming ranks spread evenly across the bracket
			const fraction = (targetNorm - 0.5 - lowNorm) / (highNorm - lowNorm)
			// Keep interpolated probes off the bracket edges so a skewed
			// distribution still shrinks the bracket meaningfully
			const clamped = Math.min(Math.max(fraction, 0.05), 0.95)
			middle = low + Math.floor((high - low) * clamped)
		} else {
			middle = low + Math.floor((high - low) / 2)
		}
		middle = Math.min(Math.max(middle, low), high - 1)
		useInterpolation = !useInterpolation

		const rank = await probeRankAt(middle)
		probeCount++

		if (rank === undefined) break

		recordKnownPoint(knownPoints, { index: middle, rank })

		const middleNorm = normalizedRank(rank, sortDescending)
		if (middleNorm < targetNorm) {
			low = middle + 1
			lowNorm = middleNorm
		} else {
			high = middle
			highNorm = middleNorm
		}
	}

	return { low, high, probeCount }
}

/**
 * Locates the boundary of the target letter's section within a fetched page:
 * the first item sorting at-or-after the target, as a global index. Returns
 * the index just past the page when every item sorts before the target.
 */
export function locateBoundaryInPage({
	items,
	pageStartIndex,
	targetRank,
	sortDescending,
	rankOf,
}: {
	items: readonly BaseItemDto[]
	pageStartIndex: number
	targetRank: number
	sortDescending: boolean
	rankOf: (item: BaseItemDto) => number
}): number {
	const targetNorm = normalizedRank(targetRank, sortDescending)

	for (let i = 0; i < items.length; i++) {
		if (normalizedRank(rankOf(items[i]), sortDescending) >= targetNorm) {
			return pageStartIndex + i
		}
	}

	return pageStartIndex + items.length
}

/**
 * Maps an item offset within the loaded window to a section list location.
 * Falls back to the last loaded item when the offset is beyond the window.
 */
export function sectionLocationForOffset(
	sections: readonly { data: readonly unknown[] }[],
	offset: number,
): { sectionIndex: number; itemIndex: number } {
	let remaining = Math.max(offset, 0)

	for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
		const sectionLength = sections[sectionIndex].data.length
		if (remaining < sectionLength) {
			return { sectionIndex, itemIndex: remaining }
		}
		remaining -= sectionLength
	}

	const lastSection = Math.max(sections.length - 1, 0)
	return {
		sectionIndex: lastSection,
		itemIndex: Math.max((sections[lastSection]?.data.length ?? 1) - 1, 0),
	}
}

import { compareByColdness, recordPlay, scoreEntry } from '../../../src/cache/core/scoring'
import { CACHE_SCORE_HALF_LIFE_MS } from '../../../src/cache/core/types'
import { DAY, NOW, makeEntry } from './helpers'

describe('scoreEntry', () => {
	it('returns 0 for an entry with no plays', () => {
		expect(scoreEntry(makeEntry({ trackId: 'a' }), NOW)).toBe(0)
	})

	it('scores a just-played track at ~1 per play', () => {
		const entry = makeEntry({ trackId: 'a', playEvents: [NOW] })

		expect(scoreEntry(entry, NOW)).toBeCloseTo(1, 5)
	})

	it('halves a play contribution after one half-life', () => {
		const entry = makeEntry({ trackId: 'a', playEvents: [NOW - CACHE_SCORE_HALF_LIFE_MS] })

		expect(scoreEntry(entry, NOW)).toBeCloseTo(0.5, 5)
	})

	it('sums contributions across plays', () => {
		const entry = makeEntry({
			trackId: 'a',
			playEvents: [NOW, NOW - CACHE_SCORE_HALF_LIFE_MS],
		})

		expect(scoreEntry(entry, NOW)).toBeCloseTo(1.5, 5)
	})

	it('decays monotonically as time passes', () => {
		const entry = makeEntry({ trackId: 'a', playEvents: [NOW - DAY, NOW - 2 * DAY] })

		const early = scoreEntry(entry, NOW)
		const later = scoreEntry(entry, NOW + 30 * DAY)
		const muchLater = scoreEntry(entry, NOW + 90 * DAY)

		expect(early).toBeGreaterThan(later)
		expect(later).toBeGreaterThan(muchLater)
	})

	it('ranks recent-but-few plays above frequent-but-stale plays', () => {
		const playedTwiceThisWeek = makeEntry({
			trackId: 'fresh',
			playEvents: [NOW - DAY, NOW - 3 * DAY],
		})
		const playedTenTimesLastQuarter = makeEntry({
			trackId: 'stale',
			playEvents: Array.from({ length: 10 }, (_, i) => NOW - (80 + i) * DAY),
		})

		expect(scoreEntry(playedTwiceThisWeek, NOW)).toBeGreaterThan(
			scoreEntry(playedTenTimesLastQuarter, NOW),
		)
	})

	it('clamps future timestamps instead of inflating the score', () => {
		const entry = makeEntry({ trackId: 'a', playEvents: [NOW + 5 * DAY] })

		expect(scoreEntry(entry, NOW)).toBeCloseTo(1, 5)
	})
})

describe('compareByColdness', () => {
	it('orders lower-scored entries first', () => {
		const cold = makeEntry({ trackId: 'cold', playEvents: [NOW - 60 * DAY] })
		const hot = makeEntry({ trackId: 'hot', playEvents: [NOW] })

		expect(compareByColdness(cold, hot, NOW)).toBeLessThan(0)
		expect(compareByColdness(hot, cold, NOW)).toBeGreaterThan(0)
	})

	it('breaks score ties by least-recently-played', () => {
		const playedLongAgo = makeEntry({ trackId: 'a', lastPlayedAt: NOW - 10 * DAY })
		const playedRecently = makeEntry({ trackId: 'b', lastPlayedAt: NOW - DAY })

		expect(compareByColdness(playedLongAgo, playedRecently, NOW)).toBeLessThan(0)
	})

	it('breaks remaining ties by oldest entry, then track id, deterministically', () => {
		const older = makeEntry({ trackId: 'b', addedAt: NOW - 50 * DAY })
		const newer = makeEntry({ trackId: 'a', addedAt: NOW - 5 * DAY })

		expect(compareByColdness(older, newer, NOW)).toBeLessThan(0)

		const twinA = makeEntry({ trackId: 'a' })
		const twinB = makeEntry({ trackId: 'b' })

		expect(compareByColdness(twinA, twinB, NOW)).toBeLessThan(0)
		expect(compareByColdness(twinB, twinA, NOW)).toBeGreaterThan(0)
		expect(compareByColdness(twinA, twinA, NOW)).toBe(0)
	})
})

describe('recordPlay', () => {
	it('appends the play and updates lastPlayedAt without mutating', () => {
		const entry = makeEntry({ trackId: 'a', playEvents: [NOW - DAY] })

		const updated = recordPlay(entry, NOW, 20)

		expect(updated.playEvents).toEqual([NOW - DAY, NOW])
		expect(updated.lastPlayedAt).toBe(NOW)
		expect(entry.playEvents).toEqual([NOW - DAY])
	})

	it('caps stored plays, dropping the oldest first', () => {
		const entry = makeEntry({
			trackId: 'a',
			playEvents: Array.from({ length: 5 }, (_, i) => NOW - (5 - i) * DAY),
		})

		const updated = recordPlay(entry, NOW, 3)

		expect(updated.playEvents).toEqual([NOW - 2 * DAY, NOW - DAY, NOW])
	})
})

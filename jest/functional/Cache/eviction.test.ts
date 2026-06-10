import {
	applyEviction,
	planEviction,
	pruneStale,
	usedBytes,
} from '../../../src/cache/core/eviction'
import { EMPTY_CONTEXT } from '../../../src/cache/core/types'
import { DAY, MB, NOW, contextWith, makeEntry, makeLedger } from './helpers'

describe('usedBytes', () => {
	it('sums only present entries', () => {
		const ledger = makeLedger(100 * MB, [
			makeEntry({ trackId: 'a', state: 'present', sizeBytes: 10 * MB }),
			makeEntry({ trackId: 'b', state: 'wanted', sizeBytes: 0 }),
			makeEntry({ trackId: 'c', state: 'fetching', sizeBytes: 0 }),
			makeEntry({ trackId: 'd', state: 'present', sizeBytes: 5 * MB, origin: 'pinned' }),
		])

		expect(usedBytes(ledger)).toBe(15 * MB)
	})
})

describe('planEviction', () => {
	it('returns null when the cache is disabled', () => {
		const ledger = makeLedger(null, [makeEntry({ trackId: 'a', sizeBytes: 50 * MB })])

		expect(planEviction(ledger, NOW, EMPTY_CONTEXT, 'over-budget')).toBeNull()
	})

	it('returns null when usage is within budget', () => {
		const ledger = makeLedger(100 * MB, [makeEntry({ trackId: 'a', sizeBytes: 90 * MB })])

		expect(planEviction(ledger, NOW, EMPTY_CONTEXT, 'over-budget')).toBeNull()
	})

	it('never selects pinned entries, even when they are the only way under budget', () => {
		const ledger = makeLedger(10 * MB, [
			makeEntry({ trackId: 'pin', origin: 'pinned', sizeBytes: 50 * MB }),
			makeEntry({ trackId: 'cached', sizeBytes: 5 * MB }),
		])

		const plan = planEviction(ledger, NOW, EMPTY_CONTEXT, 'over-budget')

		expect(plan?.trackIds).toEqual(['cached'])
	})

	it('never selects protected (queued) tracks', () => {
		const ledger = makeLedger(10 * MB, [
			makeEntry({ trackId: 'queued', sizeBytes: 20 * MB, playEvents: [NOW - 90 * DAY] }),
			makeEntry({ trackId: 'free', sizeBytes: 20 * MB, playEvents: [NOW] }),
		])

		const plan = planEviction(ledger, NOW, contextWith('queued'), 'over-budget')

		expect(plan?.trackIds).toEqual(['free'])
	})

	it('evicts coldest first and stops at the low watermark', () => {
		// Budget 100MB, usage 120MB → target is 90MB, so 30MB must go.
		const ledger = makeLedger(100 * MB, [
			makeEntry({ trackId: 'coldest', sizeBytes: 20 * MB, playEvents: [NOW - 90 * DAY] }),
			makeEntry({ trackId: 'cool', sizeBytes: 20 * MB, playEvents: [NOW - 30 * DAY] }),
			makeEntry({ trackId: 'warm', sizeBytes: 40 * MB, playEvents: [NOW - 2 * DAY] }),
			makeEntry({ trackId: 'hot', sizeBytes: 40 * MB, playEvents: [NOW] }),
		])

		const plan = planEviction(ledger, NOW, EMPTY_CONTEXT, 'over-budget')

		expect(plan?.trackIds).toEqual(['coldest', 'cool'])
		expect(plan?.freedBytes).toBe(40 * MB)
	})

	it('is deterministic for a fixed ledger and clock', () => {
		const ledger = makeLedger(10 * MB, [
			makeEntry({ trackId: 'b', sizeBytes: 10 * MB }),
			makeEntry({ trackId: 'a', sizeBytes: 10 * MB }),
			makeEntry({ trackId: 'c', sizeBytes: 10 * MB }),
		])

		const first = planEviction(ledger, NOW, EMPTY_CONTEXT, 'over-budget')
		const second = planEviction(ledger, NOW, EMPTY_CONTEXT, 'over-budget')

		expect(first).toEqual(second)
		expect(first?.trackIds).toEqual(['a', 'b', 'c'])
	})

	it('returns a partial plan when candidates run out before the watermark', () => {
		const ledger = makeLedger(10 * MB, [
			makeEntry({ trackId: 'pin', origin: 'pinned', sizeBytes: 40 * MB }),
			makeEntry({ trackId: 'cached', sizeBytes: 10 * MB }),
		])

		const plan = planEviction(ledger, NOW, EMPTY_CONTEXT, 'over-budget')

		expect(plan?.trackIds).toEqual(['cached'])
		expect(plan?.freedBytes).toBe(10 * MB)
	})

	it('returns null when only pins exceed the budget', () => {
		const ledger = makeLedger(10 * MB, [
			makeEntry({ trackId: 'pin', origin: 'pinned', sizeBytes: 40 * MB }),
		])

		expect(planEviction(ledger, NOW, EMPTY_CONTEXT, 'over-budget')).toBeNull()
	})

	it('carries the supplied reason', () => {
		const ledger = makeLedger(10 * MB, [makeEntry({ trackId: 'a', sizeBytes: 20 * MB })])

		expect(planEviction(ledger, NOW, EMPTY_CONTEXT, 'budget-shrink')?.reason).toBe(
			'budget-shrink',
		)
	})
})

describe('applyEviction', () => {
	it('demotes evicted entries to wanted, preserving play history', () => {
		const ledger = makeLedger(10 * MB, [
			makeEntry({ trackId: 'a', sizeBytes: 20 * MB, playEvents: [NOW - DAY] }),
		])

		const next = applyEviction(
			ledger,
			{ trackIds: ['a'], freedBytes: 20 * MB, reason: 'over-budget' },
			NOW,
		)

		expect(next.entries['a'].state).toBe('wanted')
		expect(next.entries['a'].sizeBytes).toBe(0)
		expect(next.entries['a'].playEvents).toEqual([NOW - DAY])
	})

	it('ignores plan entries that are no longer cached and present', () => {
		const ledger = makeLedger(10 * MB, [
			makeEntry({ trackId: 'pinned-since', origin: 'pinned', sizeBytes: 20 * MB }),
		])

		const next = applyEviction(
			ledger,
			{ trackIds: ['pinned-since', 'ghost'], freedBytes: 20 * MB, reason: 'over-budget' },
			NOW,
		)

		expect(next.entries['pinned-since'].state).toBe('present')
	})
})

describe('pruneStale', () => {
	it('drops decayed non-resident cached entries but keeps fresh, resident, and pinned ones', () => {
		const ledger = makeLedger(100 * MB, [
			makeEntry({
				trackId: 'decayed',
				state: 'wanted',
				sizeBytes: 0,
				playEvents: [NOW - 200 * DAY],
			}),
			makeEntry({ trackId: 'fresh', state: 'wanted', sizeBytes: 0, playEvents: [NOW - DAY] }),
			makeEntry({ trackId: 'on-disk', state: 'present', playEvents: [NOW - 200 * DAY] }),
			makeEntry({ trackId: 'in-flight', state: 'fetching', sizeBytes: 0 }),
			makeEntry({
				trackId: 'pinned-failed',
				origin: 'pinned',
				state: 'failed',
				sizeBytes: 0,
				playEvents: [NOW - 200 * DAY],
			}),
		])

		const next = pruneStale(ledger, NOW)

		expect(Object.keys(next.entries).sort()).toEqual([
			'fresh',
			'in-flight',
			'on-disk',
			'pinned-failed',
		])
	})
})

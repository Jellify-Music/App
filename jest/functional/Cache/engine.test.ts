import { decide } from '../../../src/cache/core/engine'
import { CacheLedger, EMPTY_CONTEXT, EvictionPlan } from '../../../src/cache/core/types'
import { DAY, MB, NOW, contextWith, makeEntry, makeLedger } from './helpers'

const GB = 1024 * MB

describe('engine: admission via completed plays', () => {
	it('does nothing for unknown tracks when the cache is disabled', () => {
		const { ledger, effects } = decide(
			makeLedger(null),
			{ type: 'play-completed', trackId: 'a' },
			NOW,
			EMPTY_CONTEXT,
		)

		expect(ledger.entries['a']).toBeUndefined()
		expect(effects).toEqual([])
	})

	it('still records plays on existing entries when the cache is disabled', () => {
		const initial = makeLedger(null, [
			makeEntry({ trackId: 'pin', origin: 'pinned', state: 'present' }),
		])

		const { ledger, effects } = decide(
			initial,
			{ type: 'play-completed', trackId: 'pin' },
			NOW,
			EMPTY_CONTEXT,
		)

		expect(ledger.entries['pin'].lastPlayedAt).toBe(NOW)
		expect(ledger.entries['pin'].playEvents).toEqual([NOW])
		expect(effects).toEqual([])
	})

	it('admits an unknown track on a completed play and fetches it', () => {
		const { ledger, effects } = decide(
			makeLedger(4 * GB),
			{ type: 'play-completed', trackId: 'new' },
			NOW,
			EMPTY_CONTEXT,
		)

		expect(ledger.entries['new']).toMatchObject({
			origin: 'cached',
			state: 'fetching',
			lastPlayedAt: NOW,
			playEvents: [NOW],
		})
		expect(effects).toEqual([{ type: 'fetch', trackId: 'new' }])
	})

	it('re-fetches a hot-but-evicted (wanted) track on a completed play', () => {
		const initial = makeLedger(4 * GB, [
			makeEntry({
				trackId: 'evicted',
				state: 'wanted',
				sizeBytes: 0,
				playEvents: [NOW - DAY],
			}),
		])

		const { ledger, effects } = decide(
			initial,
			{ type: 'play-completed', trackId: 'evicted' },
			NOW,
			EMPTY_CONTEXT,
		)

		expect(ledger.entries['evicted'].state).toBe('fetching')
		expect(effects).toEqual([{ type: 'fetch', trackId: 'evicted' }])
	})

	it('does not re-fetch tracks that are already present, fetching, or failed', () => {
		for (const state of ['present', 'fetching', 'failed'] as const) {
			const initial = makeLedger(4 * GB, [makeEntry({ trackId: 'a', state })])

			const { ledger, effects } = decide(
				initial,
				{ type: 'play-completed', trackId: 'a' },
				NOW,
				EMPTY_CONTEXT,
			)

			expect(ledger.entries['a'].state).toBe(state)
			expect(effects).toEqual([])
		}
	})
})

describe('engine: play-started (eager fetch at ~30%)', () => {
	it('fetches a wanted track without recording a play', () => {
		const initial = makeLedger(4 * GB, [
			makeEntry({ trackId: 'wanted', state: 'wanted', sizeBytes: 0 }),
		])

		const { ledger, effects } = decide(
			initial,
			{ type: 'play-started', trackId: 'wanted' },
			NOW,
			EMPTY_CONTEXT,
		)

		expect(ledger.entries['wanted'].state).toBe('fetching')
		expect(ledger.entries['wanted'].playEvents).toEqual([])
		expect(effects).toEqual([{ type: 'fetch', trackId: 'wanted' }])
	})

	it('does not admit unknown tracks', () => {
		const { ledger, effects } = decide(
			makeLedger(4 * GB),
			{ type: 'play-started', trackId: 'unknown' },
			NOW,
			EMPTY_CONTEXT,
		)

		expect(ledger.entries['unknown']).toBeUndefined()
		expect(effects).toEqual([])
	})
})

describe('engine: fetch lifecycle and steady-state eviction', () => {
	it('marks a fetched track present and silently evicts the coldest cached entries', () => {
		// Budget 100MB, 95MB present; the incoming 10MB fetch tips it to 105MB.
		// Target after eviction is 90MB → the coldest 20MB entry goes.
		const initial = makeLedger(100 * MB, [
			makeEntry({ trackId: 'coldest', sizeBytes: 20 * MB, playEvents: [NOW - 90 * DAY] }),
			makeEntry({ trackId: 'warm', sizeBytes: 35 * MB, playEvents: [NOW - 2 * DAY] }),
			makeEntry({ trackId: 'pin', origin: 'pinned', sizeBytes: 40 * MB }),
			makeEntry({ trackId: 'incoming', state: 'fetching', sizeBytes: 0, playEvents: [NOW] }),
		])

		const { ledger, effects } = decide(
			initial,
			{ type: 'fetch-succeeded', trackId: 'incoming', sizeBytes: 10 * MB },
			NOW,
			EMPTY_CONTEXT,
		)

		expect(ledger.entries['incoming']).toMatchObject({ state: 'present', sizeBytes: 10 * MB })
		// Evicted and fully decayed → pruned from the ledger, not just demoted
		expect(ledger.entries['coldest']).toBeUndefined()
		expect(ledger.entries['pin'].state).toBe('present')
		expect(effects).toEqual([{ type: 'evict', trackId: 'coldest' }])
	})

	it('never evicts the current queue to make room', () => {
		const initial = makeLedger(10 * MB, [
			makeEntry({ trackId: 'queued', sizeBytes: 10 * MB, playEvents: [NOW - 90 * DAY] }),
			makeEntry({ trackId: 'incoming', state: 'fetching', sizeBytes: 0 }),
		])

		const { effects } = decide(
			initial,
			{ type: 'fetch-succeeded', trackId: 'incoming', sizeBytes: 5 * MB },
			NOW,
			contextWith('queued', 'incoming'),
		)

		expect(effects).toEqual([])
	})

	it('adopts an unknown completed download as pinned', () => {
		const { ledger } = decide(
			makeLedger(4 * GB),
			{ type: 'fetch-succeeded', trackId: 'legacy', sizeBytes: 5 * MB },
			NOW,
			EMPTY_CONTEXT,
		)

		expect(ledger.entries['legacy']).toMatchObject({
			origin: 'pinned',
			state: 'present',
			sizeBytes: 5 * MB,
		})
	})

	it('returns retryable failures to wanted and parks permanent failures at failed', () => {
		const retryable = decide(
			makeLedger(4 * GB, [makeEntry({ trackId: 'a', state: 'fetching', sizeBytes: 0 })]),
			{ type: 'fetch-failed', trackId: 'a', retryable: true },
			NOW,
			EMPTY_CONTEXT,
		)
		expect(retryable.ledger.entries['a'].state).toBe('wanted')

		const permanent = decide(
			makeLedger(4 * GB, [makeEntry({ trackId: 'b', state: 'fetching', sizeBytes: 0 })]),
			{ type: 'fetch-failed', trackId: 'b', retryable: false },
			NOW,
			EMPTY_CONTEXT,
		)
		expect(permanent.ledger.entries['b'].state).toBe('failed')
	})

	it('runs an emergency eviction when a fetch fails with a full disk while over budget', () => {
		const initial = makeLedger(10 * MB, [
			makeEntry({ trackId: 'cold', sizeBytes: 20 * MB, playEvents: [NOW - 90 * DAY] }),
			makeEntry({ trackId: 'incoming', state: 'fetching', sizeBytes: 0, playEvents: [NOW] }),
		])

		const { ledger, effects } = decide(
			initial,
			{ type: 'fetch-failed', trackId: 'incoming', retryable: true, storageFull: true },
			NOW,
			EMPTY_CONTEXT,
		)

		expect(ledger.entries['incoming'].state).toBe('wanted')
		expect(effects).toEqual([{ type: 'evict', trackId: 'cold' }])
	})
})

describe('engine: pin / unpin / remove', () => {
	it('pins an unknown track and fetches it', () => {
		const { ledger, effects } = decide(
			makeLedger(null),
			{ type: 'pin', trackId: 'album-track' },
			NOW,
			EMPTY_CONTEXT,
		)

		expect(ledger.entries['album-track']).toMatchObject({ origin: 'pinned', state: 'fetching' })
		expect(effects).toEqual([{ type: 'fetch', trackId: 'album-track' }])
	})

	it('promotes a cached entry to pinned without re-fetching when present', () => {
		const initial = makeLedger(4 * GB, [makeEntry({ trackId: 'a', state: 'present' })])

		const { ledger, effects } = decide(
			initial,
			{ type: 'pin', trackId: 'a' },
			NOW,
			EMPTY_CONTEXT,
		)

		expect(ledger.entries['a']).toMatchObject({ origin: 'pinned', state: 'present' })
		expect(effects).toEqual([])
	})

	it('retries failed entries when pinned', () => {
		const initial = makeLedger(4 * GB, [
			makeEntry({ trackId: 'a', origin: 'pinned', state: 'failed', sizeBytes: 0 }),
		])

		const { ledger, effects } = decide(
			initial,
			{ type: 'pin', trackId: 'a' },
			NOW,
			EMPTY_CONTEXT,
		)

		expect(ledger.entries['a'].state).toBe('fetching')
		expect(effects).toEqual([{ type: 'fetch', trackId: 'a' }])
	})

	it('unpinning demotes to cached and evicts immediately if over budget', () => {
		const initial = makeLedger(10 * MB, [
			makeEntry({ trackId: 'big-pin', origin: 'pinned', sizeBytes: 30 * MB }),
		])

		const { ledger, effects } = decide(
			initial,
			{ type: 'unpin', trackId: 'big-pin' },
			NOW,
			EMPTY_CONTEXT,
		)

		// Never played → demoted, evicted, and pruned in one pass
		expect(ledger.entries['big-pin']).toBeUndefined()
		expect(effects).toEqual([{ type: 'evict', trackId: 'big-pin' }])
	})

	it('remove drops the entry and always emits an idempotent evict', () => {
		const initial = makeLedger(4 * GB, [makeEntry({ trackId: 'a' })])

		const removed = decide(initial, { type: 'remove', trackId: 'a' }, NOW, EMPTY_CONTEXT)
		expect(removed.ledger.entries['a']).toBeUndefined()
		expect(removed.effects).toEqual([{ type: 'evict', trackId: 'a' }])

		const unknown = decide(
			makeLedger(4 * GB),
			{ type: 'remove', trackId: 'b' },
			NOW,
			EMPTY_CONTEXT,
		)
		expect(unknown.effects).toEqual([{ type: 'evict', trackId: 'b' }])
	})
})

describe('engine: budget changes require confirmation', () => {
	const overBudgetAfterShrink = (): CacheLedger =>
		makeLedger(100 * MB, [
			makeEntry({ trackId: 'cold', sizeBytes: 30 * MB, playEvents: [NOW - 90 * DAY] }),
			makeEntry({ trackId: 'hot', sizeBytes: 30 * MB, playEvents: [NOW] }),
		])

	it('surfaces a confirm-eviction effect without touching files or the ledger entries', () => {
		const { ledger, effects } = decide(
			overBudgetAfterShrink(),
			{ type: 'budget-changed', budgetBytes: 40 * MB },
			NOW,
			EMPTY_CONTEXT,
		)

		expect(ledger.budgetBytes).toBe(40 * MB)
		expect(ledger.entries['cold'].state).toBe('present')
		expect(effects).toHaveLength(1)
		expect(effects[0]).toMatchObject({
			type: 'confirm-eviction',
			plan: { trackIds: ['cold'], freedBytes: 30 * MB, reason: 'budget-shrink' },
		})
	})

	it('applies a confirmed plan and evicts', () => {
		const shrunk = decide(
			overBudgetAfterShrink(),
			{ type: 'budget-changed', budgetBytes: 40 * MB },
			NOW,
			EMPTY_CONTEXT,
		)
		const plan = (shrunk.effects[0] as { type: 'confirm-eviction'; plan: EvictionPlan }).plan

		const { ledger, effects } = decide(
			shrunk.ledger,
			{ type: 'eviction-confirmed', plan },
			NOW,
			EMPTY_CONTEXT,
		)

		// 90 days stale → demoted then pruned by the same pass
		expect(ledger.entries['cold']).toBeUndefined()
		expect(effects).toEqual([{ type: 'evict', trackId: 'cold' }])
	})

	it('re-validates a stale confirmed plan instead of trusting it', () => {
		const shrunk = decide(
			overBudgetAfterShrink(),
			{ type: 'budget-changed', budgetBytes: 40 * MB },
			NOW,
			EMPTY_CONTEXT,
		)
		const plan = (shrunk.effects[0] as { type: 'confirm-eviction'; plan: EvictionPlan }).plan

		// The user pinned the planned track while the prompt was up.
		const pinnedMeanwhile = decide(
			shrunk.ledger,
			{ type: 'pin', trackId: 'cold' },
			NOW,
			EMPTY_CONTEXT,
		)

		const { ledger, effects } = decide(
			pinnedMeanwhile.ledger,
			{ type: 'eviction-confirmed', plan },
			NOW,
			EMPTY_CONTEXT,
		)

		expect(ledger.entries['cold'].state).toBe('present')
		expect(effects).toEqual([])
	})

	it('raising the budget or disabling the cache evicts nothing', () => {
		const raised = decide(
			overBudgetAfterShrink(),
			{ type: 'budget-changed', budgetBytes: 1 * GB },
			NOW,
			EMPTY_CONTEXT,
		)
		expect(raised.effects).toEqual([])

		const disabled = decide(
			overBudgetAfterShrink(),
			{ type: 'budget-changed', budgetBytes: null },
			NOW,
			EMPTY_CONTEXT,
		)
		expect(disabled.ledger.budgetBytes).toBeNull()
		expect(disabled.effects).toEqual([])
	})
})

describe('engine: disk truth', () => {
	it('reconciles and surfaces (not silently applies) any resulting overage', () => {
		const initial = makeLedger(10 * MB, [
			makeEntry({ trackId: 'known', sizeBytes: 5 * MB, playEvents: [NOW - DAY] }),
		])

		const { ledger, effects } = decide(
			initial,
			{
				type: 'disk-truth',
				snapshot: {
					present: [
						{ trackId: 'known', sizeBytes: 5 * MB },
						{ trackId: 'adopted', sizeBytes: 20 * MB },
					],
					fetching: [],
				},
			},
			NOW,
			EMPTY_CONTEXT,
		)

		// The adopted orphan is pinned, so the only candidate is `known`.
		expect(ledger.entries['adopted'].origin).toBe('pinned')
		expect(effects).toHaveLength(1)
		expect(effects[0]).toMatchObject({
			type: 'confirm-eviction',
			plan: { trackIds: ['known'], reason: 'reconcile' },
		})
	})

	it('is a no-op for a ledger that matches disk', () => {
		const initial = makeLedger(100 * MB, [
			makeEntry({ trackId: 'a', sizeBytes: 5 * MB, playEvents: [NOW - DAY] }),
		])

		const { ledger, effects } = decide(
			initial,
			{
				type: 'disk-truth',
				snapshot: { present: [{ trackId: 'a', sizeBytes: 5 * MB }], fetching: [] },
			},
			NOW,
			EMPTY_CONTEXT,
		)

		expect(ledger.entries['a']).toMatchObject({ state: 'present', sizeBytes: 5 * MB })
		expect(effects).toEqual([])
	})
})

import { reconcile } from '../../../src/cache/core/reconcile'
import { DAY, MB, NOW, makeEntry, makeLedger } from './helpers'

describe('reconcile', () => {
	it('adopts unknown disk tracks as pinned and present', () => {
		const ledger = makeLedger(100 * MB)

		const next = reconcile(
			ledger,
			{ present: [{ trackId: 'orphan', sizeBytes: 8 * MB }], fetching: [] },
			NOW,
		)

		expect(next.entries['orphan']).toMatchObject({
			origin: 'pinned',
			state: 'present',
			sizeBytes: 8 * MB,
			addedAt: NOW,
		})
	})

	it('demotes a cached entry whose file vanished to wanted', () => {
		const ledger = makeLedger(100 * MB, [
			makeEntry({
				trackId: 'gone',
				state: 'present',
				sizeBytes: 5 * MB,
				playEvents: [NOW - DAY],
			}),
		])

		const next = reconcile(ledger, { present: [], fetching: [] }, NOW)

		expect(next.entries['gone']).toMatchObject({ state: 'wanted', sizeBytes: 0 })
		expect(next.entries['gone'].playEvents).toEqual([NOW - DAY])
	})

	it('marks a pinned entry whose file vanished as failed', () => {
		const ledger = makeLedger(100 * MB, [
			makeEntry({
				trackId: 'gone-pin',
				origin: 'pinned',
				state: 'present',
				sizeBytes: 5 * MB,
			}),
		])

		const next = reconcile(ledger, { present: [], fetching: [] }, NOW)

		expect(next.entries['gone-pin']).toMatchObject({ state: 'failed', sizeBytes: 0 })
	})

	it('recovers stuck fetching entries with no active task (the #817 case)', () => {
		const ledger = makeLedger(100 * MB, [
			makeEntry({
				trackId: 'stuck',
				state: 'fetching',
				sizeBytes: 0,
				playEvents: [NOW - DAY],
			}),
			makeEntry({
				trackId: 'live',
				state: 'fetching',
				sizeBytes: 0,
				playEvents: [NOW - DAY],
			}),
		])

		const next = reconcile(ledger, { present: [], fetching: ['live'] }, NOW)

		expect(next.entries['stuck'].state).toBe('wanted')
		expect(next.entries['live'].state).toBe('fetching')
	})

	it('refreshes sizes from disk and promotes ledger entries found on disk', () => {
		const ledger = makeLedger(100 * MB, [
			makeEntry({ trackId: 'resized', state: 'present', sizeBytes: 5 * MB }),
			makeEntry({ trackId: 'landed', state: 'fetching', sizeBytes: 0 }),
		])

		const next = reconcile(
			ledger,
			{
				present: [
					{ trackId: 'resized', sizeBytes: 7 * MB },
					{ trackId: 'landed', sizeBytes: 3 * MB },
				],
				fetching: [],
			},
			NOW,
		)

		expect(next.entries['resized']).toMatchObject({ state: 'present', sizeBytes: 7 * MB })
		expect(next.entries['landed']).toMatchObject({ state: 'present', sizeBytes: 3 * MB })
	})

	it('prunes decayed non-resident cached entries during reconciliation', () => {
		const ledger = makeLedger(100 * MB, [
			makeEntry({
				trackId: 'ancient',
				state: 'wanted',
				sizeBytes: 0,
				playEvents: [NOW - 300 * DAY],
			}),
		])

		const next = reconcile(ledger, { present: [], fetching: [] }, NOW)

		expect(next.entries['ancient']).toBeUndefined()
	})

	it('preserves play history when adopting a known entry from disk', () => {
		const ledger = makeLedger(100 * MB, [
			makeEntry({
				trackId: 'known',
				state: 'present',
				sizeBytes: 5 * MB,
				playEvents: [NOW - DAY],
			}),
		])

		const next = reconcile(
			ledger,
			{ present: [{ trackId: 'known', sizeBytes: 5 * MB }], fetching: [] },
			NOW,
		)

		expect(next.entries['known']).toBe(ledger.entries['known'])
	})
})

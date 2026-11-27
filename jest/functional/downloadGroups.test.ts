import { groupDownloads, STALE_AFTER_MS } from '../../src/utils/download-groups'
import type { QueuedDownload } from '../../src/stores/download-queue'

const NOW = 1_000_000_000

const entry = (
	trackId: string,
	albumId: string | undefined,
	overrides: Partial<QueuedDownload> = {},
): QueuedDownload => ({
	trackId,
	title: `Track ${trackId}`,
	albumId,
	album: albumId ? `Album ${albumId}` : undefined,
	artist: 'Artist',
	queuedAt: NOW,
	done: false,
	...overrides,
})

const running = (...pairs: [string, number][]) => new Map(pairs)

describe('groupDownloads', () => {
	it('groups the tracks of an album, with how many are done and how far the running ones are', () => {
		const { groups } = groupDownloads(
			[
				entry('1', 'a', { done: true }),
				entry('2', 'a', { done: true }),
				entry('3', 'a'),
				entry('4', 'a'),
			],
			running(['3', 0.5], ['4', 0]),
			NOW,
		)

		expect(groups).toHaveLength(1)
		expect(groups[0]).toMatchObject({
			albumId: 'a',
			title: 'Album a',
			artist: 'Artist',
			total: 4,
			done: 2,
			trackIds: ['1', '2', '3', '4'],
		})
		// (2 done + 0.5 + 0) of 4
		expect(groups[0].progress).toBeCloseTo(0.625)
	})

	it('has each album its own progress', () => {
		const { groups } = groupDownloads(
			[
				entry('1', 'a', { done: true }),
				entry('2', 'a'),
				entry('3', 'b'),
				entry('4', 'b'),
				entry('5', 'b'),
			],
			running(['2', 0.5], ['3', 0.9]),
			NOW,
		)

		const byAlbum = Object.fromEntries(groups.map((g) => [g.albumId, g]))

		expect(byAlbum.a.progress).toBeCloseTo(0.75)
		expect(byAlbum.b.progress).toBeCloseTo(0.3)
	})

	it('lists a track with no album under its own name', () => {
		const { groups } = groupDownloads(
			[entry('9', undefined, { title: 'Loose' })],
			running(),
			NOW,
		)

		expect(groups).toMatchObject([{ key: 'track:9', title: 'Loose', total: 1, done: 0 }])
	})

	it('goes in the order they were queued, then by name', () => {
		const { groups } = groupDownloads(
			[
				entry('1', 'late', { queuedAt: NOW + 50 }),
				entry('2', 'b', { queuedAt: NOW }),
				entry('3', 'a', { queuedAt: NOW }),
			],
			running(['1', 0.1], ['2', 0.1], ['3', 0.1]),
			NOW,
		)

		expect(groups.map((g) => g.albumId)).toEqual(['a', 'b', 'late'])
	})

	it('leaves an album out once all of it is done, and says to forget its tracks', () => {
		const { groups, forget } = groupDownloads(
			[entry('1', 'a', { done: true }), entry('2', 'a', { done: true }), entry('3', 'b')],
			running(['3', 0.2]),
			NOW,
		)

		expect(groups.map((g) => g.albumId)).toEqual(['b'])
		expect(forget.sort()).toEqual(['1', '2'])
	})

	it('gives up on tracks the downloader never took up, and counts the rest', () => {
		const { groups, forget } = groupDownloads(
			[
				entry('1', 'a', { queuedAt: NOW - STALE_AFTER_MS - 1 }),
				entry('2', 'a', { queuedAt: NOW - STALE_AFTER_MS - 1 }),
				entry('3', 'a'),
			],
			running(['2', 0.4]),
			NOW,
		)

		// 1 was dropped, 2 is still running though old, 3 is recent
		expect(forget).toEqual(['1'])
		expect(groups[0].total).toBe(2)
		expect(groups[0].trackIds).toEqual(['2', '3'])
	})

	it('does not give up on a recent track the downloader has not got to yet', () => {
		const { groups, forget } = groupDownloads(
			[entry('1', 'a'), entry('2', 'a')],
			running(),
			NOW,
		)

		expect(forget).toEqual([])
		expect(groups[0]).toMatchObject({ total: 2, done: 0, progress: 0 })
	})

	it('keeps progress between 0 and 1 whatever the downloader reports', () => {
		const { groups } = groupDownloads(
			[entry('1', 'a'), entry('2', 'a')],
			running(['1', 7], ['2', -3]),
			NOW,
		)

		expect(groups[0].progress).toBeCloseTo(0.5)
	})

	it('has nothing for nothing', () => {
		expect(groupDownloads([], running(), NOW)).toEqual({ groups: [], forget: [] })
	})
})

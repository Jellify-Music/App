import { chunk, mapWithConcurrency } from '../../src/utils/concurrency'

describe('chunk', () => {
	it('splits into pieces of at most the size, keeping the order', () => {
		expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
		expect(chunk([1, 2, 3, 4], 2)).toEqual([
			[1, 2],
			[3, 4],
		])
	})

	it('gives nothing for nothing', () => {
		expect(chunk([], 3)).toEqual([])
	})
})

describe('mapWithConcurrency', () => {
	it('returns the results in the order of the list, not of completion', async () => {
		const delays = [30, 5, 15, 1]

		const result = await mapWithConcurrency(delays, 2, async (ms, index) => {
			await new Promise((resolve) => setTimeout(resolve, ms))
			return index
		})

		expect(result).toEqual([0, 1, 2, 3])
	})

	it('never runs more than the limit at once', async () => {
		let running = 0
		let peak = 0

		await mapWithConcurrency(
			Array.from({ length: 12 }, (_, i) => i),
			3,
			async () => {
				running++
				peak = Math.max(peak, running)
				await new Promise((resolve) => setTimeout(resolve, 2))
				running--
			},
		)

		expect(peak).toBe(3)
	})

	it('handles an empty list, and a limit above the length', async () => {
		expect(await mapWithConcurrency([], 4, async () => 1)).toEqual([])
		expect(await mapWithConcurrency([1, 2], 10, async (n) => n * 2)).toEqual([2, 4])
	})

	it('rejects with the first failure', async () => {
		await expect(
			mapWithConcurrency([1, 2, 3], 2, async (n) => {
				if (n === 2) throw new Error('boom')
				return n
			}),
		).rejects.toThrow('boom')
	})
})

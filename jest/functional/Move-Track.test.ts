import move from '../../src/providers/Player/utils/move'

const playQueue = [
	{ id: '1', index: 0, url: 'https://example.com', item: { Id: '1' } },
	{ id: '2', index: 1, url: 'https://example.com', item: { Id: '2' } },
	{ id: '3', index: 2, url: 'https://example.com', item: { Id: '3' } },
]

/**
 * Tests the move track utility function
 *
 * Doesn't inspect the RNTP queue, only the play queue
 *
 * Doesn't inspect the track indexes, but rather the track IDs to ensure the correct track is moved
 */
describe('Move Track Util', () => {
	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('moveTrack', () => {
		it('should move the first track to the second index', () => {
			const result = move(playQueue, 0, 1)

			expect(result).toEqual([
				{ id: '2', index: 1, url: 'https://example.com', item: { Id: '2' } },
				{ id: '1', index: 0, url: 'https://example.com', item: { Id: '1' } },
				{ id: '3', index: 2, url: 'https://example.com', item: { Id: '3' } },
			])
		})

		it('should move the last track to the first index', () => {
			const result = move(playQueue, 2, 0)

			expect(result).toEqual([
				{ id: '3', index: 2, url: 'https://example.com', item: { Id: '3' } },
				{ id: '1', index: 0, url: 'https://example.com', item: { Id: '1' } },
				{ id: '2', index: 1, url: 'https://example.com', item: { Id: '2' } },
			])
		})
	})
})

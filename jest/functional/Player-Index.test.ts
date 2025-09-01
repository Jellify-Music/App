import { QueuingType } from '../../src/enums/queuing-type'
import { findPlayNextIndexStart, findPlayQueueIndexStart } from '../../src/providers/Player/utils'

describe('Queue Index Util', () => {
	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('findPlayNextIndexStart', () => {
		it('should return 0 if the queue is empty', async () => {
			const result = await findPlayNextIndexStart([])

			expect(result).toBe(0)
		})

		it('should return the index of the active track + 1', async () => {
			const result = await findPlayNextIndexStart([
				{
					id: '1',
					index: 0,
					url: 'https://example.com',
					item: { Id: '1' },
					duration: 420,
					sessionId: 'TEST_SESSION_ID',
					sourceType: 'stream',
				},
			])

			expect(result).toBe(1)
		})

		it('should return 0 if the active track is not in the queue', async () => {
			const result = await findPlayNextIndexStart([
				{
					id: '1',
					index: 0,
					url: 'https://example.com',
					item: { Id: '2' },
					duration: 420,
					sessionId: 'TEST_SESSION_ID',
					sourceType: 'stream',
				},
			])

			expect(result).toBe(0)
		})
	})

	describe('findPlayQueueIndexStart', () => {
		it('should return the index of the first track that is not from selection', async () => {
			const result = await findPlayQueueIndexStart(
				[
					{
						id: '1',
						index: 0,
						url: 'https://example.com',
						item: { Id: '1' },
						QueuingType: QueuingType.FromSelection,
						duration: 420,
						sessionId: 'TEST_SESSION_ID',
						sourceType: 'stream',
					},
					{
						id: '2',
						index: 1,
						url: 'https://example.com',
						item: { Id: '2' },
						QueuingType: QueuingType.PlayingNext,
						duration: 420,
						sessionId: 'TEST_SESSION_ID',
						sourceType: 'stream',
					},
					{
						id: '3',
						index: 2,
						url: 'https://example.com',
						item: { Id: '3' },
						QueuingType: QueuingType.DirectlyQueued,
						duration: 420,
						sessionId: 'TEST_SESSION_ID',
						sourceType: 'stream',
					},
				],
				0,
			)

			expect(result).toBe(3)
		})

		it('should return the index of the first track that is not from selection and after other queued tracks', async () => {
			const result = await findPlayQueueIndexStart(
				[
					{
						id: '1',
						index: 0,
						url: 'https://example.com',
						item: { Id: '1' },
						QueuingType: QueuingType.FromSelection,
						duration: 420,
						sessionId: 'TEST_SESSION_ID',
						sourceType: 'stream',
					},
					{
						id: '2',
						index: 1,
						url: 'https://example.com',
						item: { Id: '2' },
						QueuingType: QueuingType.PlayingNext,
						duration: 420,
						sessionId: 'TEST_SESSION_ID',
						sourceType: 'stream',
					},
					{
						id: '3',
						index: 2,
						url: 'https://example.com',
						item: { Id: '3' },
						QueuingType: QueuingType.DirectlyQueued,
						duration: 420,
						sessionId: 'TEST_SESSION_ID',
						sourceType: 'stream',
					},
					{
						id: '4',
						index: 3,
						url: 'https://example.com',
						item: { Id: '4' },
						QueuingType: QueuingType.FromSelection,
						duration: 420,
						sessionId: 'TEST_SESSION_ID',
						sourceType: 'stream',
					},
					{
						id: '5',
						index: 4,
						url: 'https://example.com',
						item: { Id: '5' },
						QueuingType: QueuingType.FromSelection,
						duration: 420,
						sessionId: 'TEST_SESSION_ID',
						sourceType: 'stream',
					},
				],
				0,
			)

			expect(result).toBe(3)
		})

		it('should add in relation to the active track if shuffled, but respect queue priority', async () => {
			const result = await findPlayQueueIndexStart(
				[
					{
						id: '2',
						index: 0,
						url: 'https://example.com',
						item: { Id: '2' },
						QueuingType: QueuingType.FromSelection,
						duration: 420,
						sessionId: 'TEST_SESSION_ID',
						sourceType: 'stream',
					},
					{
						id: '1',
						index: 1,
						url: 'https://example.com',
						item: { Id: '1' },
						QueuingType: QueuingType.PlayingNext,
						duration: 420,
						sessionId: 'TEST_SESSION_ID',
						sourceType: 'stream',
					},
					{
						id: '3',
						index: 2,
						url: 'https://example.com',
						item: { Id: '3' },
						QueuingType: QueuingType.DirectlyQueued,
						duration: 420,
						sessionId: 'TEST_SESSION_ID',
						sourceType: 'stream',
					},
					{
						id: '5',
						index: 3,
						url: 'https://example.com',
						item: { Id: '5' },
						QueuingType: QueuingType.FromSelection,
						duration: 420,
						sessionId: 'TEST_SESSION_ID',
						sourceType: 'stream',
					},
					{
						id: '4',
						index: 4,
						url: 'https://example.com',
						item: { Id: '4' },
						QueuingType: QueuingType.FromSelection,
						duration: 420,
						sessionId: 'TEST_SESSION_ID',
						sourceType: 'stream',
					},
					{
						id: '6',
						index: 5,
						url: 'https://example.com',
						item: { Id: '6' },
						QueuingType: QueuingType.FromSelection,
						duration: 420,
						sessionId: 'TEST_SESSION_ID',
						sourceType: 'stream',
					},
				],
				0,
			)

			expect(result).toBe(3)
		})
	})
})

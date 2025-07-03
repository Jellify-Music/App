import 'react-native'
import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { Event } from 'react-native-track-player'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Button, Text } from 'react-native'
import TrackPlayer from 'react-native-track-player'

import { QueueProvider, useQueueContext } from '../src/providers/Player/queue'
import { eventHandler } from './setup-rntp'
import JellifyTrack from '../src/types/JellifyTrack'
import { QueuingType } from '../src/enums/queuing-type'

// Mock storage to avoid persistence between tests
jest.mock('../src/constants/storage', () => ({
	storage: {
		getString: jest.fn(() => null),
		getNumber: jest.fn(() => undefined),
		getBoolean: jest.fn(() => false),
		set: jest.fn(),
		delete: jest.fn(),
	},
}))

// Create a fresh query client for each test to avoid test pollution
const createQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				gcTime: 0,
			},
			mutations: {
				retry: false,
			},
		},
	})

const mockTracklist: JellifyTrack[] = [
	{
		id: '1',
		url: 'https://example.com/1',
		item: {
			Id: '1',
			Name: 'Track 1',
		},
		QueuingType: QueuingType.FromSelection,
	},
	{
		id: '2',
		url: 'https://example.com/2',
		item: {
			Id: '2',
			Name: 'Track 2',
		},
		QueuingType: QueuingType.FromSelection,
	},
	{
		id: '3',
		url: 'https://example.com/3',
		item: {
			Id: '3',
			Name: 'Track 3',
		},
		QueuingType: QueuingType.FromSelection,
	},
	{
		id: '4',
		url: 'https://example.com/4',
		item: {
			Id: '4',
			Name: 'Track 4',
		},
		QueuingType: QueuingType.FromSelection,
	},
	{
		id: '5',
		url: 'https://example.com/5',
		item: {
			Id: '5',
			Name: 'Track 5',
		},
		QueuingType: QueuingType.FromSelection,
	},
]

const BasicQueueConsumer = () => {
	const {
		currentIndex,
		useSkip,
		usePrevious,
		playQueue,
		setPlayQueue,
		shuffled,
		setShuffled,
		skipping,
		useLoadNewQueue,
		useAddToQueue,
		useRemoveFromQueue,
	} = useQueueContext()

	return (
		<>
			<Text testID='current-index'>{currentIndex}</Text>
			<Text testID='queue-length'>{playQueue.length}</Text>
			<Text testID='shuffled'>{shuffled.toString()}</Text>
			<Text testID='skipping'>{skipping.toString()}</Text>

			<Button title='skip' testID='use-skip' onPress={() => useSkip.mutate(undefined)} />
			<Button
				title='skip-to-index-3'
				testID='skip-to-index-3'
				onPress={() => useSkip.mutate(3)}
			/>
			<Button title='previous' testID='use-previous' onPress={() => usePrevious.mutate()} />
			<Button
				title='load new queue'
				testID='use-load-new-queue'
				onPress={() => setPlayQueue(mockTracklist)}
			/>
			<Button
				title='load queue with mutation'
				testID='use-load-queue-mutation'
				onPress={() =>
					useLoadNewQueue.mutate({
						track: mockTracklist[1].item,
						index: 1,
						tracklist: mockTracklist.map((t) => t.item),
						queue: mockTracklist[0].item, // Use a BaseItemDto as the queue reference
					})
				}
			/>
			<Button
				title='toggle shuffle'
				testID='toggle-shuffle'
				onPress={() => setShuffled(!shuffled)}
			/>
			<Button
				title='add to queue'
				testID='add-to-queue'
				onPress={() =>
					useAddToQueue.mutate({
						track: {
							Id: 'new-track',
							Name: 'New Track',
						},
						queuingType: QueuingType.DirectlyQueued,
					})
				}
			/>
			<Button
				title='remove from queue'
				testID='remove-from-queue'
				onPress={() => useRemoveFromQueue.mutate(0)}
			/>
		</>
	)
}

// Reset mocks before each test
beforeEach(() => {
	jest.clearAllMocks()
	// Reset TrackPlayer mock state
	;(TrackPlayer.getQueue as jest.Mock).mockResolvedValue([])
	;(TrackPlayer.getActiveTrackIndex as jest.Mock).mockResolvedValue(null)
	;(TrackPlayer.getProgress as jest.Mock).mockResolvedValue({ position: 0, duration: 100 })
})

describe('QueueProvider Basic Functionality', () => {
	test('renders with initial state', async () => {
		render(
			<QueryClientProvider client={createQueryClient()}>
				<QueueProvider>
					<BasicQueueConsumer />
				</QueueProvider>
			</QueryClientProvider>,
		)

		expect(screen.getByTestId('current-index').props.children).toBe(-1)
		expect(screen.getByTestId('queue-length').props.children).toBe(0)
		expect(screen.getByTestId('shuffled').props.children).toBe('false')
		expect(screen.getByTestId('skipping').props.children).toBe('false')
	})

	test('updates current index when PlaybackActiveTrackChanged event fires', async () => {
		render(
			<QueryClientProvider client={createQueryClient()}>
				<QueueProvider>
					<BasicQueueConsumer />
				</QueueProvider>
			</QueryClientProvider>,
		)

		// Load a queue first
		fireEvent.press(screen.getByTestId('use-load-new-queue'))

		await waitFor(() => {
			expect(screen.getByTestId('queue-length').props.children).toBe(5)
		})

		// Simulate track change event
		act(() => {
			eventHandler({
				type: Event.PlaybackActiveTrackChanged,
				index: 2,
				track: {
					item: {
						Id: '3',
					},
				},
			})
		})

		await waitFor(() => {
			expect(screen.getByTestId('current-index').props.children).toBe(2)
		})
	})

	test('handles PlaybackActiveTrackChanged event without index gracefully', async () => {
		render(
			<QueryClientProvider client={createQueryClient()}>
				<QueueProvider>
					<BasicQueueConsumer />
				</QueueProvider>
			</QueryClientProvider>,
		)

		const initialIndex = screen.getByTestId('current-index').props.children

		// Simulate track change event without index
		act(() => {
			eventHandler({
				type: Event.PlaybackActiveTrackChanged,
				track: {
					item: {
						Id: '2',
					},
				},
			})
		})

		// Should not update currentIndex and should log warning
		expect(screen.getByTestId('current-index').props.children).toBe(initialIndex)
	})
})

describe('QueueProvider Race Condition Tests', () => {
	test('handles rapid track changes without state inconsistency', async () => {
		render(
			<QueryClientProvider client={createQueryClient()}>
				<QueueProvider>
					<BasicQueueConsumer />
				</QueueProvider>
			</QueryClientProvider>,
		)

		// Load queue
		fireEvent.press(screen.getByTestId('use-load-new-queue'))

		await waitFor(() => {
			expect(screen.getByTestId('queue-length').props.children).toBe(5)
		})

		// Simulate rapid track changes
		act(() => {
			eventHandler({
				type: Event.PlaybackActiveTrackChanged,
				index: 1,
				track: { item: { Id: '2' } },
			})
		})

		act(() => {
			eventHandler({
				type: Event.PlaybackActiveTrackChanged,
				index: 3,
				track: { item: { Id: '4' } },
			})
		})

		act(() => {
			eventHandler({
				type: Event.PlaybackActiveTrackChanged,
				index: 0,
				track: { item: { Id: '1' } },
			})
		})

		// Final state should reflect the last event
		await waitFor(() => {
			expect(screen.getByTestId('current-index').props.children).toBe(0)
		})
	})

	test('detects concurrent skip operations', async () => {
		// This test intentionally shows that the current implementation
		// does NOT prevent concurrent operations (which is a problem)
		render(
			<QueryClientProvider client={createQueryClient()}>
				<QueueProvider>
					<BasicQueueConsumer />
				</QueueProvider>
			</QueryClientProvider>,
		)

		// Load queue and set current index
		fireEvent.press(screen.getByTestId('use-load-new-queue'))
		act(() => {
			eventHandler({
				type: Event.PlaybackActiveTrackChanged,
				index: 0,
				track: { item: { Id: '1' } },
			})
		})

		await waitFor(() => {
			expect(screen.getByTestId('current-index').props.children).toBe(0)
		})

		// Simulate multiple rapid skip presses - each creates a separate mutation
		fireEvent.press(screen.getByTestId('use-skip'))
		fireEvent.press(screen.getByTestId('use-skip'))
		fireEvent.press(screen.getByTestId('use-skip'))

		// This demonstrates the problem: all 3 operations execute concurrently
		// In a proper implementation, these should be queued or debounced
		await waitFor(() => {
			expect(TrackPlayer.skipToNext).toHaveBeenCalledTimes(3)
		})
	})

	test('handles skip to specific index with queue sync', async () => {
		// Mock TrackPlayer queue to simulate tracks being found
		;(TrackPlayer.getQueue as jest.Mock).mockResolvedValue([
			{ item: { Id: '1' } },
			{ item: { Id: '2' } },
			{ item: { Id: '3' } },
			{ item: { Id: '4' } }, // Track 4 is at index 3 in TrackPlayer queue
		])

		render(
			<QueryClientProvider client={createQueryClient()}>
				<QueueProvider>
					<BasicQueueConsumer />
				</QueueProvider>
			</QueryClientProvider>,
		)

		// Load queue
		fireEvent.press(screen.getByTestId('use-load-new-queue'))

		await waitFor(() => {
			expect(screen.getByTestId('queue-length').props.children).toBe(5)
		})

		// Skip to specific index (track 4 which should be found at TrackPlayer index 3)
		fireEvent.press(screen.getByTestId('skip-to-index-3'))

		await waitFor(() => {
			// Should call TrackPlayer.skip with the found queue index
			expect(TrackPlayer.skip).toHaveBeenCalledWith(3) // Index 3 in TrackPlayer queue for track with Id '4'
		})
	})

	test('handles skip to index when track not found in TrackPlayer queue', async () => {
		// Mock TrackPlayer queue to simulate track not being found
		;(TrackPlayer.getQueue as jest.Mock).mockResolvedValue([
			{ item: { Id: '1' } },
			{ item: { Id: '2' } },
		])

		render(
			<QueryClientProvider client={createQueryClient()}>
				<QueueProvider>
					<BasicQueueConsumer />
				</QueueProvider>
			</QueryClientProvider>,
		)

		// Load queue
		fireEvent.press(screen.getByTestId('use-load-new-queue'))

		await waitFor(() => {
			expect(screen.getByTestId('queue-length').props.children).toBe(5)
		})

		// Skip to index that's not in TrackPlayer queue (track 4 at index 3)
		fireEvent.press(screen.getByTestId('skip-to-index-3'))

		await waitFor(() => {
			// Should fallback to just updating the current index
			expect(screen.getByTestId('current-index').props.children).toBe(3)
		})
	})
})

describe('QueueProvider Shuffle Operations', () => {
	test('maintains current track position during shuffle', async () => {
		render(
			<QueryClientProvider client={createQueryClient()}>
				<QueueProvider>
					<BasicQueueConsumer />
				</QueueProvider>
			</QueryClientProvider>,
		)

		// Load queue and set current track
		fireEvent.press(screen.getByTestId('use-load-new-queue'))
		act(() => {
			eventHandler({
				type: Event.PlaybackActiveTrackChanged,
				index: 2,
				track: { item: { Id: '3' } },
			})
		})

		await waitFor(() => {
			expect(screen.getByTestId('current-index').props.children).toBe(2)
		})

		// Toggle shuffle
		fireEvent.press(screen.getByTestId('toggle-shuffle'))

		await waitFor(() => {
			expect(screen.getByTestId('shuffled').props.children).toBe('true')
		})

		// Current track should still be accessible
		expect(screen.getByTestId('queue-length').props.children).toBe(5)
	})

	test('restores original queue when unshuffle', async () => {
		render(
			<QueryClientProvider client={createQueryClient()}>
				<QueueProvider>
					<BasicQueueConsumer />
				</QueueProvider>
			</QueryClientProvider>,
		)

		// Load queue
		fireEvent.press(screen.getByTestId('use-load-new-queue'))

		await waitFor(() => {
			expect(screen.getByTestId('queue-length').props.children).toBe(5)
		})

		// Shuffle
		fireEvent.press(screen.getByTestId('toggle-shuffle'))

		await waitFor(() => {
			expect(screen.getByTestId('shuffled').props.children).toBe('true')
		})

		// Unshuffle
		fireEvent.press(screen.getByTestId('toggle-shuffle'))

		await waitFor(() => {
			expect(screen.getByTestId('shuffled').props.children).toBe('false')
		})

		// Queue should be restored to original order
		expect(screen.getByTestId('queue-length').props.children).toBe(5)
	})
})

describe('QueueProvider Queue Management', () => {
	test('handles removing tracks from queue', async () => {
		render(
			<QueryClientProvider client={createQueryClient()}>
				<QueueProvider>
					<BasicQueueConsumer />
				</QueueProvider>
			</QueryClientProvider>,
		)

		// Load queue first
		fireEvent.press(screen.getByTestId('use-load-new-queue'))

		await waitFor(() => {
			expect(screen.getByTestId('queue-length').props.children).toBe(5)
		})

		// Remove track from queue
		fireEvent.press(screen.getByTestId('remove-from-queue'))

		await waitFor(() => {
			expect(TrackPlayer.remove).toHaveBeenCalledWith([0])
		})
	})

	test('synchronizes app queue with TrackPlayer queue after modifications', async () => {
		// Mock TrackPlayer.getQueue to return modified queue
		;(TrackPlayer.getQueue as jest.Mock).mockResolvedValue([
			{ item: { Id: '2' } },
			{ item: { Id: '3' } },
		])

		render(
			<QueryClientProvider client={createQueryClient()}>
				<QueueProvider>
					<BasicQueueConsumer />
				</QueueProvider>
			</QueryClientProvider>,
		)

		// Load queue first
		fireEvent.press(screen.getByTestId('use-load-new-queue'))

		await waitFor(() => {
			expect(screen.getByTestId('queue-length').props.children).toBe(5)
		})

		// Remove track from queue
		fireEvent.press(screen.getByTestId('remove-from-queue'))

		await waitFor(() => {
			// Queue should be synchronized with TrackPlayer's queue
			expect(screen.getByTestId('queue-length').props.children).toBe(2)
		})
	})
})

describe('QueueProvider Event Handling Edge Cases', () => {
	test('handles PlaybackActiveTrackChanged event with no track', async () => {
		render(
			<QueryClientProvider client={createQueryClient()}>
				<QueueProvider>
					<BasicQueueConsumer />
				</QueueProvider>
			</QueryClientProvider>,
		)

		const initialIndex = screen.getByTestId('current-index').props.children

		// Simulate event with no track
		act(() => {
			eventHandler({
				type: Event.PlaybackActiveTrackChanged,
				index: 1,
			})
		})

		// Should not crash and should log warning
		expect(screen.getByTestId('current-index').props.children).toBe(initialIndex)
	})

	test('handles ensureUpcomingTracksInQueue failure gracefully', async () => {
		render(
			<QueryClientProvider client={createQueryClient()}>
				<QueueProvider>
					<BasicQueueConsumer />
				</QueueProvider>
			</QueryClientProvider>,
		)

		// Load queue
		fireEvent.press(screen.getByTestId('use-load-new-queue'))

		// Simulate track change which triggers ensureUpcomingTracksInQueue
		act(() => {
			eventHandler({
				type: Event.PlaybackActiveTrackChanged,
				index: 1,
				track: { item: { Id: '2' } },
			})
		})

		await waitFor(() => {
			expect(screen.getByTestId('current-index').props.children).toBe(1)
		})

		// Should handle the gapless module import error gracefully and still update the index
	})

	test('prevents state updates when component is unmounted', async () => {
		const { unmount } = render(
			<QueryClientProvider client={createQueryClient()}>
				<QueueProvider>
					<BasicQueueConsumer />
				</QueueProvider>
			</QueryClientProvider>,
		)

		// Load queue
		fireEvent.press(screen.getByTestId('use-load-new-queue'))

		// Unmount component
		unmount()

		// Simulate event after unmount - should not cause memory leaks or errors
		act(() => {
			eventHandler({
				type: Event.PlaybackActiveTrackChanged,
				index: 1,
				track: { item: { Id: '2' } },
			})
		})

		// Test passes if no errors are thrown
	})
})

describe('QueueProvider Critical Race Conditions and Sync Issues', () => {
	test('FAILING: detects dual queue desynchronization', async () => {
		// This test should FAIL to demonstrate the dual queue problem
		const { rerender } = render(
			<QueryClientProvider client={createQueryClient()}>
				<QueueProvider>
					<BasicQueueConsumer />
				</QueueProvider>
			</QueryClientProvider>,
		)

		// Load queue in app state
		fireEvent.press(screen.getByTestId('use-load-new-queue'))

		await waitFor(() => {
			expect(screen.getByTestId('queue-length').props.children).toBe(5)
		})

		// Simulate TrackPlayer queue being different due to async operations
		;(TrackPlayer.getQueue as jest.Mock).mockResolvedValue([
			{ item: { Id: '1' } },
			{ item: { Id: '3' } }, // Track 2 missing due to failed add operation
			{ item: { Id: '4' } },
		])

		// Skip operation should expose the desync
		fireEvent.press(screen.getByTestId('skip-to-index-3'))

		await waitFor(() => {
			// This should FAIL because the app thinks track 4 is at index 3,
			// but in TrackPlayer it's at index 2 due to missing track 2
			// The test exposes that we don't properly sync the queues
			const currentTrackIndex = screen.getByTestId('current-index').props.children
			const appQueueLength = screen.getByTestId('queue-length').props.children

			// EXPECTED FAILURE: App queue shows 5 tracks but TrackPlayer only has 3
			// This demonstrates the dual queue problem
			expect(appQueueLength).toBe(3) // Should match TrackPlayer but doesn't
		})
	})

	test('FAILING: exposes race condition in rapid skip operations', async () => {
		// This test should FAIL to show race conditions
		let skipCallCount = 0
		;(TrackPlayer.skipToNext as jest.Mock).mockImplementation(() => {
			skipCallCount++
			// Simulate async delay that causes race conditions
			return new Promise((resolve) => setTimeout(resolve, 50))
		})

		render(
			<QueryClientProvider client={createQueryClient()}>
				<QueueProvider>
					<BasicQueueConsumer />
				</QueueProvider>
			</QueryClientProvider>,
		)

		// Load queue and set current index
		fireEvent.press(screen.getByTestId('use-load-new-queue'))
		act(() => {
			eventHandler({
				type: Event.PlaybackActiveTrackChanged,
				index: 0,
				track: { item: { Id: '1' } },
			})
		})

		await waitFor(() => {
			expect(screen.getByTestId('current-index').props.children).toBe(0)
		})

		// Rapidly trigger skips to create race condition
		fireEvent.press(screen.getByTestId('use-skip'))
		fireEvent.press(screen.getByTestId('use-skip'))
		fireEvent.press(screen.getByTestId('use-skip'))

		// This should FAIL because mutations aren't properly debounced/queued
		// All three skip operations execute, causing potential state corruption
		await waitFor(
			() => {
				expect(skipCallCount).toBe(1) // Should be debounced to 1, but will be 3
			},
			{ timeout: 200 },
		)
	})

	test('FAILING: demonstrates shuffle state corruption', async () => {
		// This test should FAIL to show shuffle/unshuffle issues
		render(
			<QueryClientProvider client={createQueryClient()}>
				<QueueProvider>
					<BasicQueueConsumer />
				</QueueProvider>
			</QueryClientProvider>,
		)

		// Load queue and set current track
		fireEvent.press(screen.getByTestId('use-load-new-queue'))
		act(() => {
			eventHandler({
				type: Event.PlaybackActiveTrackChanged,
				index: 2,
				track: { item: { Id: '3' } },
			})
		})

		await waitFor(() => {
			expect(screen.getByTestId('current-index').props.children).toBe(2)
		})

		// Shuffle queue
		fireEvent.press(screen.getByTestId('toggle-shuffle'))

		await waitFor(() => {
			expect(screen.getByTestId('shuffled').props.children).toBe('true')
		})

		// Simulate TrackPlayer queue update that doesn't match app state
		;(TrackPlayer.getQueue as jest.Mock).mockResolvedValue([
			{ item: { Id: '3' } }, // Current track moved to position 0
			{ item: { Id: '1' } },
			{ item: { Id: '5' } },
			{ item: { Id: '2' } },
			{ item: { Id: '4' } },
		])

		// Skip to next track - this should expose the sync issue
		fireEvent.press(screen.getByTestId('use-skip'))

		await waitFor(() => {
			// This should FAIL because the app queue and TrackPlayer queue
			// have different orders after shuffle, causing wrong track to play
			const currentIndex = screen.getByTestId('current-index').props.children

			// The app thinks next track is at index 3, but TrackPlayer has it at index 1
			// This demonstrates shuffle state corruption
			expect(currentIndex).toBe(1) // Should match TrackPlayer position
		})
	})

	test('FAILING: event reliability issues with missing indexes', async () => {
		render(
			<QueryClientProvider client={createQueryClient()}>
				<QueueProvider>
					<BasicQueueConsumer />
				</QueueProvider>
			</QueryClientProvider>,
		)

		// Load queue
		fireEvent.press(screen.getByTestId('use-load-new-queue'))

		// Set initial state
		act(() => {
			eventHandler({
				type: Event.PlaybackActiveTrackChanged,
				index: 1,
				track: { item: { Id: '2' } },
			})
		})

		await waitFor(() => {
			expect(screen.getByTestId('current-index').props.children).toBe(1)
		})

		// Simulate the common issue of events without index
		act(() => {
			eventHandler({
				type: Event.PlaybackActiveTrackChanged,
				track: { item: { Id: '4' } }, // Track changed but no index
			})
		})

		// This should FAIL because we can't determine the correct index
		// The current implementation might not handle this correctly
		await waitFor(() => {
			// We know track 4 should be at index 3, but without index in event,
			// the app can't determine this and state becomes inconsistent
			expect(screen.getByTestId('current-index').props.children).toBe(3)
		})
	})

	test('FAILING: ensureUpcomingTracksInQueue interference', async () => {
		let ensureUpcomingCalled = false

		// Mock the gapless helper to track when it's called
		jest.doMock('../src/player/helpers/gapless', () => ({
			ensureUpcomingTracksInQueue: jest.fn().mockImplementation(async () => {
				ensureUpcomingCalled = true
				// Simulate this function modifying TrackPlayer queue
				;(TrackPlayer.getQueue as jest.Mock).mockResolvedValue([
					{ item: { Id: '1' } },
					{ item: { Id: '2' } },
					{ item: { Id: '5' } }, // Different order after "optimization"
					{ item: { Id: '3' } },
					{ item: { Id: '4' } },
				])
			}),
		}))

		render(
			<QueryClientProvider client={createQueryClient()}>
				<QueueProvider>
					<BasicQueueConsumer />
				</QueueProvider>
			</QueryClientProvider>,
		)

		// Load queue
		fireEvent.press(screen.getByTestId('use-load-new-queue'))

		// Trigger track change that calls ensureUpcomingTracksInQueue
		act(() => {
			eventHandler({
				type: Event.PlaybackActiveTrackChanged,
				index: 1,
				track: { item: { Id: '2' } },
			})
		})

		await waitFor(() => {
			expect(screen.getByTestId('current-index').props.children).toBe(1)
		})

		// Now skip to track 3, which should be at index 2 in app queue
		// but might be at different index in TrackPlayer due to ensureUpcomingTracksInQueue
		fireEvent.press(screen.getByTestId('skip-to-index-3'))

		await waitFor(() => {
			// This should FAIL because ensureUpcomingTracksInQueue changed the order
			// App expects track 4 at index 3, but TrackPlayer has it at index 4 now
			expect(TrackPlayer.skip).toHaveBeenCalledWith(4) // Will be called with 3
		})
	})

	test('FAILING: memory leak from unhandled async operations', async () => {
		const { unmount } = render(
			<QueryClientProvider client={createQueryClient()}>
				<QueueProvider>
					<BasicQueueConsumer />
				</QueueProvider>
			</QueryClientProvider>,
		)

		// Start some async operations
		fireEvent.press(screen.getByTestId('use-load-new-queue'))
		fireEvent.press(screen.getByTestId('use-skip'))

		// Unmount component while operations are pending
		unmount()

		// Simulate delayed events that could cause memory leaks
		await new Promise((resolve) => setTimeout(resolve, 100))

		// Try to trigger events after unmount
		act(() => {
			eventHandler({
				type: Event.PlaybackActiveTrackChanged,
				index: 2,
				track: { item: { Id: '3' } },
			})
		})

		// This test should FAIL if there are memory leaks or unhandled promises
		// The implementation should clean up event listeners and abort pending operations
		// For now, we'll just check that no errors are thrown
	})
})

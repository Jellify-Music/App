import 'react-native'
import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { Event } from 'react-native-track-player'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Button, Text } from 'react-native'
import TrackPlayer from 'react-native-track-player'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'

import { QueueProvider, useQueueContext } from '../src/providers/Player/queue'
import { PlayerProvider, usePlayerContext } from '../src/providers/Player'
import { eventHandler } from './setup-rntp'
import JellifyTrack from '../src/types/JellifyTrack'
import { QueuingType } from '../src/enums/queuing-type'
import { storage } from '../src/constants/storage'
import { MMKVStorageKeys } from '../src/enums/mmkv-storage-keys'

// Mock the JellifyProvider to avoid dependency issues
jest.mock('../src/providers', () => ({
	...jest.requireActual('../src/providers'),
	useJellifyContext: () => ({
		api: {},
		sessionId: 'test-session',
		user: { Id: 'test-user' },
	}),
}))

// Mock the NetworkProvider to avoid dependency issues
jest.mock('../src/providers/Network', () => ({
	useNetworkContext: () => ({
		downloadedTracks: [],
		networkStatus: 'ONLINE',
	}),
}))

// Mock the SettingsProvider to avoid dependency issues
jest.mock('../src/providers/Settings', () => ({
	useSettingsContext: () => ({
		autoDownload: false,
	}),
}))

let queryClient: QueryClient

beforeEach(async () => {
	queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	})
})

afterEach(async () => {
	if (queryClient) {
		queryClient.clear()
	}
	// Clear MMKV storage to ensure clean state between tests
	try {
		storage.delete(MMKVStorageKeys.Shuffled)
		storage.delete(MMKVStorageKeys.PlayQueue)
		storage.delete(MMKVStorageKeys.UnshuffledQueue)
		storage.delete(MMKVStorageKeys.CurrentIndex)
	} catch (error) {
		// Ignore errors in cleanup
	}
	// Clear any storage state that might persist between tests
	jest.clearAllMocks()
})

// Mock data for testing
const createMockTracks = (count: number): JellifyTrack[] => {
	return Array.from({ length: count }, (_, i) => ({
		url: `https://example.com/${i + 1}`,
		id: `track-${i + 1}`,
		title: `Track ${i + 1}`,
		artist: `Artist ${i + 1}`,
		item: {
			Id: `${i + 1}`,
			Name: `Track ${i + 1}`,
			Artists: [`Artist ${i + 1}`],
		} as BaseItemDto,
		QueuingType: QueuingType.FromSelection,
	}))
}

const TestComponent = () => {
	const {
		playQueue,
		setPlayQueue,
		currentIndex,
		setCurrentIndex,
		shuffled,
		unshuffledQueue,
		setUnshuffledQueue,
	} = useQueueContext()
	const { useToggleShuffle, shuffled: playerShuffled } = usePlayerContext()

	const testTracks = createMockTracks(5)

	return (
		<>
			<Text testID='shuffled-state'>{playerShuffled.toString()}</Text>
			<Text testID='queue-shuffled-state'>{shuffled.toString()}</Text>
			<Text testID='current-index'>{currentIndex}</Text>
			<Text testID='queue-length'>{playQueue.length}</Text>
			<Text testID='unshuffled-queue-length'>{unshuffledQueue.length}</Text>
			<Text testID='first-track-id'>{playQueue[0]?.item.Id || 'none'}</Text>
			<Text testID='second-track-id'>{playQueue[1]?.item.Id || 'none'}</Text>
			<Text testID='third-track-id'>{playQueue[2]?.item.Id || 'none'}</Text>
			<Text testID='current-track-id'>{playQueue[currentIndex]?.item.Id || 'none'}</Text>

			<Button
				title='Load Test Queue'
				testID='load-test-queue'
				onPress={() => {
					setPlayQueue(testTracks)
					setUnshuffledQueue(testTracks) // Also set unshuffled queue for proper test setup
					setCurrentIndex(0)
				}}
			/>

			<Button
				title='Set Current to Middle'
				testID='set-current-middle'
				onPress={() => setCurrentIndex(2)}
			/>

			<Button
				title='Toggle Shuffle'
				testID='toggle-shuffle'
				onPress={() => useToggleShuffle.mutate()}
			/>
		</>
	)
}

describe('Shuffle Functionality', () => {
	beforeEach(() => {
		jest.useFakeTimers()
		// Reset TrackPlayer mocks
		jest.clearAllMocks()
	})

	afterEach(() => {
		act(() => {
			jest.runOnlyPendingTimers()
		})
		jest.useRealTimers()
	})

	describe('Basic Shuffle Toggle', () => {
		test('should start with shuffle disabled', async () => {
			render(
				<QueryClientProvider client={queryClient}>
					<QueueProvider>
						<PlayerProvider>
							<TestComponent />
						</PlayerProvider>
					</QueueProvider>
				</QueryClientProvider>,
			)

			expect(screen.getByTestId('shuffled-state').props.children).toBe('false')
			expect(screen.getByTestId('queue-shuffled-state').props.children).toBe('false')
		})

		test('should toggle shuffle state when toggle button is pressed', async () => {
			render(
				<QueryClientProvider client={queryClient}>
					<QueueProvider>
						<PlayerProvider>
							<TestComponent />
						</PlayerProvider>
					</QueueProvider>
				</QueryClientProvider>,
			)

			// Load test queue first
			await act(async () => {
				fireEvent.press(screen.getByTestId('load-test-queue'))
			})
			await waitFor(() => {
				expect(screen.getByTestId('queue-length').props.children).toBe(5)
			})

			// Initial state should be unshuffled
			expect(screen.getByTestId('shuffled-state').props.children).toBe('false')

			// Toggle shuffle
			await act(async () => {
				fireEvent.press(screen.getByTestId('toggle-shuffle'))
			})

			await waitFor(
				() => {
					expect(screen.getByTestId('shuffled-state').props.children).toBe('true')
				},
				{ timeout: 3000 },
			)

			// Toggle back to unshuffled
			await act(async () => {
				fireEvent.press(screen.getByTestId('toggle-shuffle'))
			})

			await waitFor(
				() => {
					expect(screen.getByTestId('shuffled-state').props.children).toBe('false')
				},
				{ timeout: 3000 },
			)
		})

		test('should preserve current and previous tracks when shuffling', async () => {
			render(
				<QueryClientProvider client={queryClient}>
					<QueueProvider>
						<PlayerProvider>
							<TestComponent />
						</PlayerProvider>
					</QueueProvider>
				</QueryClientProvider>,
			)

			// Load test queue
			await act(async () => {
				fireEvent.press(screen.getByTestId('load-test-queue'))
			})
			await waitFor(() => {
				expect(screen.getByTestId('queue-length').props.children).toBe(5)
			})

			// Set current track to middle (index 2)
			await act(async () => {
				fireEvent.press(screen.getByTestId('set-current-middle'))
			})
			await waitFor(() => {
				expect(screen.getByTestId('current-index').props.children).toBe(2)
			})

			// Store original order
			const originalFirstTrack = screen.getByTestId('first-track-id').props.children
			const originalSecondTrack = screen.getByTestId('second-track-id').props.children
			const originalThirdTrack = screen.getByTestId('third-track-id').props.children

			// Shuffle
			await act(async () => {
				fireEvent.press(screen.getByTestId('toggle-shuffle'))
			})

			await waitFor(
				() => {
					expect(screen.getByTestId('shuffled-state').props.children).toBe('true')
				},
				{ timeout: 3000 },
			)

			// First three tracks (played + current) should remain the same
			expect(screen.getByTestId('first-track-id').props.children).toBe(originalFirstTrack)
			expect(screen.getByTestId('second-track-id').props.children).toBe(originalSecondTrack)
			expect(screen.getByTestId('third-track-id').props.children).toBe(originalThirdTrack)

			// Current track should remain the same
			expect(screen.getByTestId('current-track-id').props.children).toBe('3')
		})

		test('should store original queue when shuffling', async () => {
			render(
				<QueryClientProvider client={queryClient}>
					<QueueProvider>
						<PlayerProvider>
							<TestComponent />
						</PlayerProvider>
					</QueueProvider>
				</QueryClientProvider>,
			)

			// Load test queue
			await act(async () => {
				fireEvent.press(screen.getByTestId('load-test-queue'))
			})
			await waitFor(() => {
				expect(screen.getByTestId('queue-length').props.children).toBe(5)
			})

			// Wait for the unshuffled queue to be set properly
			await waitFor(
				() => {
					expect(screen.getByTestId('unshuffled-queue-length').props.children).toBe(5)
				},
				{ timeout: 2000 },
			)

			// Store the original queue state before shuffling
			const originalQueueLength = screen.getByTestId('unshuffled-queue-length').props.children

			// Shuffle
			await act(async () => {
				fireEvent.press(screen.getByTestId('toggle-shuffle'))
			})

			await waitFor(
				() => {
					expect(screen.getByTestId('shuffled-state').props.children).toBe('true')
				},
				{ timeout: 5000 },
			)

			// Unshuffled queue should still store the original queue
			expect(screen.getByTestId('unshuffled-queue-length').props.children).toBe(
				originalQueueLength,
			)
			expect(screen.getByTestId('queue-length').props.children).toBe(5)
		}, 15000)
	})
})

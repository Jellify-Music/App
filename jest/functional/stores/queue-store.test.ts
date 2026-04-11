import 'react-native'
import { renderHook } from '@testing-library/react-native'
import { TrackItem } from 'react-native-nitro-player'

jest.mock('../../../src/constants/storage', () => {
	const map = new Map()
	return {
		storage: {
			getString: jest.fn((key: string) => map.get(key)),
			set: jest.fn((key: string, value: string) => map.set(key, value)),
			remove: jest.fn((key: string) => map.delete(key)),
			getNumber: jest.fn(() => undefined),
			clearAll: jest.fn(() => map.clear()),
		},
		mmkvStateStorage: {
			getItem: jest.fn((key: string) => map.get(key) ?? null),
			setItem: jest.fn((key: string, value: string) => map.set(key, value)),
			removeItem: jest.fn((key: string) => map.delete(key)),
		},
	}
})

jest.mock('../../../src/constants/versioned-storage', () => ({
	createVersionedMmkvStorage: jest.fn(() => ({
		getItem: jest.fn(() => null),
		setItem: jest.fn(),
		removeItem: jest.fn(),
	})),
	migrateStorageIfNeeded: jest.fn(),
	STORAGE_SCHEMA_VERSIONS: { 'player-queue-storage': 2 },
}))

import {
	usePlayerQueueStore,
	useCurrentTrack,
	useCurrentTrackId,
	useCurrentIndex,
	useRepeatMode,
	usePlayQueue,
	useShuffle,
	useQueueRef,
	setNewQueue,
	clearQueueStore,
	setIsQueuing,
} from '../../../src/stores/player/queue'

const createTrack = (id: string): TrackItem =>
	({
		id,
		title: id,
		artist: 'Artist',
		album: 'Album',
		duration: 180,
		url: `https://example.com/${id}.mp3`,
		sessionId: 'TEST_SESSION_ID',
		extraPayload: { sourceType: 'stream', sessionId: 'TEST_SESSION_ID' },
	}) as TrackItem

const defaultState = {
	isQueuing: false,
	shuffled: false,
	repeatMode: 'off' as const,
	queueRef: 'Recently Played',
	queue: [] as TrackItem[],
	unShuffledQueue: [] as TrackItem[],
	currentIndex: undefined as number | undefined,
}

describe('Player Queue Store', () => {
	beforeEach(() => {
		usePlayerQueueStore.setState({
			...defaultState,
			// Preserve the action functions from the store
			...Object.fromEntries(
				Object.entries(usePlayerQueueStore.getState()).filter(
					([, v]) => typeof v === 'function',
				),
			),
		})
	})

	describe('initial defaults', () => {
		it('has correct default values', () => {
			const state = usePlayerQueueStore.getState()

			expect(state.isQueuing).toBe(false)
			expect(state.shuffled).toBe(false)
			expect(state.repeatMode).toBe('off')
			expect(state.queueRef).toBe('Recently Played')
			expect(state.queue).toEqual([])
			expect(state.unShuffledQueue).toEqual([])
			expect(state.currentIndex).toBeUndefined()
		})
	})

	describe('setNewQueue', () => {
		it('sets queue, queueRef, currentIndex, and shuffled atomically', () => {
			const tracks = [createTrack('a'), createTrack('b'), createTrack('c')]

			setNewQueue(tracks, 'My Playlist', 1, true)

			const state = usePlayerQueueStore.getState()
			expect(state.queue).toEqual(tracks)
			expect(state.queueRef).toBe('My Playlist')
			expect(state.currentIndex).toBe(1)
			expect(state.shuffled).toBe(true)
		})
	})

	describe('clearQueueStore', () => {
		it('resets all fields to defaults', () => {
			const tracks = [createTrack('a'), createTrack('b')]
			setNewQueue(tracks, 'Some Album', 0, true)

			// Also set unshuffled queue and repeat mode
			usePlayerQueueStore.getState().setUnshuffledQueue(tracks)
			usePlayerQueueStore.getState().setRepeatMode('all')

			clearQueueStore()

			const state = usePlayerQueueStore.getState()
			expect(state.shuffled).toBe(false)
			expect(state.queueRef).toBeUndefined()
			expect(state.unShuffledQueue).toEqual([])
			expect(state.queue).toEqual([])
			expect(state.currentIndex).toBeUndefined()
			expect(state.repeatMode).toBe('off')
		})
	})

	describe('setIsQueuing', () => {
		it('sets isQueuing to true', () => {
			setIsQueuing(true)
			expect(usePlayerQueueStore.getState().isQueuing).toBe(true)
		})

		it('sets isQueuing back to false', () => {
			setIsQueuing(true)
			setIsQueuing(false)
			expect(usePlayerQueueStore.getState().isQueuing).toBe(false)
		})
	})

	describe('useCurrentTrack selector', () => {
		it('returns the correct track by currentIndex', () => {
			const tracks = [createTrack('x'), createTrack('y'), createTrack('z')]
			setNewQueue(tracks, 'Test Queue', 2, false)

			const { result } = renderHook(() => useCurrentTrack())
			expect(result.current).toEqual(tracks[2])
		})

		it('returns undefined when currentIndex is undefined', () => {
			usePlayerQueueStore.setState({ currentIndex: undefined })

			const { result } = renderHook(() => useCurrentTrack())
			expect(result.current).toBeUndefined()
		})
	})

	describe('useCurrentTrackId selector', () => {
		it('returns only the track ID', () => {
			const tracks = [createTrack('first'), createTrack('second')]
			setNewQueue(tracks, 'Queue', 1, false)

			const { result } = renderHook(() => useCurrentTrackId())
			expect(result.current).toBe('second')
		})

		it('returns undefined when currentIndex is undefined', () => {
			usePlayerQueueStore.setState({ currentIndex: undefined })

			const { result } = renderHook(() => useCurrentTrackId())
			expect(result.current).toBeUndefined()
		})
	})

	describe('useCurrentIndex selector', () => {
		it('returns the current index', () => {
			setNewQueue([createTrack('a')], 'Q', 0, false)

			const { result } = renderHook(() => useCurrentIndex())
			expect(result.current).toBe(0)
		})
	})

	describe('useRepeatMode selector', () => {
		it('returns the current repeat mode', () => {
			usePlayerQueueStore.getState().setRepeatMode('all')

			const { result } = renderHook(() => useRepeatMode())
			expect(result.current).toBe('all')
		})
	})

	describe('usePlayQueue selector', () => {
		it('returns the current queue', () => {
			const tracks = [createTrack('m'), createTrack('n')]
			setNewQueue(tracks, 'Q', 0, false)

			const { result } = renderHook(() => usePlayQueue())
			expect(result.current).toEqual(tracks)
		})
	})

	describe('useShuffle selector', () => {
		it('returns the shuffled state', () => {
			setNewQueue([createTrack('a')], 'Q', 0, true)

			const { result } = renderHook(() => useShuffle())
			expect(result.current).toBe(true)
		})
	})

	describe('useQueueRef selector', () => {
		it('returns the queue reference', () => {
			setNewQueue([createTrack('a')], 'Favorites', 0, false)

			const { result } = renderHook(() => useQueueRef())
			expect(result.current).toBe('Favorites')
		})
	})

	describe('bounds and edge cases', () => {
		it('useCurrentTrack returns undefined when currentIndex exceeds queue length', () => {
			const tracks = [createTrack('t1'), createTrack('t2')]
			usePlayerQueueStore.setState({
				queue: tracks,
				currentIndex: 5,
			})

			const { result } = renderHook(() => useCurrentTrack())
			expect(result.current).toBeUndefined()
		})

		it('setNewQueue with empty queue and non-zero index', () => {
			setNewQueue([], 'Empty Ref', 5, false)

			const state = usePlayerQueueStore.getState()
			expect(state.queue).toEqual([])
			expect(state.currentIndex).toBe(5)
			expect(state.queueRef).toBe('Empty Ref')

			const { result } = renderHook(() => useCurrentTrack())
			expect(result.current).toBeUndefined()
		})
	})
})

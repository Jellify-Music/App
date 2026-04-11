import { renderHook, act } from '@testing-library/react-native'
import { AppState } from 'react-native'
import useAppActive from '../../../src/hooks/use-app-active'

describe('useAppActive', () => {
	let appStateCallback: ((state: string) => void) | null = null
	const removeMock = jest.fn()

	beforeEach(() => {
		jest.clearAllMocks()
		appStateCallback = null

		jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
			appStateCallback = listener as (state: string) => void
			return { remove: removeMock } as unknown as ReturnType<typeof AppState.addEventListener>
		})

		Object.defineProperty(AppState, 'currentState', {
			value: 'active',
			writable: true,
			configurable: true,
		})
	})

	it('returns true when app state is active', () => {
		const { result } = renderHook(() => useAppActive())
		expect(result.current).toBe(true)
	})

	it('returns false when app state changes to background', () => {
		const { result } = renderHook(() => useAppActive())

		act(() => {
			appStateCallback?.('background')
		})

		expect(result.current).toBe(false)
	})

	it('returns true again when app state changes back to active', () => {
		const { result } = renderHook(() => useAppActive())

		act(() => {
			appStateCallback?.('background')
		})
		expect(result.current).toBe(false)

		act(() => {
			appStateCallback?.('active')
		})
		expect(result.current).toBe(true)
	})

	it('cleans up listener on unmount', () => {
		const { unmount } = renderHook(() => useAppActive())

		unmount()

		expect(removeMock).toHaveBeenCalled()
	})
})

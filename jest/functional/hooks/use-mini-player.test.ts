import { renderHook } from '@testing-library/react-native'
import useIsMiniPlayerActive from '../../../src/hooks/use-mini-player'

jest.mock('../../../src/hooks/use-app-active', () => ({
	__esModule: true,
	default: jest.fn(() => true),
}))

jest.mock('../../../src/stores/player/queue', () => ({
	useCurrentTrack: jest.fn(() => undefined),
}))

import useAppActive from '../../../src/hooks/use-app-active'
import { useCurrentTrack } from '../../../src/stores/player/queue'

describe('useIsMiniPlayerActive', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		;(useAppActive as jest.Mock).mockReturnValue(true)
		;(useCurrentTrack as jest.Mock).mockReturnValue(undefined)
	})

	it('returns false when no current track', () => {
		;(useCurrentTrack as jest.Mock).mockReturnValue(undefined)

		const { result } = renderHook(() => useIsMiniPlayerActive())
		expect(result.current).toBe(false)
	})

	it('returns false when app is not active even with a track', () => {
		;(useAppActive as jest.Mock).mockReturnValue(false)
		;(useCurrentTrack as jest.Mock).mockReturnValue({ id: 'track-1', title: 'Song' })

		const { result } = renderHook(() => useIsMiniPlayerActive())
		expect(result.current).toBe(false)
	})

	it('returns true when track exists and app is active', () => {
		;(useAppActive as jest.Mock).mockReturnValue(true)
		;(useCurrentTrack as jest.Mock).mockReturnValue({ id: 'track-1', title: 'Song' })

		const { result } = renderHook(() => useIsMiniPlayerActive())
		expect(result.current).toBe(true)
	})
})

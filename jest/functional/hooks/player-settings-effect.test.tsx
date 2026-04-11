import 'react-native'
import { renderHook, act } from '@testing-library/react-native'

jest.mock('../../../src/constants/storage', () => {
	const map = new Map()
	return {
		storage: {
			getString: jest.fn(),
			set: jest.fn(),
			remove: jest.fn(),
			getNumber: jest.fn(() => undefined),
			clearAll: jest.fn(),
		},
		mmkvStateStorage: {
			getItem: jest.fn(() => null),
			setItem: jest.fn(),
			removeItem: jest.fn(),
		},
	}
})

const mockSetDeviceProfile = jest.fn()
jest.mock('../../../src/stores/device-profile', () => ({
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	useStreamingDeviceProfileStore: jest.fn((selector: any) => {
		if (typeof selector === 'function') return mockSetDeviceProfile
		return { setDeviceProfile: mockSetDeviceProfile }
	}),
}))

const mockGetDeviceProfile = jest.fn((quality: string, type: string) => ({
	Name: `${type}-${quality}`,
}))
jest.mock('../../../src/utils/audio/device-profiles', () => ({
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	getDeviceProfile: (...args: any[]) => mockGetDeviceProfile(...args),
}))

import { useStreamingQuality, usePlayerSettingsStore } from '../../../src/stores/settings/player'
import StreamingQuality from '../../../src/enums/audio-quality'

describe('useStreamingQuality', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		usePlayerSettingsStore.setState({
			streamingQuality: StreamingQuality.Original,
		})
	})

	it('calls setStreamingDeviceProfile on initial render with the current quality', () => {
		renderHook(() => useStreamingQuality())

		expect(mockGetDeviceProfile).toHaveBeenCalledWith(StreamingQuality.Original, 'stream')
		expect(mockSetDeviceProfile).toHaveBeenCalledWith({
			Name: 'stream-original',
		})
	})

	it('updates device profile when streaming quality changes', () => {
		const { result } = renderHook(() => useStreamingQuality())

		mockGetDeviceProfile.mockClear()
		mockSetDeviceProfile.mockClear()

		act(() => {
			const setQuality = result.current[1]
			setQuality(StreamingQuality.High)
		})

		expect(mockGetDeviceProfile).toHaveBeenCalledWith(StreamingQuality.High, 'stream')
		expect(mockSetDeviceProfile).toHaveBeenCalledWith({
			Name: 'stream-high',
		})
	})
})

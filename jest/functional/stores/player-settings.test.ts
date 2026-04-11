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

jest.mock('../../../src/stores/device-profile', () => ({
	useStreamingDeviceProfileStore: jest.fn(() => ({
		setDeviceProfile: jest.fn(),
	})),
}))

jest.mock('../../../src/utils/audio/device-profiles', () => ({
	getDeviceProfile: jest.fn(() => ({ Name: 'test-profile' })),
}))

import { usePlayerSettingsStore } from '../../../src/stores/settings/player'
import StreamingQuality from '../../../src/enums/audio-quality'

const initialState = usePlayerSettingsStore.getState()

beforeEach(() => {
	usePlayerSettingsStore.setState(initialState, true)
})

describe('player settings store', () => {
	describe('defaults', () => {
		it('has original as default streamingQuality', () => {
			expect(usePlayerSettingsStore.getState().streamingQuality).toBe(
				StreamingQuality.Original,
			)
		})

		it('has audio normalization disabled by default', () => {
			expect(usePlayerSettingsStore.getState().enableAudioNormalization).toBe(false)
		})

		it('has audio quality badge disabled by default', () => {
			expect(usePlayerSettingsStore.getState().displayAudioQualityBadge).toBe(false)
		})
	})

	describe('setStreamingQuality', () => {
		it('updates the streaming quality', () => {
			usePlayerSettingsStore.getState().setStreamingQuality(StreamingQuality.High)
			expect(usePlayerSettingsStore.getState().streamingQuality).toBe(StreamingQuality.High)
		})
	})

	describe('setEnableAudioNormalization', () => {
		it('updates the audio normalization setting', () => {
			usePlayerSettingsStore.getState().setEnableAudioNormalization(true)
			expect(usePlayerSettingsStore.getState().enableAudioNormalization).toBe(true)
		})
	})
})

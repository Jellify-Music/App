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

import { useUsageSettingsStore } from '../../../src/stores/settings/usage'
import StreamingQuality from '../../../src/enums/audio-quality'

const initialState = useUsageSettingsStore.getState()

beforeEach(() => {
	useUsageSettingsStore.setState(initialState, true)
})

describe('usage settings store', () => {
	describe('defaults', () => {
		it('has original as default downloadQuality', () => {
			expect(useUsageSettingsStore.getState().downloadQuality).toBe(StreamingQuality.Original)
		})

		it('has autoDownload disabled by default', () => {
			expect(useUsageSettingsStore.getState().autoDownload).toBe(false)
		})
	})

	describe('setDownloadQuality', () => {
		it('updates the download quality', () => {
			useUsageSettingsStore.getState().setDownloadQuality(StreamingQuality.High)
			expect(useUsageSettingsStore.getState().downloadQuality).toBe(StreamingQuality.High)
		})
	})

	describe('setAutoDownload', () => {
		it('updates the auto download setting', () => {
			useUsageSettingsStore.getState().setAutoDownload(true)
			expect(useUsageSettingsStore.getState().autoDownload).toBe(true)
		})
	})
})

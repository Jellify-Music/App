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

jest.mock('../../../src/utils/audio/device-profiles', () => ({
	getDeviceProfile: jest.fn((quality: string, type: string) => ({
		Name: `${type}-${quality}-profile`,
	})),
}))

import {
	useStreamingDeviceProfileStore,
	useDownloadingDeviceProfileStore,
} from '../../../src/stores/device-profile'

const initialStreamingState = useStreamingDeviceProfileStore.getState()
const initialDownloadingState = useDownloadingDeviceProfileStore.getState()

beforeEach(() => {
	useStreamingDeviceProfileStore.setState(initialStreamingState, true)
	useDownloadingDeviceProfileStore.setState(initialDownloadingState, true)
})

describe('device profile stores', () => {
	describe('streaming store', () => {
		it('initializes with getDeviceProfile for streaming', () => {
			const state = useStreamingDeviceProfileStore.getState()
			expect(state.deviceProfile).toEqual({ Name: 'stream-original-profile' })
		})

		it('updates the profile via setDeviceProfile', () => {
			const newProfile = { Name: 'custom-stream-profile' }
			useStreamingDeviceProfileStore.getState().setDeviceProfile(newProfile)
			expect(useStreamingDeviceProfileStore.getState().deviceProfile).toEqual(newProfile)
		})
	})

	describe('downloading store', () => {
		it('initializes with getDeviceProfile for downloading', () => {
			const state = useDownloadingDeviceProfileStore.getState()
			expect(state.deviceProfile).toEqual({ Name: 'download-original-profile' })
		})

		it('updates the profile via setDeviceProfile', () => {
			const newProfile = { Name: 'custom-download-profile' }
			useDownloadingDeviceProfileStore.getState().setDeviceProfile(newProfile)
			expect(useDownloadingDeviceProfileStore.getState().deviceProfile).toEqual(newProfile)
		})
	})

	describe('independence', () => {
		it('setting streaming profile does not affect downloading profile', () => {
			const streamProfile = { Name: 'updated-stream' }
			useStreamingDeviceProfileStore.getState().setDeviceProfile(streamProfile)

			expect(useStreamingDeviceProfileStore.getState().deviceProfile).toEqual(streamProfile)
			expect(useDownloadingDeviceProfileStore.getState().deviceProfile).toEqual({
				Name: 'download-original-profile',
			})
		})
	})
})

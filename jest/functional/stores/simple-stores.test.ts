/**
 * Consolidated tests for simple setter-only stores.
 * Each of these stores has a trivial shape (1-3 fields + setters) and
 * no business logic beyond Zustand's set(). Rather than one file per
 * store, we group them here to avoid boilerplate duplication.
 */
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

jest.mock('../../../src/components/Network/internetConnectionWatcher', () => ({
	networkStatusTypes: {
		ONLINE: 'ONLINE',
		DISCONNECTED: 'DISCONNECTED',
	},
}))

import { useAutoStore } from '../../../src/stores/auto/index'
import usePlayerDisplayStore from '../../../src/stores/player/display'
import { useDeveloperSettingsStore } from '../../../src/stores/settings/developer'
import { useUsageSettingsStore } from '../../../src/stores/settings/usage'
import { usePlayerPlaybackStore, setPlaybackPosition } from '../../../src/stores/player/playback'
import { usePlayerSettingsStore } from '../../../src/stores/settings/player'
import usePlayerEngineStore, { PlayerEngine } from '../../../src/stores/player/engine'
import { networkStatusTypes } from '../../../src/components/Network/internetConnectionWatcher'
import { useNetworkStore } from '../../../src/stores/network/index'
import StreamingQuality from '../../../src/enums/audio-quality'

// ── Auto Store ─────────────────────────────────────────────────────
describe('auto store', () => {
	const initialState = useAutoStore.getState()
	beforeEach(() => useAutoStore.setState(initialState, true))

	it('toggles isConnected', () => {
		useAutoStore.getState().setIsConnected(true)
		expect(useAutoStore.getState().isConnected).toBe(true)

		useAutoStore.getState().setIsConnected(false)
		expect(useAutoStore.getState().isConnected).toBe(false)
	})
})

// ── Display Store ──────────────────────────────────────────────────
describe('player display store', () => {
	const initialState = usePlayerDisplayStore.getState()
	beforeEach(() => usePlayerDisplayStore.setState(initialState, true))

	it('toggles isPlayerFocused', () => {
		usePlayerDisplayStore.getState().setIsPlayerFocused(true)
		expect(usePlayerDisplayStore.getState().isPlayerFocused).toBe(true)

		usePlayerDisplayStore.getState().setIsPlayerFocused(false)
		expect(usePlayerDisplayStore.getState().isPlayerFocused).toBe(false)
	})
})

// ── Developer Settings ─────────────────────────────────────────────
describe('developer settings store', () => {
	const initialState = useDeveloperSettingsStore.getState()
	beforeEach(() => useDeveloperSettingsStore.setState(initialState, true))

	it('updates developerOptionsEnabled', () => {
		useDeveloperSettingsStore.getState().setDeveloperOptionsEnabled(true)
		expect(useDeveloperSettingsStore.getState().developerOptionsEnabled).toBe(true)
	})

	it('updates prId', () => {
		useDeveloperSettingsStore.getState().setPrId('123')
		expect(useDeveloperSettingsStore.getState().prId).toBe('123')
	})
})

// ── Usage Settings ─────────────────────────────────────────────────
describe('usage settings store', () => {
	const initialState = useUsageSettingsStore.getState()
	beforeEach(() => useUsageSettingsStore.setState(initialState, true))

	it('updates download quality', () => {
		useUsageSettingsStore.getState().setDownloadQuality(StreamingQuality.High)
		expect(useUsageSettingsStore.getState().downloadQuality).toBe(StreamingQuality.High)
	})

	it('updates auto download setting', () => {
		useUsageSettingsStore.getState().setAutoDownload(true)
		expect(useUsageSettingsStore.getState().autoDownload).toBe(true)
	})
})

// ── Playback Store ─────────────────────────────────────────────────
describe('player playback store', () => {
	const initialState = usePlayerPlaybackStore.getState()
	beforeEach(() => usePlayerPlaybackStore.setState(initialState, true))

	it('updates position via setter and external function', () => {
		usePlayerPlaybackStore.getState().setPosition(42.5)
		expect(usePlayerPlaybackStore.getState().position).toBe(42.5)

		setPlaybackPosition(99.9)
		expect(usePlayerPlaybackStore.getState().position).toBe(99.9)
	})
})

// ── Player Settings ────────────────────────────────────────────────
describe('player settings store', () => {
	const initialState = usePlayerSettingsStore.getState()
	beforeEach(() => usePlayerSettingsStore.setState(initialState, true))

	it('updates streaming quality', () => {
		usePlayerSettingsStore.getState().setStreamingQuality(StreamingQuality.High)
		expect(usePlayerSettingsStore.getState().streamingQuality).toBe(StreamingQuality.High)
	})

	it('updates audio normalization setting', () => {
		usePlayerSettingsStore.getState().setEnableAudioNormalization(true)
		expect(usePlayerSettingsStore.getState().enableAudioNormalization).toBe(true)
	})
})

// ── Engine Store ───────────────────────────────────────────────────
describe('player engine store', () => {
	const initialState = usePlayerEngineStore.getState()
	beforeEach(() => usePlayerEngineStore.setState(initialState, true))

	it('updates playerEngineData to different engines', () => {
		usePlayerEngineStore.getState().setPlayerEngineData(PlayerEngine.GOOGLE_CAST)
		expect(usePlayerEngineStore.getState().playerEngineData).toBe(PlayerEngine.GOOGLE_CAST)

		usePlayerEngineStore.getState().setPlayerEngineData(PlayerEngine.CARPLAY)
		expect(usePlayerEngineStore.getState().playerEngineData).toBe(PlayerEngine.CARPLAY)
	})
})

// ── Network Store ──────────────────────────────────────────────────
describe('network store', () => {
	const initialState = useNetworkStore.getState()
	beforeEach(() => useNetworkStore.setState(initialState, true))

	it('updates networkStatus through different states', () => {
		useNetworkStore.getState().setNetworkStatus(networkStatusTypes.ONLINE)
		expect(useNetworkStore.getState().networkStatus).toBe(networkStatusTypes.ONLINE)

		useNetworkStore.getState().setNetworkStatus(networkStatusTypes.DISCONNECTED)
		expect(useNetworkStore.getState().networkStatus).toBe(networkStatusTypes.DISCONNECTED)

		useNetworkStore.getState().setNetworkStatus(null)
		expect(useNetworkStore.getState().networkStatus).toBeNull()
	})
})

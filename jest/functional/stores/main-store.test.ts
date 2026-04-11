import 'react-native'
import { renderHook, act } from '@testing-library/react-native'

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

jest.mock('../../../src/api/info', () => ({
	JellyfinInfo: {
		createApi: jest.fn((url: string, token?: string) => ({
			basePath: url,
			accessToken: token,
		})),
	},
}))

jest.mock('../../../src/configs/axios.config', () => ({}))

jest.mock('../../../src/constants/query-client', () => ({
	queryClient: { clear: jest.fn() },
}))

import useJellifyStore, { getApi, getUser, getLibrary, useSignOut } from '../../../src/stores/index'
import { JellifyServer } from '../../../src/types/JellifyServer'
import { JellifyUser } from '../../../src/types/JellifyUser'
import { JellifyLibrary } from '../../../src/types/JellifyLibrary'
import { storage } from '../../../src/constants/storage'
import { queryClient } from '../../../src/constants/query-client'
import { MMKVStorageKeys } from '../../../src/enums/mmkv-storage-keys'

const mockServer: JellifyServer = {
	url: 'https://jellyfin.example.com',
	address: '192.168.1.100',
	name: 'Test Server',
	version: '10.9.0',
	startUpComplete: true,
}

const mockUser: JellifyUser = {
	id: 'user-123',
	name: 'testuser',
	accessToken: 'test-access-token',
}

const mockLibrary: JellifyLibrary = {
	musicLibraryId: 'lib-456',
	musicLibraryName: 'Music',
}

describe('Main Jellify Store', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		useJellifyStore.setState({
			server: undefined,
			user: undefined,
			library: undefined,
			migratedToNitroPlayer: false,
			// Preserve store action functions
			...Object.fromEntries(
				Object.entries(useJellifyStore.getState()).filter(
					([, v]) => typeof v === 'function',
				),
			),
		})
	})

	describe('initial defaults', () => {
		it('has server, user, and library as undefined', () => {
			const state = useJellifyStore.getState()

			expect(state.server).toBeUndefined()
			expect(state.user).toBeUndefined()
			expect(state.library).toBeUndefined()
		})

		it('has migratedToNitroPlayer as false', () => {
			expect(useJellifyStore.getState().migratedToNitroPlayer).toBe(false)
		})
	})

	describe('getApi', () => {
		it('returns undefined when no server is set', () => {
			expect(getApi()).toBeUndefined()
		})

		it('returns an Api object when server URL is set', () => {
			useJellifyStore.setState({ server: mockServer })

			const api = getApi()
			expect(api).toBeDefined()
			expect(api).toEqual(expect.objectContaining({ basePath: mockServer.url }))
		})

		it('passes accessToken when user is set', () => {
			useJellifyStore.setState({ server: mockServer, user: mockUser })

			const api = getApi()
			expect(api).toEqual(
				expect.objectContaining({
					basePath: mockServer.url,
					accessToken: mockUser.accessToken,
				}),
			)
		})
	})

	describe('getUser', () => {
		it('returns the current user', () => {
			useJellifyStore.setState({ user: mockUser })

			expect(getUser()).toEqual(mockUser)
		})

		it('returns undefined when no user is set', () => {
			expect(getUser()).toBeUndefined()
		})
	})

	describe('getLibrary', () => {
		it('returns the current library', () => {
			useJellifyStore.setState({ library: mockLibrary })

			expect(getLibrary()).toEqual(mockLibrary)
		})

		it('returns undefined when no library is set', () => {
			expect(getLibrary()).toBeUndefined()
		})
	})

	describe('useSignOut', () => {
		it('clears server, user, library, queryClient, and storage', () => {
			useJellifyStore.setState({
				server: mockServer,
				user: mockUser,
				library: mockLibrary,
			})

			const { result } = renderHook(() => useSignOut())

			act(() => {
				result.current()
			})

			const state = useJellifyStore.getState()
			expect(state.server).toBeUndefined()
			expect(state.user).toBeUndefined()
			expect(state.library).toBeUndefined()

			expect(queryClient.clear).toHaveBeenCalledTimes(1)
			expect(storage.clearAll).toHaveBeenCalledTimes(1)
		})
	})

	describe('storage / hydration integration', () => {
		it('storage.getString returns persisted server data after set', () => {
			storage.set(MMKVStorageKeys.Server, JSON.stringify(mockServer))

			const raw = storage.getString(MMKVStorageKeys.Server)
			expect(raw).toBeDefined()

			const parsed = JSON.parse(raw!) as JellifyServer
			expect(parsed.url).toBe(mockServer.url)
			expect(parsed.name).toBe(mockServer.name)
		})

		it('storage returns undefined for keys that were never set', () => {
			expect(storage.getString('NON_EXISTENT_KEY')).toBeUndefined()
		})

		it('signOut wipes storage so hydration keys return undefined', () => {
			storage.set(MMKVStorageKeys.Server, JSON.stringify(mockServer))
			storage.set(MMKVStorageKeys.User, JSON.stringify(mockUser))
			storage.set(MMKVStorageKeys.Library, JSON.stringify(mockLibrary))

			useJellifyStore.setState({
				server: mockServer,
				user: mockUser,
				library: mockLibrary,
			})

			const { result } = renderHook(() => useSignOut())

			act(() => {
				result.current()
			})

			expect(storage.getString(MMKVStorageKeys.Server)).toBeUndefined()
			expect(storage.getString(MMKVStorageKeys.User)).toBeUndefined()
			expect(storage.getString(MMKVStorageKeys.Library)).toBeUndefined()
		})
	})
})

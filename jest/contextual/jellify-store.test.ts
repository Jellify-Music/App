import { renderHook, act } from '@testing-library/react-native'
import useJellifyStore, { getApi, getUser } from '../../src/stores/index'
import { JellifyServer } from '../../src/types/JellifyServer'
import { JellifyUser } from '../../src/types/JellifyUser'
import { JellifyLibrary } from '../../src/types/JellifyLibrary'

// Mock the storage and configs
jest.mock('../../src/constants/storage', () => ({
	storage: {
		getString: jest.fn().mockReturnValue(undefined),
		set: jest.fn(),
		clearAll: jest.fn(),
	},
	mmkvStateStorage: {
		getItem: jest.fn().mockReturnValue(null),
		setItem: jest.fn(),
		removeItem: jest.fn(),
	},
}))

jest.mock('../../src/constants/query-client', () => ({
	queryClient: {
		clear: jest.fn(),
	},
}))

// Helper factory functions for properly-typed mock objects
const createMockServer = (overrides?: Partial<JellifyServer>): JellifyServer => ({
	url: 'https://jellyfin.example.com',
	address: 'jellyfin.example.com',
	name: 'Test Server',
	version: '10.8.0',
	startUpComplete: true,
	...overrides,
})

const createMockUser = (overrides?: Partial<JellifyUser>): JellifyUser => ({
	id: 'user-123',
	name: 'Test User',
	accessToken: 'token-abc',
	...overrides,
})

const createMockLibrary = (overrides?: Partial<JellifyLibrary>): JellifyLibrary => ({
	musicLibraryId: 'lib-123',
	musicLibraryName: 'Music',
	...overrides,
})

describe('useJellifyStore', () => {
	beforeEach(() => {
		// Reset store state before each test
		useJellifyStore.setState({
			server: undefined,
			user: undefined,
			library: undefined,
		})
	})

	it('should initialize with undefined values', () => {
		const state = useJellifyStore.getState()
		expect(state.server).toBeUndefined()
		expect(state.user).toBeUndefined()
		expect(state.library).toBeUndefined()
	})

	it('should update server state via setServer', () => {
		const mockServer = createMockServer()

		act(() => {
			useJellifyStore.getState().setServer(mockServer)
		})

		expect(useJellifyStore.getState().server).toEqual(mockServer)
	})

	it('should update user state via setUser', () => {
		const mockUser = createMockUser()

		act(() => {
			useJellifyStore.getState().setUser(mockUser)
		})

		expect(useJellifyStore.getState().user).toEqual(mockUser)
	})

	it('should update library state via setLibrary', () => {
		const mockLibrary = createMockLibrary()

		act(() => {
			useJellifyStore.getState().setLibrary(mockLibrary)
		})

		expect(useJellifyStore.getState().library).toEqual(mockLibrary)
	})

	it('should clear server state when set to undefined', () => {
		const mockServer = createMockServer()

		act(() => {
			useJellifyStore.getState().setServer(mockServer)
		})

		expect(useJellifyStore.getState().server).toEqual(mockServer)

		act(() => {
			useJellifyStore.getState().setServer(undefined)
		})

		expect(useJellifyStore.getState().server).toBeUndefined()
	})
})

describe('getApi', () => {
	beforeEach(() => {
		useJellifyStore.setState({
			server: undefined,
			user: undefined,
			library: undefined,
		})
	})

	it('should return undefined when no server URL is set', () => {
		const api = getApi()
		expect(api).toBeUndefined()
	})
})

describe('getUser', () => {
	beforeEach(() => {
		useJellifyStore.setState({
			server: undefined,
			user: undefined,
			library: undefined,
		})
	})

	it('should return undefined when no user is set', () => {
		const user = getUser()
		expect(user).toBeUndefined()
	})

	it('should return user when set', () => {
		const mockUser = createMockUser()

		act(() => {
			useJellifyStore.getState().setUser(mockUser)
		})

		const user = getUser()
		expect(user).toEqual(mockUser)
	})
})

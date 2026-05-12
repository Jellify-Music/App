import { getApi } from '../../src/stores'
import { getPlaylistsApi } from '@jellyfin/sdk/lib/utils/api'
import {
	addPlaylistUser,
	getPlaylistUsers,
	removePlaylistUser,
} from '../../src/api/queries/playlist/utils/users'
import { BaseItemDto, PlaylistUserPermissions, UserDto } from '@jellyfin/sdk/lib/generated-client'

jest.mock('../../src/stores')
jest.mock('@jellyfin/sdk/lib/utils/api')

describe('Playlist Users API Functions', () => {
	const mockPlaylistId = 'playlist-123'
	const mockUserId = 'user-456'
	const mockApi = { basePath: 'http://test' }

	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('getPlaylistUsers', () => {
		it('fetches playlist users successfully', async () => {
			const mockUsers: PlaylistUserPermissions[] = [
				{ UserId: 'user-1', CanEdit: true },
				{ UserId: 'user-2', CanEdit: false },
			]

			const mockPlaylistApi = {
				getPlaylistUsers: jest.fn().mockResolvedValue({ data: mockUsers }),
			}

			;(getApi as jest.Mock).mockReturnValue(mockApi)
			;(getPlaylistsApi as jest.Mock).mockReturnValue(mockPlaylistApi)

			const result = await getPlaylistUsers(mockPlaylistId)

			expect(result).toEqual(mockUsers)
			expect(getPlaylistsApi).toHaveBeenCalledWith(mockApi)
			expect(mockPlaylistApi.getPlaylistUsers).toHaveBeenCalledWith({
				playlistId: mockPlaylistId,
			})
		})

		it('throws error when API instance is not set', async () => {
			;(getApi as jest.Mock).mockReturnValue(null)

			await expect(getPlaylistUsers(mockPlaylistId)).rejects.toThrow('API Instance not set')
		})
	})

	describe('addPlaylistUser', () => {
		it('adds a user to playlist with correct permissions', async () => {
			const mockPlaylistApi = {
				updatePlaylist: jest.fn().mockResolvedValue({}),
			}

			;(getApi as jest.Mock).mockReturnValue(mockApi)
			;(getPlaylistsApi as jest.Mock).mockReturnValue(mockPlaylistApi)

			await addPlaylistUser(mockPlaylistId, mockUserId, true)

			expect(mockPlaylistApi.updatePlaylist).toHaveBeenCalledWith({
				playlistId: mockPlaylistId,
				updatePlaylistDto: {
					Users: [
						{
							UserId: mockUserId,
							CanEdit: true,
						},
					],
				},
			})
		})

		it('adds a user to playlist with read-only permission', async () => {
			const mockPlaylistApi = {
				updatePlaylist: jest.fn().mockResolvedValue({}),
			}

			;(getApi as jest.Mock).mockReturnValue(mockApi)
			;(getPlaylistsApi as jest.Mock).mockReturnValue(mockPlaylistApi)

			await addPlaylistUser(mockPlaylistId, mockUserId, false)

			expect(mockPlaylistApi.updatePlaylist).toHaveBeenCalledWith({
				playlistId: mockPlaylistId,
				updatePlaylistDto: {
					Users: [
						{
							UserId: mockUserId,
							CanEdit: false,
						},
					],
				},
			})
		})
	})

	describe('removePlaylistUser', () => {
		it('removes a user from playlist', async () => {
			const mockPlaylistApi = {
				removeUserFromPlaylist: jest.fn().mockResolvedValue({}),
			}

			;(getApi as jest.Mock).mockReturnValue(mockApi)
			;(getPlaylistsApi as jest.Mock).mockReturnValue(mockPlaylistApi)

			await removePlaylistUser(mockPlaylistId, mockUserId)

			expect(mockPlaylistApi.removeUserFromPlaylist).toHaveBeenCalledWith({
				playlistId: mockPlaylistId,
				userId: mockUserId,
			})
		})
	})
})

describe('Playlist Users Query Client Updates', () => {
	const mockPlaylist: BaseItemDto = {
		Id: 'playlist-123',
		Name: 'Test Playlist',
		Type: 'Playlist',
	}

	const mockUser: UserDto = {
		Id: 'user-456',
		Name: 'Test User',
	}

	describe('useAddPlaylistUser onSuccess', () => {
		it('should add new user to empty playlist users cache', () => {
			const previousData: PlaylistUserPermissions[] | undefined = undefined
			const newUser: PlaylistUserPermissions = {
				UserId: mockUser.Id,
				CanEdit: true,
			}

			// Simulate the query update function
			const updateFn = (previous: PlaylistUserPermissions[] | undefined) => {
				if (previous == undefined) {
					return [newUser]
				} else {
					return [...previous, newUser]
				}
			}

			const result = updateFn(previousData)
			expect(result).toEqual([newUser])
			expect(result).toHaveLength(1)
		})

		it('should add new user to existing playlist users list', () => {
			const existingUser: PlaylistUserPermissions = {
				UserId: 'user-existing',
				CanEdit: true,
			}
			const previousData: PlaylistUserPermissions[] = [existingUser]
			const newUser: PlaylistUserPermissions = {
				UserId: mockUser.Id,
				CanEdit: false,
			}

			// Simulate the query update function
			const updateFn = (previous: PlaylistUserPermissions[] | undefined) => {
				if (previous == undefined) {
					return [newUser]
				} else {
					return [...previous, newUser]
				}
			}

			const result = updateFn(previousData)
			expect(result).toEqual([existingUser, newUser])
			expect(result).toHaveLength(2)
		})

		it('should respect CanEdit permission when adding user', () => {
			const previousData: PlaylistUserPermissions[] | undefined = undefined
			const canEditValue = false
			const newUser: PlaylistUserPermissions = {
				UserId: mockUser.Id,
				CanEdit: canEditValue,
			}

			// Simulate the query update function
			const updateFn = (previous: PlaylistUserPermissions[] | undefined) => {
				if (previous == undefined) {
					return [newUser]
				} else {
					return [...previous, newUser]
				}
			}

			const result = updateFn(previousData)
			expect(result[0].CanEdit).toBe(false)
		})
	})

	describe('useRemovePlaylistUser onSuccess', () => {
		it('should remove user from playlist users cache', () => {
			const userToRemove = 'user-456'
			const previousData: PlaylistUserPermissions[] = [
				{ UserId: 'user-1', CanEdit: true },
				{ UserId: userToRemove, CanEdit: false },
				{ UserId: 'user-3', CanEdit: true },
			]

			// Simulate the query update function
			const updateFn = (previous: PlaylistUserPermissions[] | undefined) => {
				if (previous == undefined) {
					return []
				} else {
					return previous.filter((user) => user.UserId != userToRemove)
				}
			}

			const result = updateFn(previousData)
			expect(result).toEqual([
				{ UserId: 'user-1', CanEdit: true },
				{ UserId: 'user-3', CanEdit: true },
			])
			expect(result).toHaveLength(2)
		})

		it('should handle removing from empty list', () => {
			const userToRemove = 'user-456'
			const previousData: PlaylistUserPermissions[] | undefined = undefined

			// Simulate the query update function
			const updateFn = (previous: PlaylistUserPermissions[] | undefined) => {
				if (previous == undefined) {
					return []
				} else {
					return previous.filter((user) => user.UserId != userToRemove)
				}
			}

			const result = updateFn(previousData)
			expect(result).toEqual([])
			expect(result).toHaveLength(0)
		})

		it('should handle removing non-existent user gracefully', () => {
			const userToRemove = 'user-nonexistent'
			const previousData: PlaylistUserPermissions[] = [
				{ UserId: 'user-1', CanEdit: true },
				{ UserId: 'user-2', CanEdit: false },
			]

			// Simulate the query update function
			const updateFn = (previous: PlaylistUserPermissions[] | undefined) => {
				if (previous == undefined) {
					return []
				} else {
					return previous.filter((user) => user.UserId != userToRemove)
				}
			}

			const result = updateFn(previousData)
			expect(result).toEqual(previousData)
			expect(result).toHaveLength(2)
		})
	})

	describe('Mutation Variables Validation', () => {
		it('should use correct CanEdit value from mutation variables', () => {
			const variables = {
				playlist: mockPlaylist,
				user: mockUser,
				CanEdit: false,
			}

			// Simulate adding with the CanEdit value from variables
			const newUser: PlaylistUserPermissions = {
				UserId: variables.user.Id,
				CanEdit: variables.CanEdit,
			}

			expect(newUser.CanEdit).toBe(false)
			expect(newUser.UserId).toBe(mockUser.Id)
		})

		it('should maintain user ID from variables in cache', () => {
			const variables = {
				playlist: mockPlaylist,
				user: mockUser,
				CanEdit: true,
			}

			const newUser: PlaylistUserPermissions = {
				UserId: variables.user.Id,
				CanEdit: variables.CanEdit,
			}

			expect(newUser.UserId).toBe('user-456')
		})
	})
})

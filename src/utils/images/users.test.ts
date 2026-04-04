/* eslint-disable @typescript-eslint/no-explicit-any */

import getUserImageUrl from './users'
import { getApi } from '../../stores'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import { UserDto } from '@jellyfin/sdk/lib/generated-client'
import { Api } from '@jellyfin/sdk'

jest.mock('../../stores')
jest.mock('@jellyfin/sdk/lib/utils/api')

const mockGetApi = getApi as jest.MockedFunction<typeof getApi>
const mockGetImageApi = getImageApi as jest.MockedFunction<typeof getImageApi>

describe('getUserImageUrl', () => {
	let mockUser: UserDto

	beforeEach(() => {
		mockUser = { Id: 'test-user-id' } as UserDto
		jest.clearAllMocks()
	})

	it('should return an empty string when getApi returns null', () => {
		mockGetApi.mockReturnValue(null as any)

		const result = getUserImageUrl(mockUser)

		expect(result).toBe('')
		expect(mockGetApi).toHaveBeenCalled()
		expect(mockGetImageApi).not.toHaveBeenCalled()
	})

	it('should return the image URL when getApi returns a valid api and getUserImageUrl returns a URL', () => {
		const mockApi = {} as Api
		const mockImageApi = {
			getUserImageUrl: jest.fn().mockReturnValue('http://example.com/user-image.jpg'),
		} as any
		mockGetApi.mockReturnValue(mockApi)
		mockGetImageApi.mockReturnValue(mockImageApi)

		const result = getUserImageUrl(mockUser)

		expect(result).toBe('http://example.com/user-image.jpg')
		expect(mockGetApi).toHaveBeenCalled()
		expect(mockGetImageApi).toHaveBeenCalledWith(mockApi)
		expect(mockImageApi.getUserImageUrl).toHaveBeenCalledWith({ Id: mockUser.Id })
	})

	it('should return an empty string when getUserImageUrl returns null', () => {
		const mockApi = {} as Api
		const mockImageApi = {
			getUserImageUrl: jest.fn().mockReturnValue(null),
		} as any
		mockGetApi.mockReturnValue(mockApi)
		mockGetImageApi.mockReturnValue(mockImageApi)

		const result = getUserImageUrl(mockUser)

		expect(result).toBe('')
		expect(mockGetApi).toHaveBeenCalled()
		expect(mockGetImageApi).toHaveBeenCalledWith(mockApi)
		expect(mockImageApi.getUserImageUrl).toHaveBeenCalledWith({ Id: mockUser.Id })
	})
})

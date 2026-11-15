import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import { getApi, getUser } from '../../../../stores/auth/utils'
import { UserDto } from '@jellyfin/sdk/lib/generated-client'

/**
 * Retrieves the avatar URL for the current user.
 * This function uses the current authenticated user's information to construct the avatar URL.
 * If the current user is not authenticated or the API is not available, it returns undefined.
 *
 * @returns The URL of the current user's avatar image, or undefined if it cannot be determined.
 */
export default function getUserImageUrl(): string | undefined {
	const api = getApi()
	if (!api) return undefined

	const user = getUser()
	if (!user) return undefined

	return getImageApi(api).getUserImageUrl(
		{
			Id: user.id,
			Name: user.name,
		},
		{
			maxWidth: 200,
			maxHeight: 200,
			quality: 90,
		},
	)
}

/**
 * Retrieves the avatar URL for a given user.
 *
 * @param user The user object who's avatar URL should be retrieved.
 *
 * @returns The URL of the user's avatar image, or undefined if it cannot be determined.
 */
export function getUserAvatarUrl(user?: UserDto): string | undefined {
	if (!user) return undefined

	const api = getApi()
	if (!api) return undefined

	return getImageApi(api).getUserImageUrl(
		{
			Id: user.Id,
			Name: user.Name,
		},
		{
			maxWidth: 200,
			maxHeight: 200,
			quality: 90,
		},
	)
}

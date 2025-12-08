import { JellyfinCredentials } from '../../types/jellyfin-credentials'
import { AuthenticationResult } from '@jellyfin/sdk/lib/generated-client'
import { useMutation } from '@tanstack/react-query'
import { JellifyUser } from '../../../types/JellifyUser'
import { useApi, useJellifyUser } from '../../../stores'
import authenticateUserByName from './utils'

interface AuthenticateUserByNameMutation {
	onSuccess?: () => void
	onError?: (error: Error) => void
}

const useAuthenticateUserByName = ({ onSuccess, onError }: AuthenticateUserByNameMutation) => {
	const api = useApi()
	const [, setUser] = useJellifyUser()

	return useMutation({
		mutationFn: (credentials: JellyfinCredentials) => {
			return authenticateUserByName(api, credentials.username, credentials.password)
		},
		onSuccess: (authResult: AuthenticationResult) => {
			const user: JellifyUser = {
				id: authResult.User!.Id!,
				name: authResult.User!.Name!,
				accessToken: authResult.AccessToken as string,
			}

			setUser(user)

			if (onSuccess) onSuccess()
		},
		onError: (error: Error) => {
			console.error('An error occurred connecting to the Jellyfin instance', error)

			if (onError) onError(error)
		},
		retry: 0,
		gcTime: 0,
	})
}

export default useAuthenticateUserByName

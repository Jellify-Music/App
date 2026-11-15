import { JellyfinCredentials } from '../../types/jellyfin-credentials'
import { AuthenticationResult } from '@jellyfin/sdk/lib/generated-client'
import { useMutation } from '@tanstack/react-query'
import { JellifyUser } from '../../../types/JellifyUser'
import { useApi, useJellifyUser } from '../../../stores/auth'
import { usePublicServerInfo } from '../../queries/public-server-info'
import authenticateUserByName from './utils'
import { handleError } from '../../../utils/errors'
import { LoggingContext } from '../../../utils/logging'

interface AuthenticateUserByNameMutation {
	onSuccess?: () => void
}

const useAuthenticateUserByName = ({ onSuccess }: AuthenticateUserByNameMutation) => {
	const api = useApi()
	const [, setUser] = useJellifyUser()

	const { data: serverInfo } = usePublicServerInfo()

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
			handleError(
				error,
				LoggingContext.Authentication,
				`Unable to sign in to ${serverInfo?.ServerName ?? 'Jellyfin'}`,
				'Unable to sign in to server',
			)
		},
		retry: 0,
		gcTime: 0,
	})
}

export default useAuthenticateUserByName

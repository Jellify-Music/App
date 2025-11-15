import { AxiosResponse } from 'axios'
import { JellyfinCredentials } from '../../types/jellyfin-credentials'
import { AuthenticationResult } from '@jellyfin/sdk/lib/generated-client'
import { useMutation } from '@tanstack/react-query'
import { JellifyUser } from '../../../types/JellifyUser'
import { isUndefined } from 'lodash'
import { getUserApi } from '@jellyfin/sdk/lib/utils/api'
import { useApi, useJellifyUser } from '../../../stores'

interface AuthenticateUserByNameMutation {
	onSuccess?: () => void
	onError?: (error: Error) => void
}

const useAuthenticateUserByName = ({ onSuccess, onError }: AuthenticateUserByNameMutation) => {
	const api = useApi()
	const [user, setUser] = useJellifyUser()

	return useMutation({
		mutationFn: async (credentials: JellyfinCredentials) => {
			return await getUserApi(api!).authenticateUserByName({
				authenticateUserByName: {
					Username: credentials.username,
					Pw: credentials.password,
				},
			})
		},
		onSuccess: async (authResult: AxiosResponse<AuthenticationResult>) => {
			console.log(`Received auth response from server`)
			if (isUndefined(authResult))
				return Promise.reject(new Error('Authentication result was empty'))

			if (authResult.status == 400 || isUndefined(authResult.data.AccessToken))
				return Promise.reject(new Error('Invalid credentials'))

			if (isUndefined(authResult.data.User))
				return Promise.reject(new Error('Unable to login'))

			console.log(`Successfully signed in to server`)

			const user: JellifyUser = {
				id: authResult.data.User!.Id!,
				name: authResult.data.User!.Name!,
				accessToken: authResult.data.AccessToken as string,
			}

			setUser(user)

			if (onSuccess) onSuccess()
		},
		onError: async (error: Error) => {
			console.error('An error occurred connecting to the Jellyfin instance', error)

			if (onError) onError(error)
		},
		retry: 0,
		gcTime: 0,
	})
}

export default useAuthenticateUserByName

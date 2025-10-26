import { AxiosResponse } from 'axios'
import { JellyfinCredentials } from '../../types/jellyfin-credentials'
import { AuthenticationResult } from '@jellyfin/sdk/lib/generated-client'
import { useMutation } from '@tanstack/react-query'
import { useJellifyContext } from '../../../providers'
import { JellifyUser } from '../../../types/JellifyUser'
import { isUndefined } from 'lodash'
import { getQuickConnectApi, getUserApi } from '@jellyfin/sdk/lib/utils/api'
import { useNavigation } from '@react-navigation/native'
import LoginStackParamList from '@/src/screens/Login/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

export const useInitiateQuickConnect = () => {
	const { api } = useJellifyContext()

	return useMutation({
		mutationFn: async () => {
			return await getQuickConnectApi(api!).initiateQuickConnect()
		},
	})
}

export const useAuthorizeQuickConnect = () => {
	const { api, user } = useJellifyContext()

	return useMutation({
		mutationFn: async (code: string) => {
			if (user) {
				return await getQuickConnectApi(api!).authorizeQuickConnect({
					code,
					userId: user.id,
				})
			}
		},
	})
}

const useAuthenticateWithQuickConnect = () => {
	const { api, setUser } = useJellifyContext()
	const navigation = useNavigation<NativeStackNavigationProp<LoginStackParamList>>()

	return useMutation({
		mutationFn: async (secret: string) => {
			return await getUserApi(api!).authenticateWithQuickConnect({
				quickConnectDto: { Secret: secret },
			})
		},
		onSuccess: async (authResult: AxiosResponse<AuthenticationResult>) => {
			console.log(`Received auth response from server`)
			if (isUndefined(authResult))
				return Promise.reject(new Error('Authentication result was empty'))

			if (authResult.status >= 400 || isUndefined(authResult.data.AccessToken))
				return Promise.reject(new Error('Invalid Secret'))

			if (isUndefined(authResult.data.User))
				return Promise.reject(new Error('Unable to login'))

			console.log(`Successfully signed in to server`)

			const user: JellifyUser = {
				id: authResult.data.User!.Id!,
				name: authResult.data.User!.Name!,
				accessToken: authResult.data.AccessToken as string,
			}

			setUser(user)
			navigation.navigate('LibrarySelection')
		},
		onError: async (error: Error) => {
			console.error('An error occurred connecting to the Jellyfin instance', error)
		},
		retry: 0,
		gcTime: 0,
	})
}

export default useAuthenticateWithQuickConnect

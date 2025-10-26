import { AxiosResponse } from 'axios'
import { JellyfinCredentials } from '../../types/jellyfin-credentials'
import { AuthenticationResult } from '@jellyfin/sdk/lib/generated-client'
import { useMutation } from '@tanstack/react-query'
import { useJellifyContext } from '../../../providers'
import { JellifyUser } from '../../../types/JellifyUser'
import { capitalize, isUndefined } from 'lodash'
import { getQuickConnectApi, getUserApi } from '@jellyfin/sdk/lib/utils/api'
import { useNavigation } from '@react-navigation/native'
import LoginStackParamList from '@/src/screens/Login/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { getDeviceId, getDeviceNameSync, getUniqueIdSync } from 'react-native-device-info'
import { name, version } from '../../../../package.json'

const QUICK_CONNECT_HEADER = encodeURIComponent(
	`MediaBrowser Device='${getDeviceNameSync()}' DeviceId='${getUniqueIdSync()}'`,
)

export const useInitiateQuickConnect = () => {
	const { api } = useJellifyContext()

	return useMutation({
		mutationFn: async () => {
			if (isUndefined(api)) return Promise.reject(new Error('API client is not initialized'))

			console.debug('Initiating Quick Connect', QUICK_CONNECT_HEADER)
			return await getQuickConnectApi(api!).initiateQuickConnect({
				headers: {
					Authorization: QUICK_CONNECT_HEADER,
				},
			})
		},
		onError: async (error: Error) => {
			console.error('An error occurred initiating Quick Connect', error)
		},
		onSuccess: async ({ data }, variables) => {
			console.log(`Successfully initiated Quick Connect. Code is ${data.Code}`)
			return data
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

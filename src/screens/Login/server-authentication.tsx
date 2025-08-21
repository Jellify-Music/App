import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import _ from 'lodash'
import { JellyfinCredentials } from '../../api/types/jellyfin-credentials'
import { getToken, H6, Spacer, Spinner, XStack, YStack } from 'tamagui'
import { H2, H5, Text } from '../../components/Global/helpers/text'
import Button from '../../components/Global/helpers/button'
import { SafeAreaView } from 'react-native-safe-area-context'
import { JellifyUser } from '../../types/JellifyUser'
import { RootStackParamList } from '../types'
import Input from '../../components/Global/helpers/input'
import Icon from '../../components/Global/components/icon'
import { useJellifyContext } from '../../providers'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Toast from 'react-native-toast-message'
import { IS_MAESTRO_BUILD } from '../../configs/config'
import { AxiosResponse } from 'axios'
import { AuthenticationResult } from '@jellyfin/sdk/lib/generated-client/models'
import LoginStackParamList from './types'

export default function ServerAuthentication({
	navigation,
}: {
	navigation: NativeStackNavigationProp<LoginStackParamList>
}): React.JSX.Element {
	const { api } = useJellifyContext()
	const [username, setUsername] = useState<string | undefined>(undefined)
	const [password, setPassword] = React.useState<string | undefined>(undefined)

	const { server, setUser, setServer } = useJellifyContext()

	const useApiMutation = useMutation({
		mutationFn: async (credentials: JellyfinCredentials) => {
			return await api!.authenticateUserByName(credentials.username, credentials.password)
		},
		onSuccess: async (authResult: AxiosResponse<AuthenticationResult>) => {
			console.log(`Received auth response from server`)
			if (_.isUndefined(authResult))
				return Promise.reject(new Error('Authentication result was empty'))

			if (authResult.status >= 400 || _.isEmpty(authResult.data.AccessToken))
				return Promise.reject(new Error('Invalid credentials'))

			if (_.isUndefined(authResult.data.User))
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

			Toast.show({
				text1: `Unable to sign in to ${server!.name}`,
				type: 'error',
			})
			return Promise.reject(`An error occured signing into ${server!.name}`)
		},
	})

	return (
		<SafeAreaView style={{ flex: 1 }}>
			<YStack maxHeight={'$19'} flex={1} justifyContent='center'>
				<H2 marginHorizontal={'$2'} textAlign='center'>
					{`Sign in to ${server?.name ?? 'Jellyfin'}`}
				</H2>
				<H6 marginHorizontal={'$2'} textAlign='center'>
					{server?.version ?? 'Unknown Jellyfin version'}
				</H6>
			</YStack>
			<YStack marginHorizontal={'$4'}>
				<Input
					prependElement={<Icon name='human-greeting-variant' color={'$borderColor'} />}
					placeholder='Username'
					value={username}
					style={
						IS_MAESTRO_BUILD ? { backgroundColor: '#000', color: '#000' } : undefined
					}
					testID='username_input'
					secureTextEntry={IS_MAESTRO_BUILD} // If Maestro build, don't show the username as screen Records
					onChangeText={(value: string | undefined) => setUsername(value)}
					autoCapitalize='none'
					autoCorrect={false}
				/>

				<Spacer />

				<Input
					prependElement={<Icon name='lock-outline' color={'$borderColor'} />}
					placeholder='Password'
					value={password}
					testID='password_input'
					style={
						IS_MAESTRO_BUILD ? { backgroundColor: '#000', color: '#000' } : undefined
					}
					onChangeText={(value: string | undefined) => setPassword(value)}
					autoCapitalize='none'
					autoCorrect={false}
					secureTextEntry // Always secure text entry
				/>

				<Spacer />

				<XStack justifyContent='space-between'>
					<Button
						marginVertical={0}
						icon={() => <Icon name='chevron-left' small />}
						bordered={0}
						onPress={() => {
							navigation.navigate('ServerAddress', undefined, { pop: true })
						}}
					>
						Switch Server
					</Button>
					{useApiMutation.isPending ? (
						<Spinner />
					) : (
						<Button
							marginVertical={0}
							disabled={_.isEmpty(username) || useApiMutation.isPending}
							icon={() => <Icon name='chevron-right' small />}
							testID='sign_in_button'
							onPress={() => {
								if (!_.isUndefined(username)) {
									console.log(`Signing in...`)
									useApiMutation.mutate({ username, password })
								}
							}}
						>
							Sign in
						</Button>
					)}
				</XStack>
				{/* <Toast /> */}
			</YStack>
		</SafeAreaView>
	)
}

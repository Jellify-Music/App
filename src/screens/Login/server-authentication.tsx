import React, { useState } from 'react'
import _ from 'lodash'
import { H6, Spacer, Spinner, XStack, YStack } from 'tamagui'
import { H2 } from '../../components/Global/helpers/text'
import Button from '../../components/Global/helpers/button'
import { SafeAreaView } from 'react-native-safe-area-context'
import Input from '../../components/Global/helpers/input'
import Icon from '../../components/Global/components/icon'
import { useJellifyContext } from '../../providers'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Toast from 'react-native-toast-message'
import { IS_MAESTRO_BUILD } from '../../configs/config'
import LoginStackParamList from './types'
import useAuthenticateUserByName from '../../api/mutations/authentication'

export default function ServerAuthentication({
	navigation,
}: {
	navigation: NativeStackNavigationProp<LoginStackParamList>
}): React.JSX.Element {
	const [username, setUsername] = useState<string | undefined>(undefined)
	const [password, setPassword] = React.useState<string | undefined>(undefined)

	const { server } = useJellifyContext()

	const { mutate: authenticateUserByName, isPending } = useAuthenticateUserByName({
		onSuccess: () => {
			navigation.navigate('LibrarySelection')
		},
		onError: () => {
			Toast.show({
				text1: `Unable to sign in to ${server!.name}`,
				type: 'error',
			})
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
					prependElement={<Icon name='human-greeting-variant' color={'$primary'} />}
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
					prependElement={<Icon name='lock-outline' color={'$primary'} />}
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
							navigation.popTo('ServerAddress', undefined)
						}}
					>
						Switch Server
					</Button>
					{isPending ? (
						<Spinner />
					) : (
						<Button
							marginVertical={0}
							disabled={_.isEmpty(username) || isPending}
							icon={() => <Icon name='chevron-right' small />}
							testID='sign_in_button'
							onPress={() => {
								if (!_.isUndefined(username)) {
									console.log(`Signing in...`)
									authenticateUserByName({ username, password })
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

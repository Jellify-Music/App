import React, { useEffect, useState } from 'react'
import _ from 'lodash'
import { H3, H6, Spacer, Spinner, XStack, YStack } from 'tamagui'
import { H2, Text } from '../../components/Global/helpers/text'
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
import QuickConnect from '../../components/Login/components/quick-connect'

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
			<YStack flex={1} justifyContent='center' alignContent='center'>
				<YStack flex={1} maxHeight={'$20'} justifyContent='center' alignContent='center'>
					<H3 textAlign='center'>{`Sign in to ${server?.name ?? 'Jellyfin'}`}</H3>
					<H6 textAlign='center'>{server?.version ?? 'Unknown Jellyfin version'}</H6>
				</YStack>
				<YStack marginHorizontal={'$4'} flex={1}>
					<Input
						prependElement={<Icon name='human-greeting-variant' color={'$primary'} />}
						placeholder='Username'
						value={username}
						style={
							IS_MAESTRO_BUILD
								? { backgroundColor: '#000', color: '#000' }
								: undefined
						}
						testID='username_input'
						secureTextEntry={IS_MAESTRO_BUILD} // If Maestro build, don't show the username as screen Records
						onChangeText={(value: string | undefined) => setUsername(value)}
						autoCapitalize='none'
						autoCorrect={false}
						autoComplete='username'
						textContentType='username'
						importantForAutofill='yes'
						returnKeyType='next'
						autoFocus
					/>

					<Spacer />

					<Input
						prependElement={<Icon name='lock-outline' color={'$primary'} />}
						placeholder='Password'
						value={password}
						testID='password_input'
						style={
							IS_MAESTRO_BUILD
								? { backgroundColor: '#000', color: '#000' }
								: undefined
						}
						onChangeText={(value: string | undefined) => setPassword(value)}
						autoCapitalize='none'
						autoCorrect={false}
						secureTextEntry // Always secure text entry
						autoComplete='password'
						textContentType='password'
						importantForAutofill='yes'
						returnKeyType='go'
					/>

					<Spacer />

					<Button
						borderWidth={'$1'}
						borderColor={'$primary'}
						disabled={_.isEmpty(username) || isPending}
						icon={() =>
							isPending ? (
								<Spinner color='$primary' />
							) : (
								<Icon name='chevron-right' small color='$primary' />
							)
						}
						testID='sign_in_button'
						onPress={() => {
							if (!_.isUndefined(username)) {
								console.log(`Signing in...`)
								authenticateUserByName({ username, password })
							}
						}}
					>
						<Text bold color={'$primary'}>
							Sign in
						</Text>
					</Button>

					<Spacer />

					<YStack flex={1} marginVertical={'$4'}>
						<QuickConnect />
					</YStack>

					<Spacer />

					<Button
						borderWidth={'$1'}
						borderColor={'$borderColor'}
						marginVertical={0}
						icon={() => <Icon name='chevron-left' small color='$borderColor' />}
						bordered={0}
						onPress={() => {
							navigation.popTo('ServerAddress', undefined)
						}}
					>
						<Text bold color={'$borderColor'}>
							Switch Server
						</Text>
					</Button>
				</YStack>
				{/* <Toast /> */}
			</YStack>
		</SafeAreaView>
	)
}

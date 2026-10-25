import { IS_MAESTRO_BUILD } from '../../configs/config'
import { isEmpty, isUndefined } from 'lodash'
import { H3, H5, Separator, Spinner, XStack, YStack } from 'tamagui'
import Icon from '../Global/components/icon'
import useAuthenticateUserByName from '../../api/mutations/authentication'
import { getUser, getLibrary } from '../../stores/auth/utils'
import { useState } from 'react'
import { useJellifyServer } from '../../stores/auth'
import LoginStackParamList from '../../screens/Login/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useNavigation } from '@react-navigation/native'
import Toast from 'react-native-toast-message'
import Input from '../Global/helpers/input'
import { GestureResponderEvent, StyleSheet } from 'react-native'
import Animated, { Easing, FadeIn, FadeOut } from 'react-native-reanimated'
import { ICON_PRESS_STYLES } from '../../configs/styling/elements'
import Button from '../Global/helpers/button'
import { loginStyles } from './styles'

export default function ServerAuthentication(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<LoginStackParamList>>()

	const [username, setUsername] = useState<string | undefined>(undefined)
	const [password, setPassword] = useState<string>('')

	const [server] = useJellifyServer()

	const { mutate: authenticateUserByName, isPending } = useAuthenticateUserByName({
		onSuccess: () => {
			console.debug(
				'Password auth success - store user:',
				getUser(),
				'store library:',
				getLibrary(),
			)
			navigation.navigate('LibrarySelection')
		},
		onError: (error: Error) => {
			Toast.show({
				text1: `Unable to sign in to ${server!.name}`,
				text2: error.message,
				type: 'error',
			})
		},
	})

	const onSubmitEditing = () => {
		if (!isUndefined(username) && !isEmpty(username) && !isPending) {
			authenticateUserByName({ username, password })
		}
	}

	const onSignInPress = (event: GestureResponderEvent) => {
		navigation.navigate('ServerAddress', undefined, {
			pop: true,
		})
	}

	return (
		<Animated.View style={loginStyles.container}>
			<XStack alignItems='center' flexShrink={1}>
				<Button
					icon={<Icon name='chevron-left' size='7' />}
					onPress={onSignInPress}
					fontWeight='6'
					{...ICON_PRESS_STYLES}
				>
					{'Switch Server'}
				</Button>
			</XStack>

			<YStack gap='4' flexGrow={1} alignContent={'center'}>
				<Animated.View
					entering={FadeIn.easing(Easing.ease)}
					exiting={FadeOut.easing(Easing.ease)}
					style={loginStyles.headerSection}
				>
					<H3 textAlign='center' testID='server_authentication_title'>
						{`Sign in to ${server?.name ?? 'Jellyfin'}`}
					</H3>
					<H5 textAlign='center'>{server?.version ?? 'Unknown Jellyfin version'}</H5>
				</Animated.View>

				<Input
					prependElement={<Icon name='human-greeting-variant' color={'primary'} />}
					placeholder='Username'
					value={username}
					style={styles.input}
					testID='username_input'
					secureTextEntry={IS_MAESTRO_BUILD} // If Maestro build, don't show the username as screen Records
					onChangeText={setUsername}
					autoCapitalize='none'
					autoCorrect={false}
					autoComplete='username'
					textContentType='username'
					importantForAutofill='yes'
					returnKeyType='next'
					autoFocus
					clearButtonMode='while-editing'
					tabIndex={0}
					onSubmitEditing={onSubmitEditing}
				/>

				<Input
					prependElement={<Icon name='lock-outline' color={'primary'} />}
					placeholder='Password'
					value={password}
					onChangeText={setPassword}
					autoCapitalize='none'
					autoCorrect={false}
					autoComplete='password'
					textContentType='password'
					importantForAutofill='yes'
					returnKeyType='done'
					testID='password_input'
					style={styles.input}
					secureTextEntry
					clearButtonMode='while-editing'
					tabIndex={1}
					onSubmitEditing={onSubmitEditing}
				/>

				<Button
					backgroundColor={isEmpty(username) || isPending ? 'neutral' : 'primary'}
					testID='sign_in_button'
					onPress={onSubmitEditing}
					color='background'
				>
					{isPending ? <Spinner color='background' /> : 'Sign in'}
				</Button>

				<Separator borderColor='borderColor' flexShrink={1} />

				<Button onPress={() => navigation.navigate('QuickConnect')} color='primary'>
					{'Use Quick Connect'}
					<Icon name='chevron-right' color='primary' />
				</Button>
			</YStack>
		</Animated.View>
	)
}

const styles = StyleSheet.create({
	input: {
		backgroundColor: IS_MAESTRO_BUILD ? '#000' : undefined,
		color: IS_MAESTRO_BUILD ? '#000' : undefined,
	},
})

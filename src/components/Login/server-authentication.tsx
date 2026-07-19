import { IS_MAESTRO_BUILD } from '../../configs/config'
import { isEmpty, isUndefined } from 'lodash'
import { H3, Paragraph, Separator, Spinner, XStack, YStack } from 'tamagui'
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
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { BUTTON_PRESS_STYLES, ICON_PRESS_STYLES } from '../../configs/styling/elements'
import Button from '../Global/helpers/button'

export default function ServerAuthentication(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<LoginStackParamList>>()

	const [username, setUsername] = useState<string | undefined>(undefined)
	const [password, setPassword] = useState<string | undefined>(undefined)

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
		if (!isUndefined(username) && !isUndefined(password) && !isPending) {
			authenticateUserByName({ username, password })
		}
	}

	const onSignInPress = (event: GestureResponderEvent) => {
		navigation.navigate('ServerAddress', undefined, {
			pop: true,
		})
	}

	return (
		<YStack flex={1}>
			<XStack alignItems='center' flexShrink={1}>
				<Button
					icon={() => <Icon name='chevron-left' small />}
					borderRadius={'$4'}
					onPress={onSignInPress}
					fontWeight='$6'
					{...ICON_PRESS_STYLES}
				>
					{'Switch Server'}
				</Button>
			</XStack>

			<YStack
				marginHorizontal={'$4'}
				gap={'$3'}
				flex={1}
				justifyContent='center'
				alignContent='center'
			>
				<Animated.View
					entering={FadeIn.springify()}
					exiting={FadeOut.springify()}
					style={styles.headerSection}
				>
					<H3
						marginHorizontal={'$2'}
						textAlign='center'
						testID='server_authentication_title'
					>
						{`Sign in to ${server?.name ?? 'Jellyfin'}`}
					</H3>
					<Paragraph fontSize={'$6'} fontWeight={'$6'} textAlign='center' margin={'$2'}>
						{server?.version ?? 'Unknown Jellyfin version'}
					</Paragraph>
				</Animated.View>

				<YStack flex={2} justifyContent='flex-start' gap={'$4'}>
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
						clearButtonMode='while-editing'
						tabIndex={0}
						onSubmitEditing={onSubmitEditing}
					/>

					<Input
						prependElement={<Icon name='lock-outline' color={'$primary'} />}
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
						style={
							IS_MAESTRO_BUILD
								? { backgroundColor: '#000', color: '#000' }
								: undefined
						}
						secureTextEntry
						clearButtonMode='while-editing'
						tabIndex={1}
						onSubmitEditing={onSubmitEditing}
					/>

					<Button
						backgroundColor={isEmpty(username) || isPending ? '$neutral' : '$primary'}
						testID='sign_in_button'
						onPress={onSubmitEditing}
						color='$background'
						fontWeight='$6'
						{...BUTTON_PRESS_STYLES}
					>
						{isPending ? <Spinner color='$background' /> : 'Sign in'}
					</Button>

					<Separator borderColor={'$borderColor'} flexShrink={1} />

					<XStack alignItems='center' justifyContent='center'>
						<Button
							borderRadius={'$2'}
							onPress={() => navigation.navigate('QuickConnect')}
							color='$primary'
							fontWeight='$6'
							{...ICON_PRESS_STYLES}
						>
							{'Use Quick Connect'}
							<Icon name='chevron-right' color='$primary' />
						</Button>
					</XStack>
				</YStack>
			</YStack>
		</YStack>
	)
}

const styles = StyleSheet.create({
	headerSection: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		margin: 20,
	},
})

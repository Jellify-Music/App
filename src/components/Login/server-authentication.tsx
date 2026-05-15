import { IS_MAESTRO_BUILD } from '../../configs/config'
import { isEmpty, isUndefined } from 'lodash'
import { Button, H3, H6, Paragraph, Separator, Spinner, XStack, YStack } from 'tamagui'
import Icon from '../Global/components/icon'
import useAuthenticateUserByName from '../../api/mutations/authentication'
import { useState } from 'react'
import { useJellifyServer } from '../../stores/auth'
import LoginStackParamList from '../../screens/Login/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useNavigation } from '@react-navigation/native'
import Toast from 'react-native-toast-message'
import Input from '../Global/helpers/input'
import { StyleSheet } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { BUTTON_PRESS_STYLES, ICON_PRESS_STYLES } from '../../configs/style.config'

export default function ServerAuthentication(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<LoginStackParamList>>()

	const [username, setUsername] = useState<string | undefined>(undefined)
	const [password, setPassword] = useState<string | undefined>(undefined)

	const [server] = useJellifyServer()

	const { mutate: authenticateUserByName, isPending } = useAuthenticateUserByName({
		onSuccess: () => {
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

	return (
		<YStack flex={1}>
			<XStack alignItems='center' flexShrink={1}>
				<Button
					marginVertical={0}
					icon={() => <Icon name='chevron-left' small />}
					borderRadius={'$4'}
					onPress={() => {
						navigation.popTo('ServerAddress', undefined)
					}}
				>
					<Paragraph fontWeight={'$6'}>Switch Server</Paragraph>
				</Button>
			</XStack>

			<YStack marginHorizontal={'$4'} gap={'$3'} flex={1} justifyContent='center'>
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

				<YStack flex={1} justifyContent='flex-start' gap={'$4'}>
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
					/>

					<Button
						backgroundColor={isEmpty(username) || isPending ? '$neutral' : '$primary'}
						disabled={isEmpty(username) || isPending}
						testID='sign_in_button'
						onPress={() => {
							if (!isUndefined(username)) {
								console.log(`Signing in...`)
								authenticateUserByName({ username, password })
							}
						}}
						{...BUTTON_PRESS_STYLES}
					>
						{isPending ? (
							<Spinner color='$background' />
						) : (
							<Paragraph fontWeight={'$6'} color={'$background'}>
								Sign in
							</Paragraph>
						)}
					</Button>
				</YStack>

				<Separator borderColor={'$borderColor'} />

				<XStack
					flexShrink={1}
					alignItems='center'
					justifyContent='center'
					marginVertical={'$4'}
				>
					<Button
						borderRadius={'$2'}
						onPress={() => navigation.navigate('QuickConnect')}
						{...ICON_PRESS_STYLES}
					>
						<Paragraph fontWeight={'$6'} color={'$primary'} textAlign='center'>
							Quick Connect
						</Paragraph>
					</Button>
				</XStack>
			</YStack>
		</YStack>
	)
}

const styles = StyleSheet.create({
	headerSection: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
})

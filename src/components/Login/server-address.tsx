import { H3, H5, Spinner, YStack } from 'tamagui'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import LoginStackParamList from '../../screens/Login/types'
import { useEffect, useState } from 'react'
import { useSignOut } from '../../stores/auth'
import { isEmpty } from 'lodash'
import useConnectToServer from '../../api/mutations/public-system-info'
import { IS_MAESTRO_BUILD } from '../../configs/config'
import { JellyfinServer } from '../../types/JellyfinServer'
import { sleepify } from '../../utils/sleep'
import Toast from 'react-native-toast-message'
import Animated, { Easing, FadeIn, FadeOut, useAnimatedStyle } from 'react-native-reanimated'
import { useAnimatedKeyboard } from 'react-native-keyboard-controller'
import { StyleSheet } from 'react-native'
import AnimatedJellifyLogo from '../Branding/animated-logo'
import SendMetricsAndCrashDataSetting from '../Settings/components/settings/send-metrics-and-crash-data'
import Input from '../Global/helpers/input'
import { BUTTON_PRESS_STYLES } from '../../configs/styling/elements'
import Button from '../Global/helpers/button'
import { loginStyles } from './styles'

export default function ServerAddress(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<LoginStackParamList>>()

	const [serverAddress, setServerAddress] = useState<string | undefined>(undefined)

	const signOut = useSignOut()

	useEffect(() => {
		sleepify(1000).then(() => signOut())
	}, [])

	const { mutate: connectToServer, isPending } = useConnectToServer({
		onSuccess: (server: JellyfinServer) => navigation.navigate('ServerAuthentication'),
		onError: () =>
			Toast.show({
				text1: 'Unable to connect',
				text2: `to ${serverAddress}`,
				type: 'error',
			}),
	})

	const connectWithAddress = () => {
		if (serverAddress !== undefined && serverAddress.length > 0)
			connectToServer({ serverAddress })
	}

	const keyboard = useAnimatedKeyboard()

	const containerStyle = useAnimatedStyle(() => ({
		marginBottom: keyboard.height.get() ?? 20,
	}))

	return (
		<Animated.View style={[loginStyles.container, containerStyle]}>
			<YStack gap='4'>
				<AnimatedJellifyLogo rotateColor />
				<Animated.View
					entering={FadeIn.easing(Easing.ease)}
					exiting={FadeOut.easing(Easing.ease)}
					style={loginStyles.headerSection}
				>
					<H3 textAlign='center' testID='server_address_title'>
						Welcome!
					</H3>

					<H5 textAlign='center'>Let&apos;s get connected to Jellyfin</H5>
				</Animated.View>

				<Input
					onChangeText={setServerAddress}
					autoCapitalize='none'
					autoCorrect={false}
					secureTextEntry={IS_MAESTRO_BUILD} // If Maestro build, don't show the server address as screen Records
					flexDirection='row'
					flexShrink={1}
					placeholder='demo.jellyfin.org/stable'
					testID='server_address_input'
					returnKeyType='done'
					onSubmitEditing={connectWithAddress}
					title='Jellyfin Server Address'
					tabIndex={0}
					borderColor={'borderColor'}
				/>

				<SendMetricsAndCrashDataSetting />

				<Button
					backgroundColor={`${isEmpty(serverAddress) || isPending ? 'neutral' : 'primary'}`}
					color='background'
					onPress={connectWithAddress}
					testID='connect_button'
				>
					{isPending ? <Spinner color='background' /> : 'Connect'}
				</Button>
			</YStack>
		</Animated.View>
	)
}

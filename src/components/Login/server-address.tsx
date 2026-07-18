import { Button, H3, Paragraph, Spinner, YStack } from 'tamagui'
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
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { GestureResponderEvent, StyleSheet } from 'react-native'
import AnimatedJellifyLogo from '../Branding/animated-logo'
import SendMetricsAndCrashDataSetting from '../Settings/components/settings/send-metrics-and-crash-data'
import Input from '../Global/helpers/input'
import { BUTTON_PRESS_STYLES } from '../../configs/styling/elements'
import { useErrorToast } from '../../hooks/toasts'

export default function ServerAddress(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<LoginStackParamList>>()

	const [serverAddress, setServerAddress] = useState<string | undefined>(undefined)

	const signOut = useSignOut()

	const toast = useErrorToast()

	useEffect(() => {
		sleepify(1000).then(() => signOut())
	}, [])

	const { mutate: connectToServer, isPending } = useConnectToServer({
		onSuccess: (server: JellyfinServer) => navigation.navigate('ServerAuthentication'),
		onError: () =>
			toast({
				title: 'Unable to connect',
				message: `Failed to connect to ${serverAddress}`,
			}),
	})

	const connectWithAddress = () => {
		if (serverAddress !== undefined && serverAddress.length > 0)
			connectToServer({ serverAddress })
	}

	return (
		<YStack
			marginHorizontal={'$4'}
			gap={'$3'}
			flex={1}
			justifyContent='center'
			alignContent='center'
		>
			<AnimatedJellifyLogo rotateColor />
			<Animated.View
				entering={FadeIn.springify()}
				exiting={FadeOut.springify()}
				style={styles.headerSection}
			>
				<H3 textAlign='center' testID='server_address_title' margin={'$2'}>
					Welcome!
				</H3>

				<Paragraph fontSize={'$6'} fontWeight={'$6'} textAlign='center' margin={'$2'}>
					Let&apos;s get connected to Jellyfin
				</Paragraph>
			</Animated.View>

			<YStack gap={'$6'} flex={1} justifyContent='flex-start'>
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
				/>

				<SendMetricsAndCrashDataSetting />

				<Button
					backgroundColor={isEmpty(serverAddress) || isPending ? '$neutral' : '$primary'}
					onPress={connectWithAddress}
					testID='connect_button'
					color='$background'
					fontWeight='$6'
					{...BUTTON_PRESS_STYLES}
				>
					{isPending ? <Spinner color='$background' /> : 'Connect'}
				</Button>
			</YStack>
		</YStack>
	)
}

const styles = StyleSheet.create({
	headerSection: {
		flexShrink: 1,
		justifyContent: 'flex-end',
		alignItems: 'center',
		margin: 20,
	},
})

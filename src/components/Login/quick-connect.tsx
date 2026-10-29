import React, { useEffect, useState } from 'react'
import useAuthenticateWithQuickConnect, {
	useInitiateQuickConnect,
} from '../../api/mutations/quickconnect'
import useGetQuickConnectState from '../../api/queries/quickconnect'
import { Spinner, YStack, XStack, H3, Spacer, View, H5, H6 } from 'tamagui'
import { useNavigation } from '@react-navigation/native'
import LoginStackParamList from '@/src/screens/Login/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Icon from '../Global/components/icon'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import Toast from 'react-native-toast-message'
import Clipboard from '@react-native-clipboard/clipboard'
import AnimatedJellifyLogo from '../Branding/animated-logo'
import { BUTTON_PRESS_STYLES, ICON_PRESS_STYLES } from '../../configs/styling/elements'
import { applyHapticFeedback } from '../../utils/haptics'
import { MaterialDesignIconsIconName } from '@react-native-vector-icons/material-design-icons'
import { loginStyles } from './styles'
import Button from '../Global/helpers/button'

// Handles polling, code display, error, and authentication
function QuickConnectDisplay({
	secret,
	code,
	onExpired,
}: {
	secret: string
	code: string
	onExpired: () => void
}) {
	const [copyIconName, setCopyIconName] =
		useState<MaterialDesignIconsIconName>('clipboard-outline')

	const { mutate: authenticate, isPending: isAuthenticating } = useAuthenticateWithQuickConnect()

	const {
		data: quickConnectData,
		error: quickConnectError,
		refetch: refetchQuickConnectData,
	} = useGetQuickConnectState(secret)

	const onCodePress = () => {
		applyHapticFeedback('info')
		Clipboard.setString(code)
		setCopyIconName('check')
		Toast.show({
			type: 'info',
			text1: 'Coped to Clipboard',
		})
		setTimeout(() => setCopyIconName('clipboard-outline'), 1500)
	}

	// Authenticate when ready
	useEffect(() => {
		if (quickConnectData?.data.Authenticated && secret) {
			authenticate(secret)
		}
	}, [quickConnectData?.data.Authenticated, secret, authenticate])

	// Handle expired/errored code
	useEffect(() => {
		if (quickConnectError) {
			onExpired()
		}
	}, [quickConnectError, onExpired])

	useEffect(() => {
		if (quickConnectData?.data.Authenticated) return

		const interval = setInterval(() => {
			refetchQuickConnectData()
		}, 5000)

		return () => clearInterval(interval)
	}, [secret, quickConnectData?.data.Authenticated, refetchQuickConnectData])

	return (
		<YStack justifyContent='center' alignContent='center' flex={1} gap='4'>
			<XStack
				alignItems={'center'}
				justifyContent='center'
				flexShrink={1}
				{...BUTTON_PRESS_STYLES}
				gap='1'
				onPress={onCodePress}
			>
				<Icon size={'7'} name={copyIconName} color='primary' />

				<H6 fontWeight='6' color='primary'>
					{code}
				</H6>
			</XStack>
			{isAuthenticating ? <Spinner color='primary' /> : <Spacer />}
		</YStack>
	)
}

// Initiates quick connect, manages secret/code state, and renders display
export default function QuickConnectInitiator() {
	const navigation = useNavigation<NativeStackNavigationProp<LoginStackParamList>>()

	const {
		isPending: isInitiating,
		mutate: initiateQuickConnect,
		reset: resetInitiateQuickConnect,
		data: quickConnectData,
	} = useInitiateQuickConnect()

	const beginQuickConnect = () => {
		resetInitiateQuickConnect()
		initiateQuickConnect()
	}

	useEffect(() => {
		beginQuickConnect()
	}, [])

	return (
		<View flex={1}>
			<XStack alignItems='center' flexShrink={1}>
				<Button
					icon={<Icon name='chevron-left' size={'7'} />}
					onPress={() => {
						navigation.navigate('ServerAuthentication', undefined, {
							merge: true,
							pop: true,
						})
					}}
					{...ICON_PRESS_STYLES}
				>
					{'Sign in Manually'}
				</Button>
			</XStack>

			<YStack
				marginHorizontal='4'
				gap='3'
				flex={1}
				justifyContent='center'
				alignContent='center'
			>
				<AnimatedJellifyLogo rotateColor />
				<Animated.View
					entering={FadeIn.springify()}
					exiting={FadeOut.springify()}
					style={loginStyles.headerSection}
				>
					<H3 marginHorizontal='2' textAlign='center' testID='quick_connect_title'>
						Quick Connect
					</H3>

					<H5 textAlign={'center'}>Enter the code in another session</H5>
				</Animated.View>

				<YStack flex={2} justifyContent='center' gap='4'>
					{isInitiating ? (
						<Spinner color='primary' />
					) : quickConnectData?.data.Secret && quickConnectData?.data.Code ? (
						<QuickConnectDisplay
							secret={quickConnectData.data.Secret}
							code={quickConnectData.data.Code}
							onExpired={beginQuickConnect}
						/>
					) : (
						<Button onPress={beginQuickConnect}>Retry</Button>
					)}
				</YStack>
			</YStack>
		</View>
	)
}

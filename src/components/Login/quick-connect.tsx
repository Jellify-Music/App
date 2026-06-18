import React, { useEffect, useState } from 'react'
import useAuthenticateWithQuickConnect, {
	useInitiateQuickConnect,
} from '../../api/mutations/quickconnect'
import useGetQuickConnectState from '../../api/queries/quickconnect'
import { Spinner, Button, YStack, XStack, Paragraph, H3, Spacer } from 'tamagui'
import { useNavigation } from '@react-navigation/native'
import LoginStackParamList from '@/src/screens/Login/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Icon from '../Global/components/icon'
import { StyleSheet } from 'react-native'
import Animated, { BounceIn, BounceOut, FadeIn, FadeOut } from 'react-native-reanimated'
import Toast from 'react-native-toast-message'
import Clipboard from '@react-native-clipboard/clipboard'
import AnimatedJellifyLogo from '../Branding/animated-logo'
import { BUTTON_PRESS_STYLES, ICON_PRESS_STYLES } from '../../configs/style.config'
import { applyHapticFeedback } from '../../utils/haptics'
import { MaterialDesignIconsIconName } from '@react-native-vector-icons/material-design-icons'

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
		<YStack justifyContent='flex-start' alignContent='center' flex={1} gap={'$4'}>
			<XStack
				alignItems={'center'}
				justifyContent='center'
				flexShrink={1}
				onPress={onCodePress}
				{...BUTTON_PRESS_STYLES}
				gap={'$1'}
			>
				<Icon small name={copyIconName} color='$primary' />

				<Paragraph fontSize={'$8'} fontWeight={'$6'} color={'$primary'}>
					{code}
				</Paragraph>
			</XStack>
			{isAuthenticating ? <Spinner color={'$primary'} /> : <Spacer />}
		</YStack>
	)
}

// Initiates quick connect, manages secret/code state, and renders display
export default function QuickConnectInitiator() {
	const navigation = useNavigation<NativeStackNavigationProp<LoginStackParamList>>()

	const {
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
		<YStack flex={1}>
			<XStack alignItems='center' flexShrink={1}>
				<Button
					marginVertical={0}
					icon={() => <Icon name='chevron-left' small />}
					borderRadius={'$4'}
					onPress={() => {
						navigation.navigate('ServerAuthentication', undefined, {
							merge: true,
							pop: true,
						})
					}}
				>
					<Paragraph fontWeight={'$6'}>Sign in Manually</Paragraph>
				</Button>
			</XStack>

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
					<H3 marginHorizontal={'$2'} textAlign='center' testID='quick_connect_title'>
						Quick Connect
					</H3>

					<Paragraph fontSize={'$6'} fontWeight={'$6'} textAlign='center' margin={'$2'}>
						Enter the code in another session
					</Paragraph>
				</Animated.View>

				<YStack flex={2} justifyContent='flex-start' gap={'$4'}>
					{quickConnectData?.data.Secret && quickConnectData?.data.Code ? (
						<QuickConnectDisplay
							secret={quickConnectData.data.Secret}
							code={quickConnectData.data.Code}
							onExpired={beginQuickConnect}
						/>
					) : null}
					{!quickConnectData?.data.Secret && (
						<Button onPress={beginQuickConnect}>Retry</Button>
					)}
				</YStack>
			</YStack>
		</YStack>
	)
}

const styles = StyleSheet.create({
	headerSection: {
		flexShrink: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	quickConnectSection: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
})

import React, { useEffect } from 'react'
import useAuthenticateWithQuickConnect, {
	useInitiateQuickConnect,
} from '../../api/mutations/quickconnect'
import useGetQuickConnectState from '../../api/queries/quickconnect'
import { Spinner, Button, YStack, XStack, Paragraph, H3 } from 'tamagui'
import { useNavigation } from '@react-navigation/native'
import LoginStackParamList from '@/src/screens/Login/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Icon from '../Global/components/icon'
import { StyleSheet } from 'react-native'
import Animated, { FadeIn, FadeOut, FlipInEasyY, FlipOutEasyY } from 'react-native-reanimated'
import Toast from 'react-native-toast-message'
import Clipboard from '@react-native-clipboard/clipboard'
import { Presets } from 'react-native-pulsar'

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
	const { mutate: authenticate, isPending: isAuthenticating } = useAuthenticateWithQuickConnect()

	const {
		data: quickConnectData,
		error: quickConnectError,
		refetch: refetchQuickConnectData,
	} = useGetQuickConnectState(secret)

	useEffect(() => {}, [secret, code])

	// Authenticate when ready
	useEffect(() => {
		if (quickConnectData?.data.Authenticated && secret) {
			authenticate(secret)
		}
	}, [quickConnectData, secret, authenticate])

	// Handle expired/errored code
	useEffect(() => {
		if (quickConnectError) {
			onExpired()
		}
	}, [quickConnectError, onExpired])

	useEffect(() => {
		const interval = setInterval(() => {
			console.debug(`Checking Quick Connect State: ${JSON.stringify(quickConnectData)}`)

			if (quickConnectData?.data.Authenticated) clearInterval(interval)
			refetchQuickConnectData()
		}, 5000)

		return () => clearInterval(interval)
	}, [secret])

	return (
		<YStack justifyContent='center' alignContent='center'>
			<Paragraph
				fontSize={'$8'}
				fontWeight={'$6'}
				margin={'$2'}
				textAlign='center'
				onPress={() => {
					Presets.peck()
					Clipboard.setString(code)
					Toast.show({
						type: 'info',
						text1: 'Coped to Clipboard',
					})
				}}
			>
				{code}
			</Paragraph>
			{isAuthenticating && <Spinner />}
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

	return (
		<YStack flex={1} onLayout={beginQuickConnect}>
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

			<YStack marginHorizontal={'$4'} gap={'$3'} flex={1} justifyContent='center'>
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

				<Animated.View
					entering={FlipInEasyY.springify()}
					exiting={FlipOutEasyY.springify()}
					style={styles.quickConnectSection}
				>
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
				</Animated.View>
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
	quickConnectSection: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
})

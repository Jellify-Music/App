import React, { useCallback, useEffect, useLayoutEffect } from 'react'
import useAuthenticateWithQuickConnect, {
	useInitiateQuickConnect,
} from '../../../api/mutations/quickconnect'
import useGetQuickConnectState from '../../../api/queries/quickconnect'
import { View, Spinner, Button, YStack, H6, H5 } from 'tamagui'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import LoginStackParamList from '@/src/screens/Login/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

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
		<View>
			<H6>{code}</H6>
			{isAuthenticating && <Spinner />}
		</View>
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

	const beginQuickConnect = useCallback(() => {
		resetInitiateQuickConnect()
		initiateQuickConnect()
	}, [initiateQuickConnect, resetInitiateQuickConnect])

	useEffect(() => {
		initiateQuickConnect()

		return resetInitiateQuickConnect()
	})

	return (
		<YStack alignItems='center'>
			<H5>Quick Connect</H5>
			{quickConnectData?.data.Secret && quickConnectData?.data.Code ? (
				<QuickConnectDisplay
					secret={quickConnectData.data.Secret}
					code={quickConnectData.data.Code}
					onExpired={beginQuickConnect}
				/>
			) : null}
			{!quickConnectData?.data.Secret && <Button onPress={beginQuickConnect}>Retry</Button>}
		</YStack>
	)
}

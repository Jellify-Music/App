import React, { useEffect, useState } from 'react'
import useAuthenticateWithQuickConnect, {
	useInitiateQuickConnect,
} from '../../../api/mutations/quickconnect'
import useGetQuickConnectState from '../../../api/queries/quickconnect'
import { View, Spinner, Button, YStack } from 'tamagui'
import { Text } from '../../Global/helpers/text'

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
	const {
		data: stateData,
		error: stateError,
		isFetching: isStateFetching,
	} = useGetQuickConnectState(secret)
	const { mutate: authenticate, isPending: isAuthenticating } = useAuthenticateWithQuickConnect()

	// Authenticate when ready
	useEffect(() => {
		if (stateData?.data.Authenticated && secret) {
			authenticate(secret)
		}
	}, [stateData, secret, authenticate])

	// Handle expired/errored code
	useEffect(() => {
		if (stateError) {
			onExpired()
		}
	}, [stateError, onExpired])

	return (
		<View>
			<Text>{code}</Text>
			{isStateFetching && <Spinner />}
			{stateError && (
				<View>
					<Text color='red'>Code expired. Please try again.</Text>
				</View>
			)}
			{isAuthenticating && <Spinner />}
		</View>
	)
}

// Initiates quick connect, manages secret/code state, and renders display
export default function QuickConnectInitiator() {
	const {
		mutate: initiateQuickConnect,
		reset: resetInitiateQuickConnect,
		data: quickConnectData,
		isPending: isInitiating,
	} = useInitiateQuickConnect()

	// When QuickConnect is initiated, set secret and code
	useEffect(() => {
		initiateQuickConnect()
	}, [])

	// Reset secret/code to retry
	const handleExpired = () => {
		resetInitiateQuickConnect()
		initiateQuickConnect()
	}

	return (
		<YStack>
			<Text bold>Quick Connect</Text>
			{isInitiating && <Spinner />}
			{quickConnectData?.data.Secret && quickConnectData?.data.Code ? (
				<QuickConnectDisplay
					secret={quickConnectData.data.Secret}
					code={quickConnectData.data.Code}
					onExpired={handleExpired}
				/>
			) : null}
			{!quickConnectData?.data.Secret && !isInitiating && (
				<Button onPress={() => initiateQuickConnect()}>Retry</Button>
			)}
		</YStack>
	)
}

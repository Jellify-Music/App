import React, { useEffect, useState } from 'react'
import useAuthenticateWithQuickConnect, {
	useInitiateQuickConnect,
} from '../../../api/mutations/quickconnect'
import useGetQuickConnectState from '../../../api/queries/quickconnect'
import { Text, View, Spinner, Button } from 'tamagui'

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
			<Text>
				Your QuickConnect Code: <Text fontWeight='bold'>{code}</Text>
			</Text>
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
	const [secret, setSecret] = useState<string | null>(null)
	const [code, setCode] = useState<string | null>(null)

	const {
		mutate: initiateQuickConnect,
		data: initData,
		isPending: isInitiating,
	} = useInitiateQuickConnect()

	// Start QuickConnect on mount or when secret is null
	useEffect(() => {
		if (!secret) {
			initiateQuickConnect()
		}
	}, [secret, initiateQuickConnect])

	// When QuickConnect is initiated, set secret and code
	useEffect(() => {
		if (initData?.data.Secret && initData?.data.Code) {
			setSecret(initData.data.Secret)
			setCode(initData.data.Code)
		}
	}, [initData])

	// Reset secret/code to retry
	const handleExpired = () => {
		setSecret(null)
		setCode(null)
	}

	return (
		<View>
			<Text>Quick Connect (with Cheese 🧀)</Text>
			{isInitiating && <Spinner />}
			{secret && code ? (
				<QuickConnectDisplay secret={secret} code={code} onExpired={handleExpired} />
			) : null}
			{!secret && !isInitiating && (
				<Button onPress={() => initiateQuickConnect()}>Retry</Button>
			)}
		</View>
	)
}

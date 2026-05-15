import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import ServerAuthentication from '../../components/Login/server-authentication'

export default function ServerAuthenticationScreen(): React.JSX.Element {
	return (
		<SafeAreaView style={{ flex: 1 }} testID='server_authentication_screen'>
			<ServerAuthentication />
		</SafeAreaView>
	)
}

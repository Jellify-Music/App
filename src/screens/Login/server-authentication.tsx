import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import ServerAuthentication from '../../components/Login/server-authentication'
import { loginScreenStyles } from './styles'

export default function ServerAuthenticationScreen(): React.JSX.Element {
	return (
		<SafeAreaView style={loginScreenStyles.container} testID='server_authentication_screen'>
			<ServerAuthentication />
		</SafeAreaView>
	)
}

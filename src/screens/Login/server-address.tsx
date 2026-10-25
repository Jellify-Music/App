import ServerAddress from '../../components/Login/server-address'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { loginScreenStyles } from './styles'

export default function ServerAddressScreen(): React.JSX.Element {
	return (
		<SafeAreaView style={loginScreenStyles.container} testID='server_address_screen'>
			<ServerAddress />
		</SafeAreaView>
	)
}

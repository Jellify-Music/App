import ServerAddress from '../../components/Login/components/server-address'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ServerAddressScreen(): React.JSX.Element {
	return (
		<SafeAreaView style={{ flex: 1 }} testID='server_address_screen'>
			<ServerAddress />
		</SafeAreaView>
	)
}

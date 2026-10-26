import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import ServerLibrary from '../../components/Login/server-library'
import { loginScreenStyles } from './styles'

export default function ServerLibraryScreen(): React.JSX.Element {
	return (
		<SafeAreaView style={loginScreenStyles.container} testID='server_library_screen'>
			<ServerLibrary />
		</SafeAreaView>
	)
}

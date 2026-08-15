import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import ServerLibrary from '../../components/Login/server-library'

export default function ServerLibraryScreen(): React.JSX.Element {
	return (
		<SafeAreaView style={{ flex: 1 }} testID='server_library_screen'>
			<ServerLibrary />
		</SafeAreaView>
	)
}

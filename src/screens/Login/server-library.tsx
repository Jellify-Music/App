import React from 'react'
import ServerLibrary from '../../components/Login/server-library'
import { LoginContainer } from '../../providers/Login'

export default function ServerLibraryScreen(): React.JSX.Element {
	return (
		<LoginContainer>
			<ServerLibrary />
		</LoginContainer>
	)
}

import React from 'react'
import { LoginContainer } from '../../providers/Login'
import ServerAuthentication from '../../components/ServerAuthentication'

export default function ServerAuthenticationScreen(): React.JSX.Element {
	return (
		<LoginContainer>
			<ServerAuthentication />
		</LoginContainer>
	)
}

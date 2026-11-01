import { LoginContainer } from '../../providers/Login'
import ServerAddress from '../../components/ServerAddress'
import React from 'react'

export default function ServerAddressScreen(): React.JSX.Element {
	return (
		<LoginContainer>
			<ServerAddress />
		</LoginContainer>
	)
}

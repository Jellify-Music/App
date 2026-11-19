import QuickConnect from '../../components/Login/quick-connect'
import { LoginContainer } from '../../providers/Login'
import React from 'react'

export default function QuickConnectScreen(): React.JSX.Element {
	return (
		<LoginContainer>
			<QuickConnect />
		</LoginContainer>
	)
}

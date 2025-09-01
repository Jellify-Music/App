import 'react-native'
import React from 'react'
import { render } from '@testing-library/react-native'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PlayerProvider } from '../../src/providers/Player'
import { JellifyProvider } from '../../src/providers'

const queryClient = new QueryClient()

test(`${PlayerProvider.name} renders correctly`, () => {
	render(
		<QueryClientProvider client={queryClient}>
			<JellifyProvider>
				<PlayerProvider />
			</JellifyProvider>
		</QueryClientProvider>,
	)
})

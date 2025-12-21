import 'react-native'
import React from 'react'
import { render, waitFor } from '@testing-library/react-native'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PlayerProvider } from '../../src/providers/Player'

const queryClient = new QueryClient()

test(`${PlayerProvider.name} renders correctly`, async () => {
	const { toJSON } = render(
		<QueryClientProvider client={queryClient}>
			<PlayerProvider />
		</QueryClientProvider>,
	)
	await waitFor(() => expect(toJSON()).toBeDefined())
})

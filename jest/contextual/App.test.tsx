import 'react-native'
import React from 'react'
import App from '../../App'

import { render, waitFor } from '@testing-library/react-native'

test(`${App.name} renders successfully`, async () => {
	render(<App />)

	// Wait for async initialization to complete
	await waitFor(
		() => {
			// Just wait for any pending state updates to settle
		},
		{ timeout: 5000 },
	)
})

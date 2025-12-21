import 'react-native'
import React from 'react'
import App from '../../App'

import { render, waitFor } from '@testing-library/react-native'

test(`${App.name} renders successfully`, async () => {
	const { toJSON } = render(<App />)
	await waitFor(() => expect(toJSON()).not.toBeNull())
})

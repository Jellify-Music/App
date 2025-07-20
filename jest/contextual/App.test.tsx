import 'react-native'
import React from 'react'
import App from '../../App'

import { render } from '@testing-library/react-native'

test(`${App.name} renders successfully`, () => {
	render(<App />)
})

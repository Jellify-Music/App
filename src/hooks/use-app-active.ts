import { useEffect, useState } from 'react'
import { AppState } from 'react-native'

export default function useAppActive() {
	const [isActive, setIsActive] = useState(AppState.currentState === 'active')

	useEffect(() => {
		const appStateListener = AppState.addEventListener('change', (state) =>
			setIsActive(state === 'active'),
		)

		return () => appStateListener.remove()
	}, [])

	return isActive
}

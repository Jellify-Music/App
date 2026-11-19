import { useEffect } from 'react'
import { AppState } from 'react-native'
import { clearImageMemoryCache } from '../services/storage/images'

/**
 * Releases decoded images from memory when the OS reports memory pressure
 */
export default function useImageMemoryWarning() {
	useEffect(() => {
		const memoryWarningListener = AppState.addEventListener('memoryWarning', () =>
			clearImageMemoryCache(),
		)

		return () => memoryWarningListener.remove()
	}, [])
}

import { useCallback } from 'react'
import Toast from 'react-native-toast-message'

import { formatBytes } from '../../../utils/formatting/bytes'

export const useDeletionToast = () =>
	useCallback((message: string, freedBytes: number) => {
		Toast.show({
			type: 'success',
			text1: message,
			text2: `Freed ${formatBytes(freedBytes)}`,
		})
	}, [])

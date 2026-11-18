import Toast from 'react-native-toast-message'

import { formatBytes } from '../formatting/bytes'
import i18n from '../../i18n'

export const useDeletionToast = () => (message: string, freedBytes: number) => {
	Toast.show({
		type: 'success',
		text1: message,
		text2: i18n.t('storage.freed', { size: formatBytes(freedBytes) }),
	})
}

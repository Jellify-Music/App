import { Platform } from 'react-native'

export const canUseFormSheet =
	(Platform.OS === 'android' && Platform.Version >= 35) || Platform.OS === 'ios'

export const bottomSheetPresentation: 'formSheet' | 'modal' = canUseFormSheet
	? 'formSheet'
	: 'modal'

export const playerSheetPresentation: 'formSheet' | 'modal' =
	canUseFormSheet && Platform.OS !== 'ios' ? 'formSheet' : 'modal'

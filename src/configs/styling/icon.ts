import { Platform } from 'react-native'
import { AppIconConfig } from '../../types/Artwork/icon'
import TealIcon from '../../../ios/teal-icon-composer.icon/Assets/JellifyFinalGradientTealPurpleFinal 2.svg'
import TransIcon from '../../../ios/trans-icon-composer.icon/Assets/Plain_JellifyFinalGradientTrans.svg'
import TransIconDark from '../../../ios/trans-icon-composer.icon/Assets/Plain_JellifyFinalGradientTransDark.svg'
import PrideIcon from '../../../ios/gay-icon-composer.icon/Assets/Plain_JellifyFinalGradientGay.svg'

export const APP_ICONS: AppIconConfig[] = [
	{
		value: 'Default',
		label: 'Jellify',
		preview: { light: TealIcon, dark: TealIcon },
		nativeName: 'Default',
	},
	{
		value: 'Trans',
		label: 'Trans',
		preview: { light: TransIcon, dark: TransIconDark },
		nativeName: Platform.select({ ios: 'trans-icon-composer', default: 'Trans' }),
	},
	{
		value: 'Pride',
		label: 'Pride',
		preview: { light: PrideIcon, dark: PrideIcon },
		nativeName: Platform.select({ ios: 'gay-icon-composer', default: 'Pride' }),
	},
]

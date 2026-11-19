import { createNativeStackNavigator } from '@react-navigation/native-stack'
import MultipleArtistsSheet from '../Context/multiple-artists'
import { PlayerParamList } from './types'
import { bottomSheetPresentation } from '../../utils/navigating/form-sheet'
import CastDialogScreen from '../CastDialog'
import CastDialogHeaderRight from '../CastDialog/header'
import PlayerScreen from '../../components/Player'
import i18n from '../../i18n'

const PlayerStack = createNativeStackNavigator<PlayerParamList>({
	initialRouteName: 'PlayerScreen',
	screens: {
		PlayerScreen: {
			screen: PlayerScreen,
			options: {
				headerShown: false,
				headerTitle: i18n.t('navigation.player'),
			},
		},
		MultipleArtistsSheet: {
			screen: MultipleArtistsSheet,
			options: {
				presentation: bottomSheetPresentation,
				sheetAllowedDetents: 'fitToContents',
				sheetGrabberVisible: true,
				headerShown: false,
			},
		},
		CastDialog: {
			screen: CastDialogScreen,
			options: {
				headerTitle: i18n.t('navigation.audioDevices'),
				headerRight: CastDialogHeaderRight,
				presentation: bottomSheetPresentation,
				sheetAllowedDetents: 'fitToContents',
				sheetGrabberVisible: true,
			},
		},
	},
})

export default PlayerStack

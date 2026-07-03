import PlayerScreen from '../../components/Player'
import Queue from '../../components/Queue'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import MultipleArtistsSheet from '../Context/multiple-artists'
import { PlayerParamList } from './types'
import Lyrics from '../../components/Player/components/lyrics'
import { bottomSheetPresentation } from '../../utils/navigating/form-sheet'
import CastDialogScreen from '../CastDialog'
import CastDialogHeaderRight from '../CastDialog/header'

const PlayerStack = createNativeStackNavigator<PlayerParamList>({
	initialRouteName: 'PlayerScreen',
	screenOptions: {
		headerTitleAlign: 'center',
		headerTitleStyle: {
			fontFamily: 'Figtree-Bold',
			fontSize: 18,
		},
	},
	screens: {
		PlayerScreen: {
			screen: PlayerScreen,
			options: {
				headerShown: false,
				headerTitle: 'Player',
			},
		},
		QueueScreen: {
			screen: Queue,
			options: {
				headerTitle: 'Queue',
			},
		},
		LyricsScreen: {
			screen: Lyrics,
			options: {
				headerTitle: 'Lyrics',
				headerShown: false,
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
				headerTitle: 'Audio Devices',
				headerRight: CastDialogHeaderRight,
				presentation: bottomSheetPresentation,
				sheetAllowedDetents: 'fitToContents',
				sheetGrabberVisible: true,
			},
		},
	},
})

export default PlayerStack

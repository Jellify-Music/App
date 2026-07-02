import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Index from '../../components/Discover/component'
import DiscoverAlbums from './albums'
import PublicPlaylists from './playlists'
import SuggestedArtists from './artists'
import DiscoverStackParamList, { DiscoverAlbumScreenType } from './types'
import { BaseStackScreens } from '../base-stack'
import useJellifyStore from '../../stores/auth'

const DiscoverStack = createNativeStackNavigator<DiscoverStackParamList>({
	initialRouteName: 'Discover',
	screenOptions: {
		headerTitleAlign: 'center',
		headerTitleStyle: {
			fontFamily: 'Figtree-Bold',
			fontSize: 18,
		},
	},
	screens: {
		Discover: {
			screen: Index,
		},
		...BaseStackScreens,
		Albums: {
			screen: DiscoverAlbums,
			options: ({ route }) => ({
				title: getAlbumScreenTitle(route.params.type),
			}),
		},
		PublicPlaylists: {
			screen: PublicPlaylists,
			options: {
				title: `Playlists on ${useJellifyStore.getState().server?.name || 'Jellyfin'}`,
			},
		},
		SuggestedArtists: {
			screen: SuggestedArtists,
			options: {
				title: 'Artists for You',
			},
		},
	},
})

function getAlbumScreenTitle(type: DiscoverAlbumScreenType) {
	switch (type) {
		case DiscoverAlbumScreenType.RecentlyAdded:
			return 'Recently Added'
		case DiscoverAlbumScreenType.Suggested:
			return 'More from the Vault'
		default:
			return 'Albums on Jellyfin'
	}
}

export default DiscoverStack

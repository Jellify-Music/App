import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Index from '../../components/Discover/component'
import DiscoverAlbums from './albums'
import PublicPlaylists from './playlists'
import SuggestedArtists from './artists'
import DiscoverStackParamList, { DiscoverAlbumScreenType } from './types'
import { BaseStackScreens } from '../base-stack'
import useJellifyStore from '../../stores'

const DiscoverStack = createNativeStackNavigator<DiscoverStackParamList>({
	initialRouteName: 'Discover',
	screens: {
		Discover: {
			screen: Index,
			options: {
				headerTitleAlign: 'center',
				headerTitleStyle: {
					fontFamily: 'Figtree-Bold',
				},
			},
		},
		...BaseStackScreens,
		Albums: {
			screen: DiscoverAlbums,
			options: ({ route }) => ({
				title: getAlbumScreenTitle(route.params.type),
				headerTitleAlign: 'center',
				headerTitleStyle: {
					fontFamily: 'Figtree-Bold',
				},
			}),
		},
		PublicPlaylists: {
			screen: PublicPlaylists,
			options: {
				title: `Playlists on ${useJellifyStore.getState().server?.name || 'Jellyfin'}`,
				headerTitleAlign: 'center',
				headerTitleStyle: {
					fontFamily: 'Figtree-Bold',
				},
			},
		},
		SuggestedArtists: {
			screen: SuggestedArtists,
			options: {
				title: 'Artists for You',
				headerTitleAlign: 'center',
				headerTitleStyle: {
					fontFamily: 'Figtree-Bold',
				},
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

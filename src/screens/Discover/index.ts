import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Index from '../../components/Discover'
import DiscoverAlbums from './albums'
import PublicPlaylists from './playlists'
import SuggestedArtists from './artists'
import DiscoverStackParamList, { DiscoverAlbumScreenType } from './types'
import { BaseStackScreens } from '../base-stack'
import { stackScreenOptions } from '../navigation'
import { getPublicServerInfo } from '../../api/queries/public-server-info'
import i18n from '../../i18n'

const DiscoverStack = createNativeStackNavigator<DiscoverStackParamList>({
	initialRouteName: 'Discover',
	screenOptions: stackScreenOptions,
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
			options: () => ({
				title: i18n.t('discover.playlistsOn', {
					server: getPublicServerInfo()?.ServerName ?? 'Jellyfin',
				}),
			}),
		},
		SuggestedArtists: {
			screen: SuggestedArtists,
			options: {
				title: i18n.t('discover.artistsForYou'),
			},
		},
	},
})

function getAlbumScreenTitle(type: DiscoverAlbumScreenType) {
	switch (type) {
		case DiscoverAlbumScreenType.RecentlyAdded:
			return i18n.t('discover.recentlyAdded')
		case DiscoverAlbumScreenType.Suggested:
			return i18n.t('discover.moreFromTheVault')
		default:
			return i18n.t('discover.albumsOn', {
				server: getPublicServerInfo()?.ServerName ?? 'Jellyfin',
			})
	}
}

export default DiscoverStack

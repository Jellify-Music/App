import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import DiscographyTab from '../../components/Artist/tabs/discography'
import TracksTab from '../../components/Artist/tabs/tracks'
import PlaylistsTab from '../../components/Artist/tabs/playlists'

/**
 * The artist's discography, tracks, and the playlists they're on. The navigator keeps track of which is showing, but doesn't
 * draw the tab bar: each tab's list starts with the artist's header and the tab bar (see
 * `ArtistListHeader`), so they scroll away with it.
 */
const ArtistTabs = createMaterialTopTabNavigator({
	tabBar: () => null,
	screenOptions: {
		swipeEnabled: false, // swiping would conflict with swipeable rows
		animationEnabled: false, // the header would otherwise slide sideways with the list
		lazy: true,
	},
	screens: {
		Discography: DiscographyTab,
		Tracks: TracksTab,
		Playlists: PlaylistsTab,
	},
})

/** The artist tabs as a component, as they make up the artist screen rather than being a part of one */
export const ArtistTabsNavigation = ArtistTabs.getComponent()

export default ArtistTabs

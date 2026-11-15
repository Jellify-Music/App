import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import DiscographyTab from '../../components/Artist/tabs/discography'
import TracksTab from '../../components/Artist/tabs/tracks'
import InfoTab, { useHasArtistInfo } from '../../components/Artist/tabs/info'

/**
 * The artist's discography, tracks and info. The navigator keeps track of which is showing, but doesn't
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
		// only when the server has something to say about the artist
		Info: { screen: InfoTab, if: useHasArtistInfo },
	},
})

/** The artist tabs as a component, as they make up the artist screen rather than being a part of one */
export const ArtistTabsNavigation = ArtistTabs.getComponent()

export default ArtistTabs

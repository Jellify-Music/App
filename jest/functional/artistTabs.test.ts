import ArtistTabs from '../../src/screens/Artist/tabs'

// The artist page's tabs are defined with React Navigation's static API, like the app's other
// navigators (see src/screens/README.md), so this checks the configuration rather than a render
describe('artist tabs', () => {
	const config = ArtistTabs.config as unknown as {
		screens: Record<string, unknown>
		tabBar: () => unknown
		screenOptions: { lazy: boolean; swipeEnabled: boolean; animationEnabled: boolean }
	}

	it('are the discography, the tracks and the playlists, in that order', () => {
		expect(Object.keys(config.screens)).toEqual(['Discography', 'Tracks', 'Playlists'])
	})

	// each list starts with the header and the tab bar, so they scroll away together
	it('leave the tab bar to the lists, rather than drawing it above them', () => {
		expect(config.tabBar()).toBeNull()
	})

	it('only mount a tab when it is opened, and neither swipe nor slide between them', () => {
		expect(config.screenOptions).toEqual({
			lazy: true,
			swipeEnabled: false,
			animationEnabled: false,
		})
	})
})

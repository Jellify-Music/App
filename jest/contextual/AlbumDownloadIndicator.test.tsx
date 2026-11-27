import { act, render } from '@testing-library/react-native'
import { TamaguiProvider } from 'tamagui'
import config from '../../src/configs/tamagui.config'
import AlbumDownloadIndicator from '../../src/components/Downloads/album-download-indicator'
import useDownloadingAlbumsStore from '../../src/stores/downloading-albums'

// The display is the one tracks use: only what it is told to draw is checked here
jest.mock('../../src/components/Global/components/DownloadIndicator', () => {
	const { View } = require('react-native')
	return {
		DownloadStatus: ({
			isDownloaded,
			isDownloading,
			progress,
			size,
		}: {
			isDownloaded: boolean
			isDownloading: boolean
			progress: number
			size: string
		}) => (
			<View
				testID='status'
				accessibilityValue={{
					now: progress,
					text: `${isDownloaded}|${isDownloading}|${size}`,
				}}
			/>
		),
	}
})

const album = { Id: 'a', ChildCount: 12 }

const renderIndicator = (item: { Id?: string; ChildCount?: number | null }) =>
	render(
		<TamaguiProvider config={config} defaultTheme='haze_dark'>
			<AlbumDownloadIndicator album={item} />
		</TamaguiProvider>,
	)

describe('an album, as a track shows its download', () => {
	beforeEach(() => useDownloadingAlbumsStore.setState({ progress: {}, downloaded: {} }))

	it('shows nothing for an album that is not downloading, and has none of it downloaded', async () => {
		useDownloadingAlbumsStore.setState({ progress: { other: 0.5 }, downloaded: { other: 12 } })

		expect((await renderIndicator(album)).queryByTestId('status')).toBeNull()
		expect((await renderIndicator({})).queryByTestId('status')).toBeNull()
	})

	it('shows the circle, at its progress, while the album downloads', async () => {
		useDownloadingAlbumsStore.setState({ progress: { a: 0.4 } })

		const status = (await renderIndicator(album)).getByTestId('status')

		expect(status.props.accessibilityValue.now).toBe(0.4)
		expect(status.props.accessibilityValue.text).toBe('false|true|4')
	})

	it('shows it is downloaded once every track of the album is', async () => {
		useDownloadingAlbumsStore.setState({ downloaded: { a: 12 } })

		const status = (await renderIndicator(album)).getByTestId('status')

		expect(status.props.accessibilityValue.text).toBe('true|false|4')
	})

	it('shows nothing for an album that is only partly downloaded', async () => {
		useDownloadingAlbumsStore.setState({ downloaded: { a: 7 } })

		expect((await renderIndicator(album)).queryByTestId('status')).toBeNull()
	})

	it('shows nothing when it is not known how many tracks the album has', async () => {
		useDownloadingAlbumsStore.setState({ downloaded: { a: 12 } })

		expect((await renderIndicator({ Id: 'a' })).queryByTestId('status')).toBeNull()
	})

	it('shows nothing, and takes no room, for an album that is queued but has not started', async () => {
		useDownloadingAlbumsStore.setState({ progress: { a: 0 } })

		expect((await renderIndicator(album)).queryByTestId('status')).toBeNull()
	})

	it('shows the circle, not the tick, while an album that is downloaded is downloaded again', async () => {
		useDownloadingAlbumsStore.setState({ progress: { a: 0.1 }, downloaded: { a: 12 } })

		const status = (await renderIndicator(album)).getByTestId('status')

		expect(status.props.accessibilityValue.text).toBe('false|true|4')
	})

	it('goes from the circle to the tick as the album finishes', async () => {
		useDownloadingAlbumsStore.setState({ progress: { a: 0.9 }, downloaded: { a: 11 } })

		const screen = await renderIndicator(album)
		expect(screen.getByTestId('status').props.accessibilityValue.text).toBe('false|true|4')

		await act(async () => {
			useDownloadingAlbumsStore.getState().set({})
			useDownloadingAlbumsStore.getState().setDownloaded({ a: 12 })
		})

		expect(screen.getByTestId('status').props.accessibilityValue.text).toBe('true|false|4')
	})
})

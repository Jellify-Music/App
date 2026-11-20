import { act, render } from '@testing-library/react-native'
import { TamaguiProvider } from 'tamagui'
import config from '../../src/configs/tamagui.config'
import AlbumDownloadIndicator from '../../src/components/Downloads/album-download-indicator'
import useDownloadingAlbumsStore from '../../src/stores/downloading-albums'

jest.mock(
	'../../src/components/Global/components/DownloadIndicator/circular-progress-indicator',
	() => {
		const { View } = require('react-native')
		return {
			__esModule: true,
			default: ({ progress, size }: { progress: number; size: number }) => (
				<View testID='circle' accessibilityValue={{ now: progress, max: size }} />
			),
		}
	},
)

const renderIndicator = (albumId: string | undefined) =>
	render(
		<TamaguiProvider config={config} defaultTheme='haze_dark'>
			<AlbumDownloadIndicator albumId={albumId} />
		</TamaguiProvider>,
	)

describe('the circle on an album that is downloading', () => {
	beforeEach(() => useDownloadingAlbumsStore.setState({ progress: {} }))

	it('shows nothing for an album that is not downloading, or without an ID', async () => {
		useDownloadingAlbumsStore.setState({ progress: { other: 0.5 } })

		const album = await renderIndicator('a')
		expect(album.queryByTestId('circle')).toBeNull()

		const none = await renderIndicator(undefined)
		expect(none.queryByTestId('circle')).toBeNull()
	})

	it('shows the album own progress, at the size a track shows its own', async () => {
		useDownloadingAlbumsStore.setState({ progress: { a: 0.4, b: 0.9 } })

		const screen = await renderIndicator('a')

		const circle = screen.getByTestId('circle')
		expect(circle.props.accessibilityValue.now).toBe(0.4)
		expect(circle.props.accessibilityValue.max).toBe(12)
	})

	it('follows the album as it goes, and goes when it has finished', async () => {
		useDownloadingAlbumsStore.setState({ progress: { a: 0.4 } })

		const screen = await renderIndicator('a')

		await act(async () => useDownloadingAlbumsStore.getState().set({ a: 0.8 }))
		expect(screen.getByTestId('circle').props.accessibilityValue.now).toBe(0.8)

		await act(async () => useDownloadingAlbumsStore.getState().set({}))
		expect(screen.queryByTestId('circle')).toBeNull()
	})
})

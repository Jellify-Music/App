import { fireEvent, render } from '@testing-library/react-native'
import { TamaguiProvider } from 'tamagui'
import config from '../../src/configs/tamagui.config'
import DownloadButton from '../../src/components/Global/components/download-button'
import type {
	CollectionDownload,
	CollectionDownloadState,
} from '../../src/hooks/downloads/collection'

jest.mock(
	'../../src/components/Global/components/DownloadIndicator/circular-progress-indicator',
	() => {
		const { View } = require('react-native')
		return {
			__esModule: true,
			default: ({ progress }: { progress: number }) => (
				<View testID='ring' accessibilityValue={{ now: progress }} />
			),
		}
	},
)

const collection = (
	state: CollectionDownloadState,
	overrides: Partial<CollectionDownload> = {},
): CollectionDownload => ({
	state,
	progress: 0.4,
	download: jest.fn(),
	cancel: jest.fn(),
	remove: jest.fn(),
	...overrides,
})

const renderButton = (c: CollectionDownload) =>
	render(
		<TamaguiProvider config={config} defaultTheme='haze_dark'>
			<DownloadButton collection={c} />
		</TamaguiProvider>,
	)

describe('the download button', () => {
	it.each(['loading', 'empty'] as const)('offers nothing while %s', async (state) => {
		const screen = await renderButton(collection(state))

		expect(screen.queryByTestId('download-button')).toBeNull()
		expect(screen.queryByTestId('stop-download-button')).toBeNull()
		expect(screen.queryByTestId('remove-downloads-button')).toBeNull()
	})

	it('downloads when it is ready and pressed', async () => {
		const c = collection('ready')
		const screen = await renderButton(c)

		await fireEvent.press(screen.getByTestId('download-button'))

		expect(c.download).toHaveBeenCalledTimes(1)
	})

	it('shows how far along it is, and stops the download when pressed', async () => {
		const c = collection('downloading')
		const screen = await renderButton(c)

		expect(screen.getByTestId('ring').props.accessibilityValue.now).toBe(0.4)

		const stop = screen.getByTestId('stop-download-button')
		expect(stop.props['aria-label']).toBe('Stop downloading')

		await fireEvent.press(stop)

		expect(c.cancel).toHaveBeenCalledTimes(1)
		expect(c.download).not.toHaveBeenCalled()
	})

	it('can be stopped before there is any progress to show', async () => {
		const c = collection('downloading', { progress: 0 })
		const screen = await renderButton(c)

		expect(screen.queryByTestId('ring')).toBeNull()

		await fireEvent.press(screen.getByTestId('stop-download-button'))

		expect(c.cancel).toHaveBeenCalledTimes(1)
	})

	it('removes the downloads when it is downloaded and pressed', async () => {
		const c = collection('downloaded')
		const screen = await renderButton(c)

		await fireEvent.press(screen.getByTestId('remove-downloads-button'))

		expect(c.remove).toHaveBeenCalledTimes(1)
	})
})

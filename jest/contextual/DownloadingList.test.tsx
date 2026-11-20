import { render } from '@testing-library/react-native'
import { TamaguiProvider } from 'tamagui'
import config from '../../src/configs/tamagui.config'
import DownloadingList from '../../src/components/Downloads/downloading-list'
import type { DownloadGroup } from '../../src/utils/download-groups'

jest.mock('../../src/components/Global/components/image', () => {
	const { View } = require('react-native')
	return { __esModule: true, default: () => <View testID='cover' /> }
})
jest.mock(
	'../../src/components/Global/components/DownloadIndicator/circular-progress-indicator',
	() => {
		const { View } = require('react-native')
		return {
			__esModule: true,
			default: ({ progress }: { progress: number }) => (
				<View testID='progress-circle' accessibilityValue={{ now: progress }} />
			),
		}
	},
)

const group = (overrides: Partial<DownloadGroup>): DownloadGroup => ({
	key: 'a',
	albumId: 'a',
	title: 'Echo',
	artist: 'Of Mice & Men',
	total: 10,
	done: 4,
	progress: 0.45,
	trackIds: [],
	queuedAt: 0,
	...overrides,
})

const renderList = (groups: DownloadGroup[]) =>
	render(
		<TamaguiProvider config={config} defaultTheme='haze_dark'>
			<DownloadingList groups={groups} />
		</TamaguiProvider>,
	)

describe('the list of albums downloading', () => {
	it('shows each album with its artist, how many tracks are done, and a circle of its own', async () => {
		const screen = await renderList([
			group({}),
			group({ key: 'b', albumId: 'b', title: 'Tether', done: 0, progress: 0.1, total: 12 }),
		])

		expect(screen.getByText('Echo')).toBeTruthy()
		expect(screen.getByText('4 of 10')).toBeTruthy()
		expect(screen.getByText('Tether')).toBeTruthy()
		expect(screen.getByText('0 of 12')).toBeTruthy()

		const circles = screen.getAllByTestId('progress-circle')
		expect(circles.map((circle) => circle.props.accessibilityValue.now)).toEqual([0.45, 0.1])
	})

	it('says what it is for anyone who cannot see it', async () => {
		const screen = await renderList([group({})])

		const row = screen.getByTestId('downloading-a')

		expect(row.props['aria-label']).toBe('Echo, 4 of 10 tracks downloaded')
		expect(row.props['aria-valuenow']).toBe(45)
	})

	it('leaves out the artist when it is not known', async () => {
		const screen = await renderList([group({ artist: undefined })])

		expect(screen.queryByText('Of Mice & Men')).toBeNull()
	})

	it('shows nothing when nothing is downloading', async () => {
		const screen = await renderList([])

		expect(screen.queryByTestId('downloading-list')).toBeNull()
	})
})

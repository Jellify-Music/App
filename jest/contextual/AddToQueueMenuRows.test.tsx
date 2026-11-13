import React from 'react'
import { fireEvent, render } from '@testing-library/react-native'
import { TamaguiProvider } from 'tamagui'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import config from '../../src/configs/tamagui.config'
import AddToQueueMenuRows from '../../src/components/Context/components/queue'
import { addToQueue } from '../../src/player/queuing'
import { QueuingType } from '../../src/enums/queuing-type'

jest.mock('../../src/player/queuing', () => ({
	addToQueue: jest.fn(),
}))

const tracks: BaseItemDto[] = [
	{ Id: 't1', Name: 'Track One', Type: 'Audio' },
	{ Id: 't2', Name: 'Track Two', Type: 'Audio' },
]

describe('AddToQueueMenuRows', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	const renderRows = () =>
		render(
			<TamaguiProvider config={config} defaultTheme='haze_dark'>
				<AddToQueueMenuRows tracks={tracks} />
			</TamaguiProvider>,
		)

	it('labels the queuing rows Play Next and Play Later', async () => {
		const screen = await renderRows()

		expect(screen.getByText('Play Next')).toBeTruthy()
		expect(screen.getByText('Play Later')).toBeTruthy()
		expect(screen.queryByText('Add to Queue')).toBeNull()
	})

	it.each([
		['Play Next', QueuingType.PlayNext],
		['Play Later', QueuingType.PlayLater],
	] as const)('queues all tracks when %s is pressed', async (label, queuingType) => {
		const screen = await renderRows()

		await fireEvent.press(screen.getByText(label))

		expect(addToQueue).toHaveBeenCalledTimes(1)
		expect(addToQueue).toHaveBeenCalledWith({ tracks, queuingType })
	})
})

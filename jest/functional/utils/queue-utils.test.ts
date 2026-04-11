/* eslint-disable @typescript-eslint/no-explicit-any */
import 'react-native'
import { PlayerQueue } from 'react-native-nitro-player'
import {
	filterTracksOnNetworkStatus,
	clearPlaylists,
} from '../../../src/hooks/player/functions/utils/queue'

jest.mock('../../../src/components/Network/internetConnectionWatcher', () => ({
	networkStatusTypes: {
		ONLINE: 'ONLINE',
		DISCONNECTED: 'DISCONNECTED',
	},
}))

import { networkStatusTypes } from '../../../src/components/Network/internetConnectionWatcher'

const createItem = (id: string) => ({ Id: id, Name: `Item ${id}` })
const createDownload = (trackId: string) => ({ trackId })

describe('filterTracksOnNetworkStatus', () => {
	const items = [createItem('1'), createItem('2'), createItem('3')]
	const downloads = [createDownload('1'), createDownload('3')]

	it('returns all items when ONLINE', () => {
		const result = filterTracksOnNetworkStatus(
			networkStatusTypes.ONLINE as networkStatusTypes,
			items as any,
			downloads as any,
		)
		expect(result).toEqual(items)
	})

	it('returns all items when status is undefined', () => {
		const result = filterTracksOnNetworkStatus(undefined, items as any, downloads as any)
		expect(result).toEqual(items)
	})

	it('returns all items when status is null', () => {
		const result = filterTracksOnNetworkStatus(null, items as any, downloads as any)
		expect(result).toEqual(items)
	})

	it('filters to only downloaded items when DISCONNECTED', () => {
		const result = filterTracksOnNetworkStatus(
			networkStatusTypes.DISCONNECTED as networkStatusTypes,
			items as any,
			downloads as any,
		)
		expect(result).toEqual([createItem('1'), createItem('3')])
	})

	it('returns empty array when disconnected and no downloads match', () => {
		const result = filterTracksOnNetworkStatus(
			networkStatusTypes.DISCONNECTED as networkStatusTypes,
			items as any,
			[] as any,
		)
		expect(result).toEqual([])
	})
})

describe('clearPlaylists', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('deletes all playlists', () => {
		;(PlayerQueue.getAllPlaylists as jest.Mock).mockReturnValue([
			{ id: 'playlist-1' },
			{ id: 'playlist-2' },
		])

		clearPlaylists()

		expect(PlayerQueue.deletePlaylist).toHaveBeenCalledTimes(2)
		expect(PlayerQueue.deletePlaylist).toHaveBeenCalledWith('playlist-1')
		expect(PlayerQueue.deletePlaylist).toHaveBeenCalledWith('playlist-2')
	})

	it('handles empty playlist list', () => {
		;(PlayerQueue.getAllPlaylists as jest.Mock).mockReturnValue([])

		clearPlaylists()

		expect(PlayerQueue.deletePlaylist).not.toHaveBeenCalled()
	})
})

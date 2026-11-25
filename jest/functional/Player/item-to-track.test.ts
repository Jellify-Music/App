import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import { DownloadedTrack } from 'react-native-nitro-player'
import { mapDtoToTrack } from '../../../src/utils/mapping/item-to-track'

jest.mock('../../../src/stores/auth/utils', () => ({
	getApi: jest.fn().mockReturnValue({
		basePath: 'https://jellyfin.example.com',
		accessToken: 'token',
	}),
}))

jest.mock('../../../src/api/queries/image/utils', () => ({
	getItemImageUrl: jest.fn().mockReturnValue('https://jellyfin.example.com/image'),
}))

describe('mapDtoToTrack', () => {
	const item: BaseItemDto = {
		Id: 'track-1',
		Name: 'Track',
		Type: BaseItemKind.Audio,
		RunTimeTicks: 0,
	}

	it('leaves the URL empty for streamed tracks so it is resolved later', () => {
		const track = mapDtoToTrack(item, new Map())

		expect(track.url).toBe('')
	})

	it('uses an empty url for downloaded tracks', () => {
		const downloaded = {
			trackId: 'track-1',
			localPath: '/downloads/track-1.mp3',
			originalTrack: { extraPayload: {} },
		} as unknown as DownloadedTrack

		const track = mapDtoToTrack(item, new Map([['track-1', downloaded]]))

		expect(track.url).toMatch('')
		expect(track.url).not.toContain('file://')
	})
})

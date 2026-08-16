import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import { mapDtoToTrack } from '../../src/utils/mapping/item-to-track'
import { getApi } from '../../src/stores/auth/utils'

jest.mock('../../src/stores/auth/utils', () => ({
	getApi: jest.fn(),
}))

jest.mock('../../src/api/queries/image/utils', () => ({
	getItemImageUrl: jest.fn().mockReturnValue('https://example.com/artwork.jpg'),
}))

describe('mapDtoToTrack', () => {
	const item = {
		Id: 'track-1',
		Name: 'Track 1',
		Type: BaseItemKind.Audio,
		ArtistItems: [],
		RunTimeTicks: 1_800_000_000,
	} as BaseItemDto

	it('places the Jellyfin authorization header in Nitro Player extraPayload', () => {
		;(getApi as jest.Mock).mockReturnValue({
			accessToken: 'access-token',
			authorizationHeader:
				'MediaBrowser Client="Jellify", Device="iPhone", DeviceId="device", Version="1.2.7", Token="access-token"',
		})

		const track = mapDtoToTrack(item, new Map())

		expect(track).not.toHaveProperty('headers')
		expect(track.extraPayload).toMatchObject({
			headers: {
				Authorization:
					'MediaBrowser Client="Jellify", Device="iPhone", DeviceId="device", Version="1.2.7", Token="access-token"',
			},
		})
	})

	it('omits authentication headers when there is no access token', () => {
		;(getApi as jest.Mock).mockReturnValue({
			accessToken: '',
			authorizationHeader: 'MediaBrowser Client="Jellify"',
		})

		const track = mapDtoToTrack(item, new Map())

		expect(track.extraPayload).not.toHaveProperty('headers')
	})
})

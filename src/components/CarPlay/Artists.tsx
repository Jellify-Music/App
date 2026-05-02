import { ensureArtistAlbumsQueryData } from '../../api/queries/artist/queries'
import { formatArtistName } from '../../utils/formatting/artist-names'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { CarPlay, ListTemplate } from 'react-native-carplay'
import uuid from 'react-native-uuid'
import ArtistTemplate from './Artist'

const ArtistsTemplate = (artists: BaseItemDto[]) =>
	new ListTemplate({
		id: uuid.v4(),
		sections: [
			{
				items:
					artists?.map((artist) => {
						return {
							id: artist.Id!,
							text: formatArtistName(artist.Name),
						}
					}) ?? [],
			},
		],
		onItemSelect: async ({ index }) => {
			const artist = artists[index]

			const albums = await ensureArtistAlbumsQueryData(artist)

			CarPlay.pushTemplate(ArtistTemplate(artist, albums), true)
		},
	})

export default ArtistsTemplate

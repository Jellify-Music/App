import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { CarPlay } from 'react-native-carplay'
import { ListTemplate } from 'react-native-carplay/lib/templates/ListTemplate'
import AlbumTemplate from './Album'
import { ensureAlbumDiscsQuery } from '../../api/queries/album'

const ArtistTemplate = (artist: BaseItemDto, albums: BaseItemDto[]) =>
	new ListTemplate({
		title: artist.Name ?? 'Unknown Artist',
		sections: [
			{
				items: albums.map(({ Name }) => ({
					text: Name ?? 'Untitled Album',
				})),
			},
		],
		onItemSelect: async ({ templateId, index }) => {
			const selectedAlbum = albums[index]

			const albumDiscs = await ensureAlbumDiscsQuery(selectedAlbum)

			CarPlay.pushTemplate(AlbumTemplate(selectedAlbum, albumDiscs), true)
		},
	})

export default ArtistTemplate

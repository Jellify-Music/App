import { BaseItemDto, BaseItemKind, ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { CarPlay, ListTemplate } from 'react-native-carplay'
import uuid from 'react-native-uuid'
import CarPlayNowPlaying from './NowPlaying'
import { Queue } from '../../services/types/queue-item'
import AlbumTemplate from './Album'
import { loadNewQueue } from '../../hooks/player/functions/queue'
import { ensureAlbumDiscsQuery } from '../../api/queries/album'
import { formatArtistNames } from '../../utils/formatting/artist-names'
import { getItemImageUrl } from '../../api/queries/image/utils'

const TracksTemplate = (items: BaseItemDto[], queuingRef: Queue) =>
	new ListTemplate({
		id: uuid.v4(),
		sections: [
			{
				items: items.map((item) => {
					const isAlbum = item.Type === BaseItemKind.MusicAlbum

					return {
						id: item.Id!,
						text: item.Name ?? `Untitled ${isAlbum ? 'Album' : 'Track'}`,
						detailText: formatArtistNames(item.Artists),
						browsable: isAlbum,
						accessoryType: isAlbum ? 'disclosure-indicator' : undefined,
					}
				}),
			},
		],
		onItemSelect: async ({ index }) => {
			const item = items[index]

			const tracks = items.filter(({ Type }) => Type === BaseItemKind.Audio)

			const startIndex = tracks.indexOf(item)

			if (startIndex === -1) {
				const albumDiscs = await ensureAlbumDiscsQuery(item)

				CarPlay.pushTemplate(AlbumTemplate(item, albumDiscs), true)
			} else {
				await loadNewQueue({
					index: startIndex,
					tracklist: tracks,
					queue: queuingRef,
					shuffled: false,
					track: item,
					startPlayback: true,
				})

				CarPlay.pushTemplate(CarPlayNowPlaying, true)
			}
		},
	})

export default TracksTemplate

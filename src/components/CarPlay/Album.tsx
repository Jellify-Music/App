import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { CarPlay, ListTemplate } from 'react-native-carplay'
import CarPlayNowPlaying from './NowPlaying'
import { loadQueue } from '../../hooks/player/functions/queue'
import formatArtistNames from '../../utils/formatting/artist-names'

const AlbumTemplate = (
	album: BaseItemDto,
	discs: {
		title: string
		data: BaseItemDto[]
	}[],
) =>
	new ListTemplate({
		title: album.Name ?? 'Untitled Album',
		sections: discs.map((disc) => ({
			sectionIndexTitle: disc.title,
			items: disc.data.map(({ Name, Artists }) => ({
				text: Name ?? 'Untitled Track',
				detailText:
					(Artists?.length ?? 0) > 2 ? formatArtistNames(Artists ?? []) : undefined,
			})),
		})),
		onItemSelect: async ({ templateId, index }) => {
			const tracks = discs.flatMap(({ data }) => data)

			await loadQueue({
				track: tracks[index],
				tracklist: tracks,
				index,
				queue: album,
				startPlayback: true,
			})

			CarPlay.pushTemplate(CarPlayNowPlaying, true)
		},
	})

export default AlbumTemplate

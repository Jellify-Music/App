import { fetchFrequentlyPlayed } from '../../../api/queries/frequents/utils/frequents'
import { fetchRecentlyPlayed, fetchRecentlyAdded } from '../../../api/queries/recents/utils'
import i18n from '../../../i18n'
import { CarPlayListItem, CarPlayListSection, DownloadManager } from 'react-native-nitro-player'
import { albumTiles, songTiles } from './utils/tiles'
import { getApi, getLibrary, getUser } from '../../../stores/auth/utils'
import { opens, problem } from './utils/events'

export default async function home(): Promise<CarPlayListSection[]> {
	const api = getApi()
	const user = getUser()
	const library = getLibrary()

	const [results, downloads] = await Promise.all([
		Promise.allSettled([
			fetchRecentlyPlayed(api, user, library, 0).then((items) =>
				songTiles('picks:recents', i18n.t('home.playItAgain'), items),
			),
			fetchFrequentlyPlayed(api, library, 0).then((items) =>
				songTiles('picks:frequents', i18n.t('home.onRepeat'), items),
			),
			fetchRecentlyAdded(api, library, 0).then(albumTiles),
		]),
		DownloadManager.getAllDownloadedTracks().catch(() => []),
	])
	const tiles = results.flatMap((result) =>
		result.status === 'fulfilled' && result.value ? [result.value] : [],
	)
	const failure = results.find((result) => result.status === 'rejected')
	const shortcuts: CarPlayListItem[] = [
		{
			id: 'picks:favorites',
			title: i18n.t('filters.favorites'),
			image: 'heart.fill',
			template: opens('picks:favorites', i18n.t('filters.favorites')),
		},
	]
	if (downloads.length > 0)
		shortcuts.push({
			id: 'picks:downloads',
			title: i18n.t('car.downloads'),
			subtitle: i18n.t('car.songCount', { count: downloads.length }),
			image: 'arrow.down.circle.fill',
			template: opens('picks:downloads', i18n.t('car.downloads')),
		})
	const sections: CarPlayListSection[] = []
	sections.push({ header: i18n.t('car.yourLibrary'), items: shortcuts })
	if (tiles.length > 0) sections.push({ items: tiles })
	else if (failure) sections.push({ items: [problem(failure.reason)] })
	return sections
}

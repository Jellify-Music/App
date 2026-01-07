import { BaseItemDto, DeviceProfile } from '@jellyfin/sdk/lib/generated-client'
import { getAudioCache, saveAudio } from '../offlineModeUtils'
import { mapDtoToTrack } from '../../../../utils/mappings'
import { getApi } from '../../../../stores'

export default async function saveAudioItem(
	item: BaseItemDto,
	deviceProfile: DeviceProfile,
	autoCached: boolean = false,
) {
	const api = getApi()

	if (!api) return Promise.reject('API Instance not set')

	const downloadedTracks = getAudioCache()

	// If we already have this track downloaded, resolve the promise
	if (downloadedTracks?.filter((download) => download.item.Id === item.Id).length ?? 0 > 0)
		return Promise.resolve(false)

	const track = mapDtoToTrack(item, deviceProfile)

	// TODO: fix download progresses
	return saveAudio(track, () => {}, autoCached)
}

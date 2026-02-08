import _, { isNull, isUndefined } from 'lodash'
import JellifyTrack from '../../../../types/JellifyTrack'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { JellifyDownload } from '../../../../types/JellifyDownload'
import { networkStatusTypes } from '../../../../components/Network/internetConnectionWatcher'
import { QueuingType } from '../../../../enums/queuing-type'

export function buildNewQueue(
	existingQueue: JellifyTrack[],
	tracksToInsert: JellifyTrack[],
	insertIndex: number,
) {
	let newQueue: JellifyTrack[] = []

	if (_.isEmpty(existingQueue)) newQueue = tracksToInsert
	else {
		newQueue = _.cloneDeep(existingQueue).splice(insertIndex, 0, ...tracksToInsert)
	}

	return newQueue
}

export function filterTracksOnNetworkStatus(
	networkStatus: networkStatusTypes | undefined | null,
	queuedItems: BaseItemDto[],
	downloadedTracks: JellifyDownload[],
) {
	if (
		isUndefined(networkStatus) ||
		isNull(networkStatus) ||
		networkStatus === networkStatusTypes.ONLINE
	)
		return queuedItems
	else
		return queuedItems.filter((item) =>
			downloadedTracks.map((download) => download.item.Id).includes(item.Id),
		)
}

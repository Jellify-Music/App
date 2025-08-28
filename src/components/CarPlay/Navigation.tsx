import { TabBarTemplate } from 'react-native-carplay'
import CarPlayHome from './Home'
import CarPlayDiscover from './Discover'
import uuid from 'react-native-uuid'
import { QueueMutation } from '../../providers/Player/interfaces'
import { JellifyLibrary } from '../../types/JellifyLibrary'
import { Api } from '@jellyfin/sdk'
import { JellifyDownload } from '@/src/types/JellifyDownload'
import { networkStatusTypes } from '../Network/internetConnectionWatcher'
import { DownloadQuality } from '../../providers/Settings'
import { DeviceProfile } from '@jellyfin/sdk/lib/generated-client'

const CarPlayNavigation = (
	library: JellifyLibrary,
	loadQueue: (mutation: QueueMutation) => void,
	api: Api | undefined,
	downloadedTracks: JellifyDownload[] | undefined,
	networkStatus: networkStatusTypes | null,
	deviceProfile: DeviceProfile | undefined,
	downloadQuality: DownloadQuality,
) =>
	new TabBarTemplate({
		id: uuid.v4(),
		title: 'Tabs',
		templates: [
			CarPlayHome(
				library,
				loadQueue,
				api,
				downloadedTracks,
				networkStatus,
				deviceProfile,
				downloadQuality,
			),
			CarPlayDiscover,
		],
		onTemplateSelect(template, e) {},
	})

export default CarPlayNavigation

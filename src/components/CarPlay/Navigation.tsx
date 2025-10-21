import { TabBarTemplate } from 'react-native-carplay'
import CarPlayHome from './Home'
import CarPlayDiscover from './Discover'
import uuid from 'react-native-uuid'
import { QueueMutation } from '../../providers/Player/interfaces'
import { JellifyLibrary } from '../../types/JellifyLibrary'
import { Api } from '@jellyfin/sdk'
import { networkStatusTypes } from '../Network/internetConnectionWatcher'
import { DeviceProfile } from '@jellyfin/sdk/lib/generated-client'
import { JellifyUser } from '@/src/types/JellifyUser'

const CarPlayNavigation = (
	library: JellifyLibrary,
	loadQueue: (mutation: QueueMutation) => void,
	api: Api | undefined,
	user: JellifyUser | undefined,
	networkStatus: networkStatusTypes | null,
	deviceProfile: DeviceProfile | undefined,
) =>
	new TabBarTemplate({
		id: uuid.v4(),
		title: 'Tabs',
		templates: [
			CarPlayHome(library, loadQueue, api, user, networkStatus, deviceProfile),
			CarPlayDiscover,
		],
		onTemplateSelect(template, e) {},
	})

export default CarPlayNavigation

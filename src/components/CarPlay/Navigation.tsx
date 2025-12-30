import { TabBarTemplate } from 'react-native-carplay'
import CarPlayHome from './Home'
import CarPlayDiscover from './Discover'
import uuid from 'react-native-uuid'
import { QueueMutation } from '../../providers/Player/interfaces'
import { JellifyLibrary } from '../../types/JellifyLibrary'
import { JellifyUser } from '@/src/types/JellifyUser'

const CarPlayNavigation = (
	library: JellifyLibrary,
	loadQueue: (mutation: QueueMutation) => void,
	user: JellifyUser | undefined,
) =>
	new TabBarTemplate({
		id: uuid.v4(),
		title: 'Tabs',
		templates: [CarPlayHome(library, loadQueue, user), CarPlayDiscover],
		onTemplateSelect(template, e) {},
	})

export default CarPlayNavigation

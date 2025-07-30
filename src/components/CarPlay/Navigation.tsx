import { TabBarTemplate } from 'react-native-carplay'
import CarPlayHome from './Home'
import CarPlayDiscover from './Discover'
import uuid from 'react-native-uuid'
import { JellifyUser } from '../../types/JellifyUser'
import { QueueMutation } from '../../providers/Player/interfaces'

const CarPlayNavigation = (user: JellifyUser, loadQueue: (mutation: QueueMutation) => void) =>
	new TabBarTemplate({
		id: uuid.v4(),
		title: 'Tabs',
		templates: [CarPlayHome(user, loadQueue), CarPlayDiscover],
		onTemplateSelect(template, e) {},
	})

export default CarPlayNavigation

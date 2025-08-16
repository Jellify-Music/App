import { TabBarTemplate } from 'react-native-carplay'
import CarPlayHome from './Home'
import CarPlayDiscover from './Discover'
import uuid from 'react-native-uuid'
import { QueueMutation } from '../../providers/Player/interfaces'
import { JellifyLibrary } from '../../types/JellifyLibrary'

const CarPlayNavigation = (library: JellifyLibrary, loadQueue: (mutation: QueueMutation) => void) =>
	new TabBarTemplate({
		id: uuid.v4(),
		title: 'Tabs',
		templates: [CarPlayHome(library, loadQueue), CarPlayDiscover],
		onTemplateSelect(template, e) {},
	})

export default CarPlayNavigation

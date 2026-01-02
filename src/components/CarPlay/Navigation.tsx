import { TabBarTemplate } from 'react-native-carplay'
import CarPlayHome from './Home'
import CarPlayDiscover from './Discover'
import uuid from 'react-native-uuid'

const CarPlayNavigation = new TabBarTemplate({
	id: uuid.v4(),
	title: 'Tabs',
	templates: [CarPlayHome, CarPlayDiscover],
	onTemplateSelect(template, e) {},
})

export default CarPlayNavigation

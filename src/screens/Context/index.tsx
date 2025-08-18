import ItemContext from '../../components/Context'
import { ContextProps } from '../types'

export default function ItemContextScreen({ route, navigation }: ContextProps): React.JSX.Element {
	return (
		<ItemContext
			item={route.params.item}
			stackNavigation={route.params.navigation}
			navigation={navigation}
			navigationCallback={route.params.navigationCallback}
		/>
	)
}

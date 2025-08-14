import ItemContext from '../../components/Context'
import { ContextProps } from '../types'

export default function ItemContextScreen({ route }: ContextProps): React.JSX.Element {
	return <ItemContext item={route.params.item} navigation={route.params.navigation} />
}

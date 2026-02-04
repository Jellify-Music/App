import Filters from '../../components/Filters/index'
import { FiltersProps } from '../types'

export default function FiltersSheet({ route, navigation }: FiltersProps): React.JSX.Element {
	return <Filters currentTab={route.params?.currentTab} navigation={navigation} />
}

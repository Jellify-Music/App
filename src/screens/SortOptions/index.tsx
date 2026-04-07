import SortOptionsComponent from '../../components/SortOptions/index'
import { SortOptionsProps } from '../types'

export default function SortOptionsSheet({ route }: SortOptionsProps): React.JSX.Element {
	return <SortOptionsComponent currentTab={route.params?.currentTab} />
}

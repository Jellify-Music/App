import SortOptionsComponent from '../../components/SortOptions/index'
import { SortOptionsProps } from '../Library/types'

export default function SortOptionsSheet({ route }: SortOptionsProps): React.JSX.Element {
	return <SortOptionsComponent currentTab={route.params?.currentTab} />
}

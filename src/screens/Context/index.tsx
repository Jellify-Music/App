import ItemContext from '../../components/Context'
import { ContextProps } from '../types'

export default function ItemContextScreen({ route }: ContextProps): React.JSX.Element {
	return (
		<ItemContext
			item={route.params.item}
			playlist={route.params.playlist}
			stackNavigation={route.params.navigation}
			streamingMediaSourceInfo={route.params.streamingMediaSourceInfo}
			downloadedMediaSourceInfo={route.params.downloadedMediaSourceInfo}
		/>
	)
}

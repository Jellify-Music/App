import ItemContext from '../../components/Context'
import { ContextProps } from '../types'

export default function ItemContextScreen({ route, navigation }: ContextProps): React.JSX.Element {
	return (
		<ItemContext
			navigation={navigation}
			item={route.params.item}
			stackNavigation={route.params.navigation}
			navigationCallback={route.params.navigationCallback}
			streamingMediaSourceInfo={route.params.streamingMediaSourceInfo}
			downloadedMediaSourceInfo={route.params.downloadedMediaSourceInfo}
		/>
	)
}

import navigationRef from '../../../../screens/navigation'
import StatsMenuRowProps from './types'
import type { ContextMenuRowImageProp } from '../types'
import ContextMenuRow from '..'

const IMAGE_PROP: ContextMenuRowImageProp = {
	iconName: 'sine-wave',
}

export default function StatsMenuRow({
	item,
	streamingMediaSourceInfo,
	downloadedMediaSourceInfo,
}: StatsMenuRowProps): React.JSX.Element {
	const onPress = () => {
		navigationRef.goBack() // dismiss context modal
		navigationRef.navigate('AudioSpecs', {
			item,
			streamingMediaSourceInfo,
			downloadedMediaSourceInfo,
		})
	}

	return <ContextMenuRow onPress={onPress} imageProp={IMAGE_PROP} label='Open Audio Specs' />
}

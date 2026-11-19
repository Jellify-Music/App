import navigationRef from '../../../../screens/navigation'
import StatsMenuRowProps from './types'
import type { ContextMenuRowImageProp } from '../types'
import ContextMenuRow from '..'
import { useTranslation } from 'react-i18next'

const IMAGE_PROP: ContextMenuRowImageProp = {
	iconName: 'sine-wave',
}

export default function StatsMenuRow({
	item,
	streamingMediaSourceInfo,
	downloadedMediaSourceInfo,
}: StatsMenuRowProps): React.JSX.Element {
	const { t } = useTranslation()

	const onPress = () => {
		navigationRef.goBack() // dismiss context modal
		navigationRef.navigate('AudioSpecs', {
			item,
			streamingMediaSourceInfo,
			downloadedMediaSourceInfo,
		})
	}

	return (
		<ContextMenuRow
			onPress={onPress}
			imageProp={IMAGE_PROP}
			label={t('context.openAudioSpecs')}
		/>
	)
}

import { addToQueue } from '../../../../player/queuing'
import { QueuingType } from '../../../../enums/queuing-type'
import AddToQueueMenuRowsProps from './types'
import type { ContextMenuRowImageProp } from '../types'
import ContextMenuRow from '..'
import { useTranslation } from 'react-i18next'

// Use same icon as swipe Play Later for consistency
const IMAGE_PROP: ContextMenuRowImageProp = {
	iconName: 'playlist-play',
}

export default function AddToQueueMenuRows({ tracks }: AddToQueueMenuRowsProps): React.JSX.Element {
	const { t } = useTranslation()

	return (
		<>
			<ContextMenuRow
				onPress={() => addToQueue({ tracks, queuingType: QueuingType.PlayNext })}
				imageProp={IMAGE_PROP}
				label={t('context.playNext')}
			/>

			<ContextMenuRow
				onPress={() => addToQueue({ tracks, queuingType: QueuingType.PlayLater })}
				imageProp={IMAGE_PROP}
				label={t('context.playLater')}
			/>
		</>
	)
}

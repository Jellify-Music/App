import { useDownloadProgress } from 'react-native-nitro-player'
import useDownloadTracks, { useDeleteDownloads } from '../../../../hooks/downloads/mutations'
import { useAreAllDownloaded } from '../../../../hooks/downloads'
import DownloadMenuRowProps from './types'
import type { ContextMenuRowImageProp } from '../types'
import ContextMenuRow from '..'
import { useTranslation } from 'react-i18next'

const REMOVE_DOWNLOAD_IMAGE_PROP: ContextMenuRowImageProp = {
	iconName: 'broom',
	color: 'warning',
}

export default function DownloadMenuRow({ items }: DownloadMenuRowProps): React.JSX.Element {
	const { t } = useTranslation()

	const { mutate: download } = useDownloadTracks()

	const { overallProgress } = useDownloadProgress({
		trackIds: items.map((item) => item.Id!),
		activeOnly: true,
	})

	const isDownloading = overallProgress > 0 && overallProgress < 1

	const isDownloaded = useAreAllDownloaded(items.map((item) => item.Id))

	const removeDownloads = useDeleteDownloads()

	const handleRemoveDownloads = () => removeDownloads.mutate(items.map((item) => item.Id!))

	if (isDownloaded)
		return (
			<ContextMenuRow
				onPress={handleRemoveDownloads}
				imageProp={REMOVE_DOWNLOAD_IMAGE_PROP}
				label={t('context.removeDownload')}
			/>
		)

	if (isDownloading)
		return (
			<ContextMenuRow
				disabled
				imageProp={{ progress: overallProgress }}
				label={t('context.downloadQueued')}
			/>
		)

	return (
		<ContextMenuRow
			onPress={() => download(items)}
			imageProp={{ iconName: items.length > 1 ? 'download-multiple' : 'download' }}
			label={t('context.download')}
		/>
	)
}

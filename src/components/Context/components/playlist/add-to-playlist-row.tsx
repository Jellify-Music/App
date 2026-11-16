import navigationRef from '../../../../screens/navigation'
import { StackActions } from '@react-navigation/native'
import { AddToPlaylistRowProps } from './types'
import type { ContextMenuRowImageProp } from '../types'
import ContextMenuRow from '..'
import { useTranslation } from 'react-i18next'

const IMAGE_PROP: ContextMenuRowImageProp = {
	iconName: 'plus-circle-outline',
}

export default function AddToPlaylistRow({
	tracks,
	source,
}: AddToPlaylistRowProps): React.JSX.Element {
	const { t } = useTranslation()

	const onPress = () => {
		navigationRef.goBack()
		navigationRef.dispatch(
			StackActions.push('AddToPlaylist', {
				tracks,
				source,
			}),
		)
	}

	return (
		<ContextMenuRow
			onPress={onPress}
			imageProp={IMAGE_PROP}
			label={t('context.addToPlaylist')}
		/>
	)
}

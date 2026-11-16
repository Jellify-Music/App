import { SizableText } from 'tamagui'
import React from 'react'
import { useTranslation } from 'react-i18next'

export default function LoadErrorMessage(): React.JSX.Element {
	const { t } = useTranslation()

	return (
		<SizableText color='warning' textAlign='center' fontSize={'3'}>
			{t('librarySelector.loadError')}
		</SizableText>
	)
}

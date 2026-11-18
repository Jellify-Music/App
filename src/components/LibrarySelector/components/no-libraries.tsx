import { YStack, SizableText } from 'tamagui'
import React from 'react'
import Icon from '../../Global/components/icon'
import { useTranslation } from 'react-i18next'

export default function NoLibrariesMessage(): React.JSX.Element {
	const { t } = useTranslation()

	return (
		<YStack alignItems='center' gap='2'>
			<Icon name='alert' color='warning' />
			<SizableText color='warning' textAlign='center' fontSize={'3'}>
				{t('librarySelector.noLibraries')}
			</SizableText>
			<SizableText color='borderColor' textAlign='center' fontSize={'2'}>
				{t('librarySelector.noLibrariesHint')}
			</SizableText>
		</YStack>
	)
}

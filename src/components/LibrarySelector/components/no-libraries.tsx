import { YStack, SizableText } from 'tamagui'
import React from 'react'
import Icon from '../../Global/components/icon'

export default function NoLibrariesMessage(): React.JSX.Element {
	return (
		<YStack alignItems='center' gap='2'>
			<Icon name='alert' color='warning' />
			<SizableText color='warning' textAlign='center' fontSize={'3'}>
				No music libraries found
			</SizableText>
			<SizableText color='borderColor' textAlign='center' fontSize={'2'}>
				Please create a music library in Jellyfin to continue
			</SizableText>
		</YStack>
	)
}

import { SizableText } from 'tamagui'
import React from 'react'

export default function LoadErrorMessage(): React.JSX.Element {
	return (
		<SizableText color='warning' textAlign='center' fontSize={'3'}>
			Unable to load libraries
		</SizableText>
	)
}

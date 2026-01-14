import React from 'react'
import { XStack, SizableText } from 'tamagui'
import Icon from '../../../../Global/components/icon'
import navigationRef from '../../../../../../navigation'

export default function CassetteHeader(): React.JSX.Element {
	return (
		<XStack justifyContent='space-between' alignItems='center' paddingHorizontal='$2'>
			<XStack
				onPress={() => navigationRef.goBack()}
				pressStyle={{ opacity: 0.7 }}
				padding='$2'
			>
				<Icon name='chevron-down' color='$borderColor' />
			</XStack>
			<SizableText size='$2' color='$borderColor' fontWeight='600' letterSpacing={2}>
				NOW PLAYING
			</SizableText>
			<XStack width={40} /> {/* Spacer for balance */}
		</XStack>
	)
}

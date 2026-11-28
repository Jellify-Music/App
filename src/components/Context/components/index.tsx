import React from 'react'
import { ListItem, SizableText, XStack } from 'tamagui'
import Icon from '../../Global/components/icon'
import ItemImage from '../../Global/components/image'
import CircularProgressIndicator from '../../Global/components/DownloadIndicator/circular-progress-indicator'
import { Ticker } from '../../Global/utils/Animated/text'
import { ContextMenuRowImageProp, ContextMenuRowProps } from './types'

export default function ContextMenuRow({
	imageProp,
	label,
	onPress,
	disabled,
}: ContextMenuRowProps): React.JSX.Element {
	const labelElement = (
		<SizableText fontSize={'3'} fontWeight='6' color={disabled ? 'borderColor' : undefined}>
			{label}
		</SizableText>
	)

	return (
		<ListItem
			transition={'quick'}
			opacity='1 press:0.5'
			backgroundColor={'transparent'}
			flex={1}
			gap='2'
			paddingHorizontal='3'
			justifyContent='flex-start'
			onPress={onPress}
			disabled={disabled}
		>
			<XStack width='6' justifyContent='center' alignItems='center'>
				<ContextMenuRowImage imageProp={imageProp} />
			</XStack>

			{'imageType' in imageProp ? <Ticker>{labelElement}</Ticker> : labelElement}
		</ListItem>
	)
}

function ContextMenuRowImage({
	imageProp,
}: {
	imageProp: ContextMenuRowImageProp
}): React.JSX.Element {
	if ('imageType' in imageProp)
		return (
			<ItemImage
				circular={imageProp.circular}
				item={imageProp.item}
				type={imageProp.imageType}
				height={'3'}
				width={'3'}
				imageOptions={{ maxWidth: 100, maxHeight: 100, quality: 100 }}
				elevate
			/>
		)

	if ('progress' in imageProp)
		return <CircularProgressIndicator progress={imageProp.progress} size={24} strokeWidth={4} />

	return <Icon size={'8'} color={imageProp.color ?? 'primary'} name={imageProp.iconName} />
}

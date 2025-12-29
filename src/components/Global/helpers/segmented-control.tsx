import React from 'react'
import { XStack, SizableText } from 'tamagui'
import useHapticFeedback from '../../../hooks/use-haptic-feedback'

interface SegmentedControlProps {
	values: string[]
	selectedIndex: number
	onChange: (index: number) => void
}

export default function SegmentedControl({
	values,
	selectedIndex,
	onChange,
}: SegmentedControlProps): React.JSX.Element {
	const trigger = useHapticFeedback()

	const handlePress = (index: number) => {
		if (index !== selectedIndex) {
			trigger('impactLight')
			onChange(index)
		}
	}

	return (
		<XStack backgroundColor={'$backgroundHover'} borderRadius={'$4'} padding={'$1'}>
			{values.map((value, index) => {
				const isSelected = index === selectedIndex
				return (
					<XStack
						key={value}
						flex={1}
						backgroundColor={isSelected ? '$primary' : 'transparent'}
						borderRadius={'$3'}
						paddingVertical={'$2'}
						paddingHorizontal={'$3'}
						justifyContent='center'
						alignItems='center'
						onPress={() => handlePress(index)}
						pressStyle={{
							opacity: 0.7,
						}}
						animation='quick'
					>
						<SizableText
							size={'$3'}
							fontWeight={isSelected ? 'bold' : 'normal'}
							color={isSelected ? '$background' : '$color'}
						>
							{value}
						</SizableText>
					</XStack>
				)
			})}
		</XStack>
	)
}

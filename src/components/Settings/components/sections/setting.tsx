import React from 'react'
import { SizableText, View, XStack, YStack } from 'tamagui'

interface SettingProps {
	title: string
	description?: string | React.JSX.Element
	indicator?: React.JSX.Element
	children: React.JSX.Element
	orientation?: 'horizontal' | 'vertical'
	testID?: string
}

/**
 * Standard layout for a single setting.
 *
 * Horizontal settings place the control to the right of the title (i.e. switches, chips),
 * while vertical settings place the control beneath the title (i.e. sliders, pickers)
 */
export default function Setting({
	title,
	description,
	children,
	indicator,
	orientation = 'horizontal',
	testID,
}: SettingProps): React.JSX.Element {
	const isHorizontal = orientation === 'horizontal'

	return (
		<View
			testID={testID}
			flexDirection={isHorizontal ? 'row' : 'column'}
			alignItems={isHorizontal ? 'center' : 'stretch'}
			justifyContent='space-between'
			gap='2'
			marginVertical='2'
			marginHorizontal='4'
		>
			<XStack alignItems='center' justifyContent='space-between'>
				<YStack gap='1'>
					<SizableText fontSize='3' fontWeight='6'>
						{title}
					</SizableText>
					{typeof description === 'string' ? (
						<SizableText fontSize='2' color='borderColor'>
							{description}
						</SizableText>
					) : (
						description
					)}
				</YStack>
				{indicator && indicator}
			</XStack>

			{children}
		</View>
	)
}

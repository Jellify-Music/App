import React from 'react'
import { XStack } from 'tamagui'

/** A group of buttons on the artist's image, on a background that keeps them readable on any artwork */
export default function ActionPill({ children }: { children: React.ReactNode }): React.JSX.Element {
	return (
		<XStack
			alignItems='center'
			gap='3'
			paddingHorizontal='3'
			paddingVertical='1'
			borderRadius={999}
			backgroundColor='$darkBackground'
		>
			{children}
		</XStack>
	)
}

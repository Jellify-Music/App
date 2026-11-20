import React from 'react'
import { XStack } from 'tamagui'

/** The height of every pill, so a lone button's circle matches the groups beside it */
const PILL_HEIGHT = 44

/**
 * A group of buttons on the artist's image, on a background that keeps them readable on any artwork.
 * With `circular` it's a round holder for a single button.
 */
export default function ActionPill({
	children,
	circular = false,
}: {
	children: React.ReactNode
	circular?: boolean
}): React.JSX.Element {
	return (
		<XStack
			alignItems='center'
			justifyContent='center'
			gap='3'
			height={PILL_HEIGHT}
			width={circular ? PILL_HEIGHT : undefined}
			paddingHorizontal={circular ? 0 : '3'}
			borderRadius={999}
			backgroundColor='$darkBackground'
		>
			{children}
		</XStack>
	)
}

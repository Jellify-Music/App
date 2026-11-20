import React from 'react'
import { XStack } from 'tamagui'
import useIsLightMode from '../../hooks/use-is-light-mode'

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
	// the icons take the theme's own colours, so the pill has to be a ground they read on in either
	const isLightMode = useIsLightMode()

	return (
		<XStack
			alignItems='center'
			justifyContent='center'
			gap='3'
			height={PILL_HEIGHT}
			width={circular ? PILL_HEIGHT : undefined}
			paddingHorizontal={circular ? 0 : '3'}
			borderRadius={999}
			backgroundColor={isLightMode ? '$lightBackground' : '$darkBackground'}
			borderWidth={isLightMode ? 1 : 0}
			borderColor='$borderColor'
		>
			{children}
		</XStack>
	)
}

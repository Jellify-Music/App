import React from 'react'
import { YStack } from 'tamagui'
import LinearGradient from 'react-native-linear-gradient'

interface CassetteBackgroundProps {
	width: number
	height: number
}

export default function CassetteBackground({
	width,
	height,
}: CassetteBackgroundProps): React.JSX.Element {
	return (
		<YStack position='absolute' width={width} height={height}>
			<LinearGradient
				colors={['#2C1810', '#4A3728', '#3D2A1F', '#1A0F0A']}
				locations={[0, 0.3, 0.7, 1]}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={{ flex: 1 }}
			/>
		</YStack>
	)
}

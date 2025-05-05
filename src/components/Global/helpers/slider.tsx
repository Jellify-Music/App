import React from 'react'
import {
	SliderProps as TamaguiSliderProps,
	Slider as TamaguiSlider,
	styled,
	Slider,
	getTokens,
	getToken,
} from 'tamagui'
import { Platform } from 'react-native'

interface SliderProps {
	value?: number | undefined
	max: number
	width?: number | undefined
	props: TamaguiSliderProps
}

const JellifyActiveSliderTrack = styled(Slider.TrackActive, {
	backgroundColor: '$telemagenta',
})

const JellifySliderThumb = styled(Slider.Thumb, {
	backgroundColor: '$purpleDark',
	borderColor: '$borderColor',
	shadowColor: '$purpleDark',
	shadowOffset: { width: 0, height: 1 },
	shadowOpacity: 0.25,
	shadowRadius: 2,
	elevation: 2,
	// Improve performance when pressing
	pressStyle: {
		scale: 1.2,
	},
	// Optimize for better touch response
	borderWidth: 2,
})

const JellifySliderTrack = styled(Slider.Track, {
	backgroundColor: getToken('$color.amethyst'),
})

export function HorizontalSlider({ value, max, width, props }: SliderProps): React.JSX.Element {
	return (
		<TamaguiSlider
			width={width}
			value={value ? [value] : []}
			max={max}
			step={1}
			orientation='horizontal'
			marginHorizontal={10}
			{...props}
		>
			<JellifySliderTrack size='$4'>
				<JellifyActiveSliderTrack size={'$4'} />
			</JellifySliderTrack>
			<JellifySliderThumb
				circular
				index={0}
				size={'$1.5'}
				// Increase hit slop for better touch handling
				hitSlop={{
					top: 35,
					right: 70,
					bottom: 70,
					left: 70,
				}}
			/>
		</TamaguiSlider>
	)
}

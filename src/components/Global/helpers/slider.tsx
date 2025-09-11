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
	backgroundColor: '$primary',
})

const JellifySliderThumb = styled(Slider.Thumb, {
	backgroundColor: '$primary',
	borderColor: '$primary',
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
	backgroundColor: '#77748E',
})

export function HorizontalSlider({ value, max, width, props }: SliderProps): React.JSX.Element {
	return (
		<TamaguiSlider
			width={width}
			value={value ? [value] : []}
			max={max}
			step={1}
			orientation='horizontal'
			{...props}
		>
			<JellifySliderTrack size='$2'>
				<JellifyActiveSliderTrack />
			</JellifySliderTrack>
			<JellifySliderThumb
				circular
				index={0}
				size={'$0.75'} // Anything larger than 14 causes the thumb to be clipped
				// Increase hit slop for better touch handling
				hitSlop={{
					top: 25,
					right: 100,
					bottom: 100,
					left: 100,
				}}
			/>
		</TamaguiSlider>
	)
}

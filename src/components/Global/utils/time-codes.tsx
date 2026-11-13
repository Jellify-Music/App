import { SizableText, TextProps } from 'tamagui'
import { convertRunTimeTicksToSeconds } from '../../../utils/mapping/ticks-to-seconds'
import React from 'react'

export function RunTimeSeconds({
	children,
	color,
	alignment = 'center',
}: {
	children: number
	color?: string
	alignment?: 'center' | 'left' | 'right'
}): React.JSX.Element {
	return (
		<SizableText
			fontSize='2'
			fontWeight='6'
			color={color}
			textAlign={alignment}
			fontVariant={['tabular-nums']}
		>
			{calculateRunTimeFromSeconds(children)}
		</SizableText>
	)
}

export function RunTimeTicks({
	children,
	props,
}: {
	children?: number | null | undefined
	props?: TextProps | undefined
}): React.JSX.Element | null {
	if (!children) return null

	const time = calculateRunTimeFromTicks(children)

	return (
		<SizableText {...props} color='borderColor' fontVariant={['tabular-nums']} fontSize='2'>
			{time}
		</SizableText>
	)
}

function padRunTimeNumber(number: number): string {
	'worklet'
	if (number >= 10) return `${number}`

	return `0${number}`
}

export function calculateRunTimeFromSeconds(seconds: number): string {
	'worklet'
	const runTimeHours = Math.floor(seconds / 3600)
	const runTimeMinutes = Math.floor((seconds % 3600) / 60)
	const runTimeSeconds = Math.floor(seconds % 60)

	return (
		(runTimeHours != 0 ? `${padRunTimeNumber(runTimeHours)}:` : '') +
		(runTimeHours != 0 ? `${padRunTimeNumber(runTimeMinutes)}:` : `${runTimeMinutes}:`) +
		padRunTimeNumber(runTimeSeconds)
	)
}

export function calculateRunTimeFromTicks(runTimeTicks: number): string {
	const runTimeTotalSeconds = convertRunTimeTicksToSeconds(runTimeTicks)

	return calculateRunTimeFromSeconds(runTimeTotalSeconds)
}

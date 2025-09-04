import { SizeTokens, XStack, Separator, Switch, styled, getToken } from 'tamagui'
import { Label } from './text'
import { useEffect } from 'react'
import { usePreviousValue } from '../../../hooks/use-previous-value'
import useHapticFeedback from '../../../hooks/use-haptic-feedback'

interface SwitchWithLabelProps {
	onCheckedChange: (value: boolean) => void
	size: SizeTokens
	checked: boolean
	label: string
	width?: number | undefined
}

const JellifySliderThumb = styled(Switch.Thumb, {
	borderColor: getToken('$color.amethyst'),
	backgroundColor: getToken('$color.purpleDark'),
})

export function SwitchWithLabel(props: SwitchWithLabelProps) {
	const id = `switch-${props.size.toString().slice(1)}-${props.checked ?? ''}}`

	const previousChecked = usePreviousValue(props.checked)

	const trigger = useHapticFeedback()

	useEffect(() => {
		if (previousChecked !== props.checked) {
			trigger('impactMedium')
		}
	}, [props.checked])

	return (
		<XStack alignItems='center' gap='$3'>
			<Switch
				id={id}
				size={props.size}
				checked={props.checked}
				onCheckedChange={(checked: boolean) => props.onCheckedChange(checked)}
				backgroundColor={props.checked ? '$success' : '$borderColor'}
				borderColor={'$borderColor'}
			>
				<JellifySliderThumb animation='bouncy' />
			</Switch>
			<Separator minHeight={20} vertical />
			<Label size={props.size} htmlFor={id}>
				{props.label}
			</Label>
		</XStack>
	)
}

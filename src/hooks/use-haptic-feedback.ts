import { HapticFeedbackTypes, trigger } from 'react-native-haptic-feedback'
import { useReducedHapticsSetting } from '../stores/settings/app'

const useHapticFeedback: () => (
	type?: keyof typeof HapticFeedbackTypes | HapticFeedbackTypes,
) => void = () => {
	const [reducedHaptics] = useReducedHapticsSetting()

	return (type?: keyof typeof HapticFeedbackTypes | HapticFeedbackTypes) => {
		if (!reducedHaptics) {
			trigger(type)
		}
	}
}

export default useHapticFeedback

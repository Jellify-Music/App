import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import { toast } from 'react-native-pretty-toast'
import { ToastConfig } from './types'
import { useTheme } from 'tamagui'

export const useInfoToast = () => {
	const { secondary } = useTheme()

	const icon = MaterialDesignIcons.getImageSourceSync('check-circle-outline')

	return ({ title, message }: ToastConfig) =>
		toast.show({
			title,
			iconSource: icon,
			message,
			strokeColor: secondary.val,
		})
}

export const useSuccessToast = () => {
	const { success } = useTheme()

	const icon = MaterialDesignIcons.getImageSourceSync('check-circle-outline')

	return ({ title, message }: ToastConfig) =>
		toast.show({
			title,
			iconSource: icon,
			message,
			strokeColor: success.val,
		})
}

export const useErrorToast = () => {
	const { danger } = useTheme()

	const icon = MaterialDesignIcons.getImageSourceSync('alert-circle-outline')

	return ({ title, message }: ToastConfig) =>
		toast.show({
			title,
			iconSource: icon,
			message,
			strokeColor: danger.val,
		})
}

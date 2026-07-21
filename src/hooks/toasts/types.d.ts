import { ToastConfig as PrettyToastConfig } from 'react-native-pretty-toast'

export type ToastConfig = Pick<PrettyToastConfig, 'title' | 'message'>

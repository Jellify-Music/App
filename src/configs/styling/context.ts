import { Platform } from 'react-native'

/**
 * We need some top margin for iOS due to the rounded corners, but it's unnecessary
 * on Android.
 */
export const CONTEXT_MENU_TOP_MARGIN = Platform.OS === 'ios' ? '3' : undefined

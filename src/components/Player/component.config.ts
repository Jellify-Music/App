import { TextTickerProps } from 'react-native-text-ticker'
import { getToken } from 'tamagui'

export const TextTickerConfig: TextTickerProps = {
	marqueeDelay: 1000,
	duration: 10000,
}

/**
 * RNTP (React Native Track Player) holds a high significant figure
 * number for the progress.
 *
 * Tamagui Sliders only support whole integers
 *
 * We're going to move the decimal place over so that Tamagui's slider
 * can be more precise
 */
export const ProgressMultiplier = 10 ** 5

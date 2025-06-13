import { TextTickerProps } from 'react-native-text-ticker'
import { getToken } from 'tamagui'

export const TextTickerConfig: TextTickerProps = {
	duration: 5000,
	loop: true,
	repeatSpacer: 20,
	marqueeDelay: 1000,
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

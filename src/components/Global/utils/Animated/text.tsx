import Animated from 'react-native-reanimated'
import { SizableText } from 'tamagui'
import TextTicker, { TextTickerProps } from 'react-native-text-ticker'
import { TEXT_TICKER_CONFIG } from '../../../../configs/animating/text-ticker'

export const AnimatedSizableText = Animated.createAnimatedComponent(SizableText)

/**
 * {@link TextTicker} with our {@link TextTickerConfig} applied.
 * Any props passed in will override the defaults.
 */
export const Ticker = (props: TextTickerProps) => <TextTicker {...TEXT_TICKER_CONFIG} {...props} />

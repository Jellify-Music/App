import React, { useEffect } from 'react'
import { View, Text, StyleSheet, Image } from 'react-native'
import Button from '../../../components/Global/helpers/button'
import Animated, {
    FadeInDown,
    FadeOutUp,
    useSharedValue,
    withSpring,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withDelay,
    withTiming,
    FadeIn,
} from 'react-native-reanimated'
import { useTheme } from 'tamagui'

interface Props {
    onNext: () => void
}

export const WelcomeStep: React.FC<Props> = ({ onNext }) => {
    const theme = useTheme()
    const logoTranslateY = useSharedValue(30)
    const logoOpacity = useSharedValue(0)
    const logoScale = useSharedValue(0.95)

    // Determine if theme is light
    const isLight = theme.background.val === '#ffffff' || theme.background.val === 'rgb(235, 221, 255)'

    useEffect(() => {
        // Smooth slide up and fade in
        logoTranslateY.value = withTiming(0, { duration: 1000 })
        logoOpacity.value = withTiming(1, { duration: 1000 })
        logoScale.value = withTiming(1, { duration: 1000 })
    }, [])

    const animatedLogoStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: logoTranslateY.value },
            { scale: logoScale.value },
        ],
        opacity: logoOpacity.value,
    }))

    const textColor = theme.color.val
    const primaryColor = theme.primary.val

    return (
        <Animated.View 
            entering={FadeIn.duration(800)} 
            exiting={FadeOutUp.duration(400)}
            style={styles.container}
        >
            <View style={styles.content}>
                {/* Animated Logo */}
                <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
                    <Image 
                        source={{ uri: 'https://raw.githubusercontent.com/Jellify-Music/App/refs/heads/main/assets/transparent-banner.png' }}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </Animated.View>

                {/* Subtitle Only */}
                <View style={styles.textContainer}>
                    <Animated.View entering={FadeInDown.delay(800).springify()}>
                        <Text style={[styles.subtitle, { color: textColor }]}>
                            YOUR MUSIC. AMPLIFIED.
                        </Text>
                    </Animated.View>
                </View>

                {/* CTA Button */}
                <Animated.View entering={FadeInDown.delay(1000).springify()}>
                    <Button
                        onPress={onNext}
                        size='$6'
                        backgroundColor='$primary'
                        color='$white'
                        fontWeight='bold'
                        paddingHorizontal='$8'
                        borderRadius='$10'
                        shadowColor='$primary'
                        shadowRadius={20}
                        shadowOpacity={0.4}
                        shadowOffset={{ width: 0, height: 8 }}
                    >
                        GET STARTED
                    </Button>
                </Animated.View>
            </View>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        gap: 60,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    logoContainer: {
        width: 300,
        height: 140,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    textContainer: {
        gap: 20,
        alignItems: 'center',
    },
    subtitle: {
        fontSize: 20,
        textAlign: 'center',
        opacity: 0.85,
        letterSpacing: 3,
        fontWeight: '600',
        fontFamily: 'Figtree-SemiBold',
    },
})

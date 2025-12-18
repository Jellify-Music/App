import React, { useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import Button from '../../../components/Global/helpers/button'
import Animated, { 
    FadeInDown, 
    FadeOutUp, 
    FadeIn,
    ZoomIn,
    useSharedValue, 
    withSpring, 
    useAnimatedStyle, 
    withSequence, 
    withDelay,
    withRepeat,
    withTiming,
    Easing,
} from 'react-native-reanimated'
import MaterialDesignIcon from '@react-native-vector-icons/material-design-icons'
import { useTheme } from 'tamagui'

interface Props {
    onFinish: () => void
}

// Confetti particle component
const ConfettiParticle: React.FC<{ delay: number; x: number; color: string }> = ({ delay, x, color }) => {
    const translateY = useSharedValue(-100)
    const translateX = useSharedValue(x)
    const rotate = useSharedValue(0)
    const opacity = useSharedValue(1)

    useEffect(() => {
        translateY.value = withDelay(
            delay,
            withTiming(800, { duration: 2000, easing: Easing.out(Easing.quad) })
        )
        
        translateX.value = withDelay(
            delay,
            withTiming(x + (Math.random() - 0.5) * 100, { duration: 2000 })
        )
        
        rotate.value = withDelay(
            delay,
            withRepeat(
                withTiming(360, { duration: 1000, easing: Easing.linear }),
                -1,
                false
            )
        )
        
        opacity.value = withDelay(
            delay + 1500,
            withTiming(0, { duration: 500 })
        )
    }, [])

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { translateX: translateX.value },
            { rotate: `${rotate.value}deg` },
        ],
        opacity: opacity.value,
    }))

    return (
        <Animated.View
            style={[
                animatedStyle,
                {
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    backgroundColor: color,
                },
            ]}
        />
    )
}

export const FinishStep: React.FC<Props> = ({ onFinish }) => {
    const theme = useTheme()
    const scale = useSharedValue(0)
    const checkRotate = useSharedValue(0)
    const pulseScale = useSharedValue(1)

    const isLight = theme.background.val === '#ffffff' || theme.background.val === 'rgb(235, 221, 255)'
    const textColor = theme.color.val
    const successColor = theme.success.val

    useEffect(() => {
        // Check icon pop animation
        scale.value = withSequence(
            withDelay(200, withSpring(1.3, { damping: 8 })),
            withSpring(1)
        )
        
        // Subtle rotation
        checkRotate.value = withDelay(
            300,
            withSequence(
                withSpring(-10),
                withSpring(10),
                withSpring(0)
            )
        )

        // Continuous pulse
        pulseScale.value = withDelay(
            1000,
            withRepeat(
                withSequence(
                    withTiming(1.05, { duration: 800 }),
                    withTiming(1, { duration: 800 })
                ),
                -1,
                false
            )
        )
    }, [])

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value * pulseScale.value },
            { rotate: `${checkRotate.value}deg` },
        ],
    }))

    const confettiColors = [successColor, theme.primary.val, '#f59e0b', '#ec4899', '#8b5cf6']
    const confettiParticles = Array.from({ length: 15 }, (_, i) => ({
        key: i,
        delay: i * 50,
        x: (Math.random() - 0.5) * 200,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    }))

    return (
        <Animated.View 
            entering={FadeIn.duration(600)} 
            exiting={FadeOutUp.duration(400)}
            style={styles.container}
        >
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.content}>
                    {/* Confetti particles */}
                    {confettiParticles.map((particle) => (
                        <ConfettiParticle
                            key={particle.key}
                            delay={particle.delay}
                            x={particle.x}
                            color={particle.color}
                        />
                    ))}

                    {/* Success Icon with Glow */}
                    <Animated.View 
                        entering={ZoomIn.delay(200).springify()}
                        style={styles.iconContainer}
                    >
                        {/* Glow rings */}
                        <View style={[styles.glowOuter, { backgroundColor: `${successColor}33` }]} />
                        <View style={[styles.glowInner, { backgroundColor: `${successColor}4D` }]} />
                        
                        {/* Check Icon */}
                        <Animated.View style={animatedStyle}>
                            <View style={[
                                styles.checkContainer,
                                {
                                    backgroundColor: `${successColor}33`,
                                    borderColor: successColor,
                                    shadowColor: successColor,
                                }
                            ]}>
                                {/* @ts-expect-error - MaterialDesignIcon name prop type issue */}
                                <MaterialDesignIcon name="check-circle" size={65} color={"white"} />
                            </View>
                        </Animated.View>
                    </Animated.View>

                    {/* Success Text */}
                    <View style={styles.textContainer}>
                        <Animated.View entering={FadeInDown.delay(600).springify()}>
                            <Text style={[styles.title, { color: textColor }]}>
                                ALL SET!
                            </Text>
                        </Animated.View>
                        
                        <Animated.View entering={FadeInDown.delay(800).springify()}>
                            <Text style={[styles.subtitle, { color: textColor }]}>
                                You&apos;re ready to enjoy your music
                            </Text>
                        </Animated.View>
                    </View>


                    {/* CTA Button */}
                    <Animated.View entering={FadeInDown.delay(1400).springify()}>
                        <Button
                            onPress={onFinish}
                            size='$6'
                            backgroundColor='$primary'
                            color='$white'
                            fontWeight='bold'
                            paddingHorizontal='$10'
                            borderRadius='$10'
                            shadowColor='$primary'
                            shadowRadius={25}
                            shadowOpacity={0.4}
                            shadowOffset={{ width: 0, height: 10 }}
                        >
                            LET&apos;S ROCK 🎵
                        </Button>
                    </Animated.View>
                </View>
            </ScrollView>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingVertical: 20,
    },
    content: {
        gap: 24,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        paddingHorizontal: 20,
    },
    iconContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    glowOuter: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        opacity: 0.8,
    },
    glowInner: {
        position: 'absolute',
        width: 130,
        height: 130,
        borderRadius: 65,
        opacity: 0.6,
    },
    checkContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
        shadowRadius: 25,
        shadowOpacity: 0.6,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
    },
    textContainer: {
        gap: 12,
        alignItems: 'center',
    },
    title: {
        fontSize: 48,
        fontWeight: 'bold',
        textAlign: 'center',
        letterSpacing: 2,
        fontFamily: 'Figtree-Black',
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowRadius: 15,
        textShadowOffset: { width: 0, height: 4 },
    },
    subtitle: {
        fontSize: 20,
        textAlign: 'center',
        opacity: 0.9,
        paddingHorizontal: 24,
        lineHeight: 24,
        fontFamily: 'Figtree-Medium',
    },
    fullWidth: {
        width: '100%',
    },
    featuresContainer: {
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    featureBadge: {
        gap: 8,
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        minWidth: 80,
    },
    featureLabel: {
        fontSize: 13,
        opacity: 0.9,
        fontFamily: 'Figtree-SemiBold',
    },
})

import React, { useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import Button from '../../../components/Global/helpers/button'
import { SwitchWithLabel } from '../../../components/Global/helpers/switch-with-label'
import Animated, { 
    FadeInDown, 
    FadeOutUp, 
    FadeIn,
    ZoomIn,
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated'
import { useSendMetricsSetting } from '../../../stores/settings/app'
import MaterialDesignIcon from '@react-native-vector-icons/material-design-icons'
import { useTheme } from 'tamagui'

interface Props {
    onNext: () => void
}

export const PrivacyStep: React.FC<Props> = ({ onNext }) => {
    const [metrics, setMetrics] = useSendMetricsSetting()
    const theme = useTheme()
    const shieldScale = useSharedValue(1)
    const glowOpacity = useSharedValue(0.5)

    const isLight = theme.background.val === '#ffffff' || theme.background.val === 'rgb(235, 221, 255)'
    const textColor = theme.color.val
    const successColor = theme.success.val

    useEffect(() => {
        // Pulse animation for shield
        shieldScale.value = withRepeat(
            withSequence(
                withTiming(1.1, { duration: 1500 }),
                withTiming(1, { duration: 1500 })
            ),
            -1,
            false
        )

        glowOpacity.value = withRepeat(
            withSequence(
                withTiming(0.8, { duration: 2000 }),
                withTiming(0.5, { duration: 2000 })
            ),
            -1,
            false
        )
    }, [])

    const shieldStyle = useAnimatedStyle(() => ({
        transform: [{ scale: shieldScale.value }],
    }))

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
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
                    {/* Animated Shield Icon */}
                    <Animated.View entering={ZoomIn.delay(200).springify()}>
                        <View style={styles.shieldContainer}>
                            {/* Glow Effect */}
                            <Animated.View style={[glowStyle, styles.glow, { backgroundColor: successColor }]} />
                            
                            {/* Shield */}
                            <Animated.View style={shieldStyle}>
                                <View style={[
                                    styles.shield,
                                    {
                                        backgroundColor: `${successColor}33`,
                                        borderColor: `${successColor}80`,
                                    }
                                ]}>
                                    {/* @ts-expect-error - MaterialDesignIcon name prop type issue */}
                                    <MaterialDesignIcon name="shield-account" size={44} color={"white"} />
                                </View>
                            </Animated.View>
                        </View>
                    </Animated.View>

                    {/* Header */}
                    <Animated.View entering={FadeInDown.delay(400).springify()}>
                        <View style={styles.header}>
                            <Text style={[styles.title, { color: textColor }]}>PRIVACY FIRST</Text>
                            <Text style={[styles.subtitle, { color: textColor }]}>Your data, your control</Text>
                        </View>
                    </Animated.View>

                
               

                    {/* Analytics Toggle */}
                    <Animated.View entering={FadeInDown.delay(1000).springify()} style={styles.fullWidth}>
                        <View style={[
                            styles.toggleCard,
                            {
                                backgroundColor: isLight ? 'rgba(109, 47, 255, 0.12)' : 'rgba(255,255,255,0.12)',
                                borderColor: isLight ? 'rgba(109, 47, 255, 0.2)' : 'rgba(255,255,255,0.2)',
                            }
                        ]}>
                            <SwitchWithLabel
                                label='Share Anonymous Analytics'
                                checked={metrics}
                                onCheckedChange={setMetrics}
                                size='$4'
                            />
                            <Text style={[styles.toggleDescription, { color: textColor }]}>
                                Help us improve by sharing anonymous usage data. No personal information or listening history is ever collected.
                            </Text>
                        </View>
                    </Animated.View>

                    {/* Finish Button */}
                    <Animated.View entering={FadeInDown.delay(1100).springify()} style={styles.fullWidth}>
                        <Button 
                            onPress={onNext} 
                            size='$6' 
                            backgroundColor='$primary' 
                            color='$white' 
                            fontWeight='bold'
                            borderRadius='$10'
                            shadowColor='$primary'
                            shadowRadius={20}
                            shadowOpacity={0.4}
                            shadowOffset={{ width: 0, height: 8 }}
                        >
                            FINISH SETUP
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
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    shieldContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    glow: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    shield: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        gap: 8,
        alignItems: 'center',
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        textAlign: 'center',
        letterSpacing: 1,
        fontFamily: 'Figtree-Black',
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowRadius: 10,
    },
    subtitle: {
        fontSize: 16,
        opacity: 0.85,
        textAlign: 'center',
        fontFamily: 'Figtree-Medium',
    },
    fullWidth: {
        width: '100%',
    },
    featuresList: {
        gap: 12,
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    featureIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureText: {
        fontSize: 14,
        opacity: 0.9,
        flex: 1,
        fontFamily: 'Figtree-Medium',
    },
    toggleCard: {
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        shadowColor: '#ffffff',
        shadowRadius: 10,
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 4 },
        gap: 12,
    },
    toggleDescription: {
        fontSize: 13,
        opacity: 0.7,
        lineHeight: 20,
        fontFamily: 'Figtree-Regular',
    },
})

import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import Button from '../../../components/Global/helpers/button'
import Animated, { 
    FadeInDown, 
    FadeOutUp, 
    FadeIn,
    ZoomIn,
} from 'react-native-reanimated'
import { useThemeSetting, ThemeSetting } from '../../../stores/settings/app'
import MaterialDesignIcon from '@react-native-vector-icons/material-design-icons'
import { useTheme } from 'tamagui'

interface Props {
    onNext: () => void
}

export const ThemeStep: React.FC<Props> = ({ onNext }) => {
    const [theme, setTheme] = useThemeSetting()
    const currentTheme = useTheme()

    // Determine if current theme is light
    const isLight = currentTheme.background.val === '#ffffff' || currentTheme.background.val === 'rgb(235, 221, 255)'
    const textColor = currentTheme.color.val
    const primaryColor = currentTheme.primary.val

    const themes: { label: string; value: ThemeSetting; icon: string }[] = [
        { label: 'System', value: 'system', icon: 'widgets' },
        { label: 'Light', value: 'light', icon: 'weather-sunny' },
        { label: 'Dark', value: 'dark', icon: 'lightbulb-night' },
        { label: 'OLED', value: 'oled', icon: 'brightness-3' },
    ]

    return (
        <Animated.View 
            entering={FadeIn.duration(600)} 
            exiting={FadeOutUp.duration(400)}
            style={styles.container}
        >
            <View style={styles.content}>
                {/* Header */}
                <Animated.View entering={FadeInDown.delay(200).springify()}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: textColor }]}>VIBE CHECK</Text>
                        <Text style={[styles.subtitle, { color: textColor }]}>Choose your visual style</Text>
                    </View>
                </Animated.View>

                {/* Theme Cards Grid */}
                <View style={styles.grid}>
                    {themes.map((t, index) => {
                        const isSelected = theme === t.value
                        return (
                            <Animated.View
                                key={t.value}
                                entering={ZoomIn.delay(400 + index * 100).springify()}
                                style={styles.gridItem}
                            >
                                <Pressable 
                                    onPress={() => setTheme(t.value)}
                                    style={({ pressed }) => [
                                        styles.themeCard,
                                        { 
                                            backgroundColor: isSelected 
                                                ? (isLight ? 'rgba(109, 47, 255, 0.2)' : 'rgba(255,255,255,0.2)')
                                                : (isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'),
                                            borderColor: isSelected 
                                                ? primaryColor
                                                : (isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)'),
                                            shadowColor: isSelected ? primaryColor : 'transparent',
                                        },
                                        isSelected && styles.themeCardSelected,
                                        pressed && styles.themeCardPressed,
                                    ]}
                                >
                                    {/* Selection Indicator */}
                                    {isSelected && (
                                        <Animated.View 
                                            entering={ZoomIn.springify()}
                                            style={styles.checkIcon}
                                        >
                                            {/* @ts-ignore */}
                                            <MaterialDesignIcon name="check-circle" size={24} color={primaryColor} />
                                        </Animated.View>
                                    )}
                                    
                                    {/* Icon Circle */}
                                    <View style={[
                                        styles.iconCircle,
                                        { backgroundColor: isSelected 
                                            ? (isLight ? 'rgba(109, 47, 255, 0.2)' : 'rgba(255,255,255,0.2)')
                                            : (isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)')
                                        },
                                        isSelected && styles.iconCircleSelected
                                    ]}>
                                        {/* @ts-ignore */}
                                        <MaterialDesignIcon 
                                            name={t.icon as any} 
                                            size={32} 
                                            color={textColor}
                                            style={{ opacity: isSelected ? 1 : 0.7 }}
                                        />
                                    </View>
                                    
                                    <Text style={[
                                        styles.themeLabel,
                                        { color: textColor },
                                        isSelected && styles.themeLabelSelected
                                    ]}>
                                        {t.label}
                                    </Text>
                                </Pressable>
                            </Animated.View>
                        )
                    })}
                </View>

                {/* Next Button */}
                <Animated.View entering={FadeInDown.delay(800).springify()}>
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
                        CONTINUE
                    </Button>
                </Animated.View>
            </View>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    content: {
        gap: 32,
        paddingHorizontal: 20,
    },
    header: {
        gap: 12,
        alignItems: 'center',
    },
    title: {
        fontSize: 40,
        fontWeight: 'bold',
        textAlign: 'center',
        letterSpacing: 1,
        fontFamily: 'Figtree-Black',
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowRadius: 10,
    },
    subtitle: {
        fontSize: 18,
        opacity: 0.85,
        textAlign: 'center',
        fontFamily: 'Figtree-Medium',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
    },
    gridItem: {
        width: '47%',
    },
    themeCard: {
        borderWidth: 2,
        borderRadius: 16,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        position: 'relative',
    },
    themeCardSelected: {
        shadowRadius: 20,
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 8 },
    },
    themeCardPressed: {
        transform: [{ scale: 0.95 }],
        opacity: 0.9,
    },
    checkIcon: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCircleSelected: {
    },
    themeLabel: {
        fontWeight: '600',
        fontSize: 18,
        opacity: 0.8,
        fontFamily: 'Figtree-SemiBold',
    },
    themeLabelSelected: {
        fontWeight: 'bold',
        opacity: 1,
        fontFamily: 'Figtree-Bold',
    },
})

import { useMemo } from 'react'
import { Animated, StyleSheet, useWindowDimensions } from 'react-native'
import Snowflake from './snowflake'
import LinearGradient from 'react-native-linear-gradient'

const SNOWFLAKE_COUNT = 50

const SnowFlakeBackground = () => {
	const { width, height } = useWindowDimensions()

	const snowflakes = Array.from({ length: SNOWFLAKE_COUNT }, (_, index) => ({
		id: index,
		x: Math.random() * 100,
		delay: Math.random() * 5000,
		duration: 8000 + Math.random() * 7000,
		opacity: 0.3 + Math.random() * 0.7,
		size: 12 + Math.random() * 16,
	}))

	const colors = [
		'rgba(230,240,255,0.1)',
		'rgba(220,235,255,0.08)',
		'rgba(210,230,255,0.06)',
		'rgba(200,225,255,0.04)',
	]

	return (
		<Animated.View style={[styles.snowflakeContainer, { width, height }]} pointerEvents='none'>
			<LinearGradient
				colors={colors}
				style={styles.gradient}
				start={{ x: 0, y: 0 }}
				end={{ x: 0, y: 1 }}
			/>
			{snowflakes.map((snowflake) => (
				<Snowflake
					key={snowflake.id}
					delay={snowflake.delay}
					duration={snowflake.duration}
					opacity={snowflake.opacity}
					x={snowflake.x}
					size={snowflake.size}
				/>
			))}
		</Animated.View>
	)
}

const styles = StyleSheet.create({
	snowflakeContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		zIndex: 999,
		overflow: 'hidden',
	},
	gradient: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	},
})

export default SnowFlakeBackground

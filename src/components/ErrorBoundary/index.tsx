import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native'

type Props = {
	reloader: number
	onRetry: () => void
	onError?: (error: Error, info: React.ErrorInfo) => void
	children: React.ReactNode
}

type State = {
	hasError: boolean
	error: Error | null
}

export default class ErrorBoundary extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props)
		this.state = { hasError: false, error: null }
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error }
	}

	componentDidCatch(error: Error, info: React.ErrorInfo) {
		if (__DEV__) return
		this.setState({ hasError: true, error })
	}

	componentDidUpdate(prevProps: Props) {
		// Reset error state if reloader prop changes
		if (this.props.reloader !== prevProps.reloader) {
			this.setState({ hasError: false, error: null })
		}
	}

	handleRetry = () => {
		if (this.props.onRetry) this.props.onRetry()
		// Parent should increment reloader to trigger reset
	}

	render() {
		if (this.state.hasError) {
			return (
				<View style={styles.container}>
					<Text style={styles.emoji}>🎵😵‍💫</Text>
					<Text style={styles.title}>Oops! That was a wrong note.</Text>
					<Text style={styles.subtitle}>
						Jellify stopped unexpectedly. Lets tune things up and try again!
					</Text>
					<TouchableOpacity style={styles.button} onPress={this.handleRetry}>
						<Text style={styles.buttonText}>Retry</Text>
					</TouchableOpacity>
					{/* {__DEV__ && this.state.error && (
						<Text style={styles.devError}>{this.state.error.toString()}</Text>
					)} */}
				</View>
			)
		}
		return this.props.children
	}
}

const { width, height } = Dimensions.get('window')
const styles = StyleSheet.create({
	container: {
		flex: 1,
		width,
		height,
		backgroundColor: '#18181b',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 32,
	},
	emoji: { fontSize: 60, marginBottom: 16 },
	title: {
		color: '#fff',
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 12,
		textAlign: 'center',
	},
	subtitle: {
		color: '#a1a1aa',
		fontSize: 16,
		marginBottom: 32,
		textAlign: 'center',
		lineHeight: 22,
	},
	button: {
		backgroundColor: '#2563eb',
		borderRadius: 25,
		paddingVertical: 12,
		paddingHorizontal: 32,
		marginTop: 8,
	},
	buttonText: {
		color: '#fff',
		fontSize: 17,
		fontWeight: '600',
		letterSpacing: 1,
	},
	devError: {
		marginTop: 24,
		color: '#f87171',
		fontSize: 12,
		textAlign: 'center',
	},
})

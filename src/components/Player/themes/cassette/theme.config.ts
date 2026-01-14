import type { ThemeConfigSchema } from '../schema'

/**
 * Cassette Theme Configuration Schema
 *
 * This defines all customizable aspects of the cassette player theme.
 * The settings UI is auto-generated from this schema.
 *
 * Enthusiasts can export their customizations as JSON and share them,
 * or manually edit values for fine-grained control.
 */
const cassetteConfig: ThemeConfigSchema = {
	version: 1,

	meta: {
		id: 'cassette',
		name: 'Cassette',
		description: 'Retro tape deck with spinning reels',
		author: 'Jellify',
		icon: 'cassette',
		experimental: true,
	},

	settings: {
		// ========================================
		// Cassette Body
		// ========================================
		cassette: {
			type: 'group',
			label: 'Cassette Body',
			description: 'Customize the cassette tape appearance',
			settings: {
				bodyColor: {
					type: 'color',
					label: 'Body Color',
					description: 'Main cassette shell color',
					default: '#D4C4B5',
				},
				bodyStyle: {
					type: 'choice',
					label: 'Body Style',
					default: 'classic',
					options: [
						{
							value: 'classic',
							label: 'Classic Beige',
							description: 'Traditional cassette look',
						},
						{
							value: 'clear',
							label: 'Clear Plastic',
							description: 'Transparent shell',
						},
						{ value: 'black', label: 'Chrome Black', description: 'Sleek dark finish' },
						{ value: 'white', label: 'Pure White', description: 'Clean minimal look' },
					],
				},
				showScrews: {
					type: 'toggle',
					label: 'Show Screws',
					description: 'Display decorative screw details',
					default: true,
				},
				shadowIntensity: {
					type: 'slider',
					label: 'Shadow Intensity',
					description: 'Depth of drop shadow',
					default: 0.4,
					min: 0,
					max: 1,
					step: 0.1,
				},
			},
		},

		// ========================================
		// Tape Reels
		// ========================================
		reels: {
			type: 'group',
			label: 'Tape Reels',
			description: 'Configure the spinning tape reels',
			settings: {
				tapeColor: {
					type: 'color',
					label: 'Tape Color',
					description: 'Color of the magnetic tape',
					default: '#3D2A1F',
				},
				animate: {
					type: 'toggle',
					label: 'Animate Reels',
					description: 'Spin reels during playback',
					default: true,
				},
				speed: {
					type: 'slider',
					label: 'Spin Speed',
					description: 'How fast the reels rotate',
					default: 1.0,
					min: 0.5,
					max: 2.0,
					step: 0.1,
					unit: 'x',
				},
				showTapeProgress: {
					type: 'toggle',
					label: 'Show Tape Progress',
					description: 'Tape amount changes with playback position',
					default: true,
				},
			},
		},

		// ========================================
		// Label Area
		// ========================================
		label: {
			type: 'group',
			label: 'Label Area',
			description: 'Customize the cassette label',
			settings: {
				style: {
					type: 'choice',
					label: 'Label Style',
					default: 'album-art',
					options: [
						{
							value: 'album-art',
							label: 'Album Artwork',
							description: 'Show album art as label',
						},
						{
							value: 'vintage',
							label: 'Vintage Paper',
							description: 'Classic paper label look',
						},
						{
							value: 'typed',
							label: 'Typewriter',
							description: 'Hand-typed label style',
						},
						{ value: 'minimal', label: 'Minimal', description: 'Clean, simple text' },
					],
				},
				vintageOverlay: {
					type: 'toggle',
					label: 'Vintage Overlay',
					description: 'Add aged paper effect to label',
					default: true,
				},
				labelColor: {
					type: 'color',
					label: 'Label Background',
					description: 'Background color (when not using album art)',
					default: '#F5E6D3',
				},
			},
		},

		// ========================================
		// Counter Display
		// ========================================
		counter: {
			type: 'group',
			label: 'Counter Display',
			description: 'Configure the time/position display',
			settings: {
				style: {
					type: 'choice',
					label: 'Counter Style',
					default: 'mechanical',
					options: [
						{
							value: 'mechanical',
							label: 'Mechanical',
							description: 'Flip digit display',
						},
						{ value: 'digital', label: 'Digital LCD', description: 'Green LCD style' },
						{ value: 'led', label: 'LED', description: 'Red LED segments' },
						{ value: 'hidden', label: 'Hidden', description: 'Hide counter entirely' },
					],
				},
				digitColor: {
					type: 'color',
					label: 'Digit Color',
					description: 'Color of the counter digits',
					default: '#E8B87D',
				},
				showDuration: {
					type: 'toggle',
					label: 'Show Duration',
					description: 'Display total track length',
					default: true,
				},
			},
		},

		// ========================================
		// Controls
		// ========================================
		controls: {
			type: 'group',
			label: 'Transport Controls',
			description: 'Playback button styling',
			settings: {
				style: {
					type: 'choice',
					label: 'Button Style',
					default: 'raised',
					options: [
						{ value: 'raised', label: 'Raised', description: '3D tactile buttons' },
						{ value: 'flat', label: 'Flat', description: 'Modern flat design' },
						{ value: 'chrome', label: 'Chrome', description: 'Shiny metal buttons' },
					],
				},
				buttonColor: {
					type: 'color',
					label: 'Button Color',
					description: 'Primary button background',
					default: '#5A3A2A',
				},
				haptics: {
					type: 'toggle',
					label: 'Haptic Feedback',
					description: 'Vibrate on button press',
					default: true,
				},
			},
		},

		// ========================================
		// Background
		// ========================================
		background: {
			type: 'group',
			label: 'Background',
			description: 'Player background settings',
			settings: {
				style: {
					type: 'choice',
					label: 'Background Style',
					default: 'gradient',
					options: [
						{
							value: 'gradient',
							label: 'Warm Gradient',
							description: 'Brown/amber gradient',
						},
						{
							value: 'solid',
							label: 'Solid Color',
							description: 'Single color background',
						},
						{
							value: 'wood',
							label: 'Wood Grain',
							description: 'Textured wood pattern',
						},
						{
							value: 'album-blur',
							label: 'Album Blur',
							description: 'Blurred album artwork',
						},
					],
				},
				color: {
					type: 'color',
					label: 'Background Color',
					description: 'Primary background color',
					default: '#2C1810',
				},
				opacity: {
					type: 'slider',
					label: 'Overlay Opacity',
					description: 'Darkness of background overlay',
					default: 0.85,
					min: 0.5,
					max: 1,
					step: 0.05,
				},
			},
		},
	},

	// ========================================
	// Presets
	// ========================================
	presets: [
		{
			id: 'classic',
			name: 'Classic',
			description: 'Traditional beige cassette',
			values: {
				'cassette.bodyColor': '#D4C4B5',
				'cassette.bodyStyle': 'classic',
				'reels.tapeColor': '#3D2A1F',
				'label.style': 'album-art',
				'counter.style': 'mechanical',
				'background.style': 'gradient',
			},
		},
		{
			id: 'chrome-noir',
			name: 'Chrome Noir',
			description: 'Sleek black with chrome accents',
			values: {
				'cassette.bodyColor': '#1A1A1A',
				'cassette.bodyStyle': 'black',
				'reels.tapeColor': '#2D2D2D',
				'label.style': 'minimal',
				'counter.style': 'led',
				'counter.digitColor': '#FF3333',
				'controls.style': 'chrome',
				'background.style': 'solid',
				'background.color': '#0D0D0D',
			},
		},
		{
			id: 'clear-90s',
			name: '90s Clear',
			description: 'Transparent shell, visible mechanics',
			values: {
				'cassette.bodyColor': '#E8E8E8',
				'cassette.bodyStyle': 'clear',
				'cassette.shadowIntensity': 0.2,
				'reels.tapeColor': '#4A3A2A',
				'label.style': 'typed',
				'counter.style': 'digital',
				'counter.digitColor': '#33FF66',
				'background.style': 'album-blur',
			},
		},
		{
			id: 'minimal-white',
			name: 'Minimal White',
			description: 'Clean, modern interpretation',
			values: {
				'cassette.bodyColor': '#FFFFFF',
				'cassette.bodyStyle': 'white',
				'cassette.showScrews': false,
				'cassette.shadowIntensity': 0.15,
				'reels.tapeColor': '#333333',
				'label.style': 'minimal',
				'label.vintageOverlay': false,
				'counter.style': 'hidden',
				'controls.style': 'flat',
				'controls.buttonColor': '#333333',
				'background.style': 'solid',
				'background.color': '#F5F5F5',
			},
		},
	],
}

export default cassetteConfig

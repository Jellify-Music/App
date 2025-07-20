import {
	ListTemplateConfig,
	NowPlayingTemplateConfig,
	TabBarTemplateConfig,
} from 'react-native-carplay'

jest.mock('react-native-carplay', () => {
	return {
		ListTemplate: class {
			config: ListTemplateConfig

			constructor(config: ListTemplateConfig) {
				this.config = config
			}
		},
		NowPlayingTemplate: class {
			config: NowPlayingTemplateConfig

			constructor(config: NowPlayingTemplateConfig) {
				this.config = config
			}
		},
		TabBarTemplate: class {
			config: TabBarTemplateConfig

			constructor(config: TabBarTemplateConfig) {
				this.config = config
			}
		},
		checkForConnection: jest.fn(), // if needed as a named export too
	}
})

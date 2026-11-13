const { defineConfig } = require('eslint/config')

const tsParser = require('@typescript-eslint/parser')
const typescriptEslint = require('@typescript-eslint/eslint-plugin')
const react = require('eslint-plugin-react')
const reactNative = require('@react-native/eslint-plugin')
const unusedImports = require('eslint-plugin-unused-imports')
const globals = require('globals')
const js = require('@eslint/js')

const { FlatCompat } = require('@eslint/eslintrc')

const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
})

module.exports = defineConfig([
	{
		extends: compat.extends(
			'eslint:recommended',
			'plugin:react/recommended',
			'plugin:@typescript-eslint/recommended',
		),

		languageOptions: {
			parser: tsParser,

			globals: {
				...globals.browser,
				...globals.node,
				...globals.jest,
			},
		},

		plugins: {
			'@typescript-eslint': typescriptEslint,
			'@react-native': reactNative,
			react,
			'unused-imports': unusedImports,
		},

		rules: {
			'react/react-in-jsx-scope': 'off',
			'@typescript-eslint/no-unused-vars': 'off',
			'unused-imports/no-unused-imports': 'error',
			'@typescript-eslint/no-require-imports': 'off',
			'@typescript-eslint/no-empty-object-type': 'off',
			'react/prop-types': 'off',
			'@typescript-eslint/no-explicit-any': 'error',
			'no-mixed-spaces-and-tabs': 'off',
			semi: ['error', 'never'],
			// Prevent importing RefreshControl from react-native-gesture-handler
			// as it uses deprecated findNodeHandle which causes warnings in StrictMode.
			// Use RefreshControl from 'react-native' instead.
			'no-restricted-imports': [
				'error',
				{
					paths: [
						{
							name: 'react-native-gesture-handler',
							importNames: ['RefreshControl'],
							message:
								"Import RefreshControl from 'react-native' instead. The gesture-handler version uses deprecated findNodeHandle which causes warnings in StrictMode.",
						},
						{
							name: 'react',
							importNames: ['useMemo', 'useCallback'],
							message:
								'`useMemo` and `useCallback` are not necessary since this project uses the React Compiler for automatic memoization.',
						},
					],
				},
			],
		},

		settings: {
			react: {
				version: 'detect',
			},
		},
	},
	{
		// Type-aware rules — these need the TypeScript program, so scope them to TS sources
		files: ['**/*.ts', '**/*.tsx'],

		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: __dirname,
			},
		},

		rules: {
			'@typescript-eslint/no-deprecated': 'error',
		},
	},
])

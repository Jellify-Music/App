const { defineConfig } = require('eslint/config')

const tsParser = require('@typescript-eslint/parser')
const typescriptEslint = require('@typescript-eslint/eslint-plugin')
const react = require('eslint-plugin-react')
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
			react,
		},

		rules: {
			'react/react-in-jsx-scope': 'off',
			'@typescript-eslint/no-unused-vars': 'off',
			'@typescript-eslint/no-require-imports': 'off',
			'@typescript-eslint/no-empty-object-type': 'off',
			'react/prop-types': 'off',
			'@typescript-eslint/no-explicit-any': 'error',
			'no-mixed-spaces-and-tabs': 'off',
			semi: ['error', 'never'],
		},

		settings: {
			react: {
				version: 'detect',
			},
		},
	},
])

module.exports = {
	root: true,
	extends: [
		'eslint:recommended',
		'plugin:react/recommended',
		'plugin:@typescript-eslint/recommended',
	],
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint', 'react'],
	env: {
		browser: true,
		node: true,
		jest: true,
	},
	rules: {
		'react/react-in-jsx-scope': 'off',
		'@typescript-eslint/no-unused-vars': 'off',
		'@typescript-eslint/no-require-imports': 'off',
		'@typescript-eslint/no-empty-object-type': 'off',
		'react/prop-types': 'off',
		'@typescript-eslint/no-explicit-any': 'error', // Disallow usage of any
		'no-mixed-spaces-and-tabs': 'off', // refer https://github.com/prettier/prettier/issues/4199
		semi: ['error', 'never'],
	},
	settings: {
		react: {
			version: 'detect',
		},
	},
}

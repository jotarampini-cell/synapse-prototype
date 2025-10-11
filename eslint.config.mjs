import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'

export default [
	js.configs.recommended,
	{
		files: ['**/*.{js,jsx,ts,tsx}'],
		languageOptions: {
			parser: typescriptParser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
				ecmaFeatures: {
					jsx: true,
				},
			},
			globals: {
				console: 'readonly',
				process: 'readonly',
				Buffer: 'readonly',
				__dirname: 'readonly',
				__filename: 'readonly',
				global: 'readonly',
				module: 'readonly',
				require: 'readonly',
				exports: 'readonly',
				window: 'readonly',
				document: 'readonly',
				navigator: 'readonly',
				location: 'readonly',
			},
		},
		plugins: {
			'@typescript-eslint': typescript,
			react,
			'react-hooks': reactHooks,
			'jsx-a11y': jsxA11y,
		},
		rules: {
			// TypeScript rules
			'@typescript-eslint/no-unused-vars': 'error',
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/prefer-const': 'error',
			'@typescript-eslint/no-var-requires': 'error',
			
			// React rules
			'react/react-in-jsx-scope': 'off', // Not needed in Next.js
			'react/prop-types': 'off', // Using TypeScript
			'react/jsx-uses-react': 'off',
			'react/jsx-uses-vars': 'error',
			'react/jsx-key': 'error',
			'react/jsx-no-duplicate-props': 'error',
			'react/jsx-no-undef': 'error',
			'react/no-children-prop': 'error',
			'react/no-danger-with-children': 'error',
			'react/no-deprecated': 'error',
			'react/no-direct-mutation-state': 'error',
			'react/no-find-dom-node': 'error',
			'react/no-is-mounted': 'error',
			'react/no-render-return-value': 'error',
			'react/no-string-refs': 'error',
			'react/no-unescaped-entities': 'error',
			'react/no-unknown-property': 'error',
			'react/no-unsafe': 'error',
			'react/require-render-return': 'error',
			
			// React Hooks rules
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',
			
			// Accessibility rules
			'jsx-a11y/alt-text': 'error',
			'jsx-a11y/anchor-has-content': 'error',
			'jsx-a11y/anchor-is-valid': 'error',
			'jsx-a11y/aria-activedescendant-has-tabindex': 'error',
			'jsx-a11y/aria-props': 'error',
			'jsx-a11y/aria-proptypes': 'error',
			'jsx-a11y/aria-role': 'error',
			'jsx-a11y/aria-unsupported-elements': 'error',
			'jsx-a11y/click-events-have-key-events': 'warn',
			'jsx-a11y/heading-has-content': 'error',
			'jsx-a11y/html-has-lang': 'error',
			'jsx-a11y/iframe-has-title': 'error',
			'jsx-a11y/img-redundant-alt': 'error',
			'jsx-a11y/no-access-key': 'error',
			'jsx-a11y/no-autofocus': 'warn',
			'jsx-a11y/no-distracting-elements': 'error',
			'jsx-a11y/no-interactive-element-to-noninteractive-role': 'error',
			'jsx-a11y/no-noninteractive-element-interactions': 'warn',
			'jsx-a11y/no-noninteractive-element-to-interactive-role': 'error',
			'jsx-a11y/no-noninteractive-tabindex': 'error',
			'jsx-a11y/no-redundant-roles': 'error',
			'jsx-a11y/no-static-element-interactions': 'warn',
			'jsx-a11y/role-has-required-aria-props': 'error',
			'jsx-a11y/role-supports-aria-props': 'error',
			'jsx-a11y/scope': 'error',
			'jsx-a11y/tabindex-no-positive': 'error',
			
			// General JavaScript rules
			'no-unused-vars': 'off', // Using TypeScript version
			'no-console': 'warn',
			'prefer-const': 'error',
			'no-var': 'error',
			'no-undef': 'off', // TypeScript handles this
			'no-redeclare': 'off', // TypeScript handles this
		},
		settings: {
			react: {
				version: 'detect',
			},
		},
	},
	{
		files: ['**/*.js'],
		languageOptions: {
			parser: js,
		},
	},
]
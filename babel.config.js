/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
module.exports = {
	presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
	plugins: [
		'@babel/plugin-transform-runtime',
		'@babel/plugin-proposal-class-properties',
		'babel-plugin-styled-components',
		[
			'i18next-extract',
			{
				outputPath: 'translations/{{ns}}.json',
				discardOldKeys: false,
				defaultNS: 'en',
				jsonSpace: 4,
				compatibilityJSON: 'v4'
			}
		]
	]
};

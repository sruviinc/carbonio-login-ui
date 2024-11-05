/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import Dotenv from 'dotenv-webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import webpack from 'webpack';
import webpackDevServer from 'webpack-dev-server';

import pkg from './package.json';

const config = (
	env: Record<string, unknown>,
	args: { mode?: webpack.Configuration['mode'] }
): webpack.Configuration & webpackDevServer.Configuration => {
	const pkgRel = args.mode === 'development' ? Date.now() : 1;
	return {
		mode: args.mode,
		devtool: 'source-map',
		entry: {
			index: path.resolve(process.cwd(), 'src', 'index.jsx')
		},
		output: {
			path: `${__dirname}/dist`
		},
		target: 'web',
		devServer: {
			proxy: {
				'/zx': {
					target: 'https://infra-848931f5.testarea.zextras.com',
					secure: false
				}
			},
			webSocketServer: false
		},
		resolve: {
			extensions: ['*', '.js', '.jsx', '.ts', '.tsx'],
			alias: {
				assets: path.resolve(process.cwd(), 'assets')
			}
		},
		module: {
			rules: [
				{
					test: /\.[jt]sx?$/,
					exclude: /node_modules/,
					loader: 'babel-loader'
				},
				{
					test: /\.html$/,
					use: [
						{
							loader: 'html-loader'
						}
					]
				},
				{
					test: /\.(css)$/,
					use: [
						{
							loader: 'style-loader'
						},
						{
							loader: 'css-loader',
							options: {
								importLoaders: 1,
								sourceMap: true
							}
						},
						{
							loader: 'postcss-loader',
							options: {
								sourceMap: true
							}
						}
					]
				},
				{
					test: /\.(png|jpg|gif|woff2?|svg|eot|ttf|ogg|mp3)$/,
					// exclude: /assets/,
					use: [
						{
							loader: 'file-loader',
							options: {
								outputPath: 'assets'
							}
						}
					]
				},
				/////////////////////Sruvi
				{
					test: /\.(woff(2)?|ttf|eot|svg|otf)(\?v=\d+\.\d+\.\d+)?$/,
					use: [
						{
							loader: 'file-loader',
							options: {
								name: '[name].[ext]',
								outputPath: 'fonts/'
							}
						}
					]
				}

				/////////////////////Sruvi
			]
		},
		plugins: [
			new CleanWebpackPlugin(),
			new CopyPlugin({
				patterns: [
					{ from: 'CHANGELOG.md', to: '.', noErrorOnMissing: true },
					{ from: './package/yap.json', to: '.' },
					{
						from: './package/PKGBUILD.template',
						to: 'package/PKGBUILD',
						toType: 'file',
						transform: (content): string => {
							return content
								.toString()
								.replaceAll('{{version}}', pkg.version)
								.replaceAll('{{pkgRel}}', `${pkgRel}`);
						}
					},
					{ from: 'src/mockServiceWorker.js', to: 'mockServiceWorker.js' }
				]
			}),
			new HtmlWebpackPlugin({
				inject: true,
				template: './src/index.html',
				filename: './index.html',
				chunks: ['index'],
				meta: {
					'app-version': pkg.version
				}
			}),
			new Dotenv({
				ignoreStub: true
			})
		]
	};
};

export default config;

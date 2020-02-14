const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
	target: 'node',
	entry: './src/index.ts',
	devtool: 'inline-source-map',
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	// resolve: {
	// 	extensions: [ '.tsx', '.ts', '.js' ],
	// 	alias: {
	// 		'./build/Release/memoryjs$': path.resolve(__dirname, 'build/Release'),
	// 	},
	// },
	// output: {
	// 	filename: 'bundle.js',
	// 	path: path.resolve(__dirname, 'dist'),
	// },
	plugins: [
		new CopyPlugin([
			{
				from: 'node_modules/*/build/Release/*',
				to: '../build/Release/[name].[ext]',
			},
		]),
	],
};

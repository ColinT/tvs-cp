const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = [
  {
    target: 'electron-renderer',
    entry: {
      renderer: path.join(__dirname, 'src/renderer/index.tsx'),
    },
    output: {
      filename: 'renderer.js',
      path: path.join(__dirname, 'dist'),
    },
    devtool: 'source-map',
    node: {
      __dirname: true,
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'awesome-typescript-loader',
        },
        {
          test: /\.(png|jpg)$/,
          loader: 'url-loader',
          options: {
            limit: 25000,
            prefix: path.join(__dirname, 'build'),
          },
        },
        {
          test: /\.(woff|ttf)$/,
          loader: 'url-loader',
          options: {
            limit: 25000,
            prefix: path.join(__dirname, 'build'),
          },
        },
        {
          test: /\.s?[ac]ss$/i,
          use: [
            // Creates `style` nodes from JS strings
            'style-loader',
            // Translates CSS into CommonJS
            'css-loader',
            // Compiles Sass to CSS
            'sass-loader',
          ],
        },
      ],
    },
    resolve: {
      extensions: [ '.tsx', '.ts', '.js', '.jsx', '.json' ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: 'src/renderer/index.html',
      }),
    ],
  },
  // {
  //   target: 'electron-main',
  //   entry: path.join(__dirname, 'src/main/index.ts'),
  //   output: {
  //     filename: 'index.js',
  //     path: path.join(__dirname, 'dist'),
  //   },
  //   devtool: 'inline-source-map',
  //   node: {
  //     __dirname: false,
  //     __filename: false,
  //   },
  //   externals: {
  //     memoryjs$: 'require(require("path").resolve(__dirname, "memoryjs"))',
  //   },
  //   resolve: {
  //     extensions: [ '.ts', '.js', '.json' ],
  //     alias: {
  //       'build/Release/memoryjs': path.resolve(__dirname, 'build/Release'),
  //     },
  //   },
  //   module: {
  //     rules: [
  //       {
  //         test: /\.tsx?$/,
  //         loader: 'awesome-typescript-loader',
  //       },
  //     ],
  //   },
  //   plugins: [
  //     new CopyPlugin([
  //       {
  //         from: 'node_modules/*/build/Release/*',
  //         to: '../dist/build/Release/[name].[ext]',
  //       },
  //     ]),
  //   ],
  // },
];

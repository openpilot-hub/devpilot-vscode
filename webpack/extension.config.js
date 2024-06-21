//@ts-check

'use strict';

const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
const extensionConfig = {
  target: 'node',
	mode: 'none',
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2'
  },
  externals: {
    vscode: 'commonjs vscode'
  },
  resolve: {
    extensions: ['.ts', '.js', '.wasm'],
    alias: {
      '@': path.resolve(__dirname, '../src')
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      },
      {
        test: /\.html$/,
        exclude: /node_modules/,
        type: "asset/source"
      },
      {
        test: /\.wasm$/,
        type: "asset/source"
      }
    ]
  },
  devtool: 'nosources-source-map',
  infrastructureLogging: {
    level: "log", // enables logging required for problem matchers
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'node_modules/web-tree-sitter/tree-sitter.wasm', to: 'tree-sitter.wasm' },
        { from: "resources", to: "resources" },
      ],
    }),
  ],
};
module.exports = [ extensionConfig ];
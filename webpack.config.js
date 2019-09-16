const path = require('path')
const webpack = require('webpack')
const CopyPlugin = require('copy-webpack-plugin')
const mode = process.env.NODE_ENV || 'production'

module.exports = {
  output: {
    filename: `worker.${mode}.js`,
    path: path.join(__dirname, 'dist'),
  },
  devtool: 'source-map',
  mode,
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    plugins: [
      // new CopyPlugin([
      //   //we need to manually copy this instead of requiring from
      //   //our script source code, since wasm files are bound to global scope
      //   //in workers, rather than being fetched like the browser.
      //   //wranglerjs also needs to see a wasm file in order for it to be sent to the api
      //   //correctly.
      //   { from: './src/pixelmatch.wasm', to: './worker/pixelmatch.wasm' },
      // ])
    ],
  },
  module: {
    rules: [
      {
        test: /\.wasm$/,
        type: "javascript/auto", // ← !!
        loader: "file-loader",
        options: {
          publicPath: "dist/"
        }
			},
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          transpileOnly: true,
        },
      },
      { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' },
    ]
  },
}

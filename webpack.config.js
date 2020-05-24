/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')

module.exports = (env, argv) => {
  const IS_DEV = argv.mode === 'development'
  return {
    entry: './src/assetStore.ts',
    output: {
      filename: './assetStore.js',
      path: path.resolve(__dirname, 'dist'),
    },
    optimization: {
      minimizer: [new TerserPlugin({}), new OptimizeCssAssetsPlugin({})],
    },
    devtool: IS_DEV ? 'source-map' : '',
    devServer: {
      contentBase: path.resolve(__dirname, 'dist'),
      watchContentBase: true,
      port: 3000,
      historyApiFallback: true,
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.worker\.(js|ts)$/,
          loader: 'worker-loader',
          options: {
            name: 'worker/[name].js',
          },
        },
        {
          test: /\.ts$/,
          use: [
            {
              loader: 'ts-loader',
            },
          ],
          exclude: /node_modules/,
        },
        {
          test: /\.js$/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env'],
              },
            },
          ],
          exclude: /node_modules/,
        },
        {
          test: /\.(glsl|vert|frag|vs|fs)$/,
          use: ['raw-loader'],
          exclude: /node_modules/,
        },
      ],
    },
    plugins: [
      new CleanWebpackPlugin({
        exclude: ['img'],
      }),
    ],
  }
}

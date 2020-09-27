/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = (env, argv) => {
  const IS_DEV = argv.mode === 'development'
  return {
    entry: {
      assetStore: './src/assetStore.ts'
      // 'loader.worker': './src/workers/loader.worker.ts',
    },
    output: {
      filename: './[name].js',
      path: path.resolve(__dirname, 'dist'),
      library: 'AssetStore',
      libraryTarget: 'umd',
      globalObject: "(typeof self !== 'undefined' ? self : this)",
      umdNamedDefine: true
    },
    optimization: {
      minimizer: [new TerserPlugin({}), new OptimizeCssAssetsPlugin({})]
    },
    devtool: IS_DEV ? 'source-map' : '',
    devServer: {
      contentBase: path.resolve(__dirname, 'dist'),
      watchContentBase: true,
      port: 3000,
      historyApiFallback: true
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    module: {
      rules: [
        {
          test: /\.worker\.(js|ts)$/,
          loader: 'worker-loader',
          options: {
            name: 'workers/[name].js',
            inline: true
          }
        },
        {
          test: /\.ts$/,
          use: [
            {
              loader: 'ts-loader'
            }
          ],
          exclude: /node_modules/
        },
        {
          test: /\.js$/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env']
              }
            }
          ],
          exclude: /node_modules/
        },
        {
          test: /\.(glsl|vert|frag|vs|fs)$/,
          use: ['raw-loader'],
          exclude: /node_modules/
        }
      ]
    },
    plugins: [
      new CleanWebpackPlugin({
        exclude: ['assets']
      }),
      new CopyWebpackPlugin({
        patterns: [{ from: 'src/assets', to: 'assets' }]
      })
    ]
  }
}

/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
// const Sass = require('sass')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
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
      publicPath: '',
      library: 'AssetStore',
      libraryTarget: 'umd',
      globalObject: "(typeof self !== 'undefined' ? self : this)",
      umdNamedDefine: true
    },
    optimization: {
      minimizer: [new TerserPlugin({}), new CssMinimizerPlugin({})]
    },
    devtool: IS_DEV ? 'source-map' : undefined,
    devServer: {
      contentBase: path.resolve(__dirname, 'dist'),
      watchContentBase: true,
      hot: true,
      host: '0.0.0.0',
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
            filename: 'workers/' + (IS_DEV ? '[name].js' : '[name].[hash].js'),
            inline: 'fallback'
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
          type: 'asset/source',
          exclude: /node_modules/
        }
      ]
    },
    plugins: [
      // new HtmlWebpackPlugin({
      //   template: './src/index.html'
      // }),
      // new MiniCssExtractPlugin({
      //   filename: './css/style-[hash].css'
      // }),
      // new CopyWebpackPlugin({
      //   patterns: [{ from: 'src/assets', to: 'assets' }]
      // })
    ]
  }
}

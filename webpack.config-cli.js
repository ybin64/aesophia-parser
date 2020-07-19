const path = require('path');


module.exports = {
  target: 'node',
  entry: './src/cli.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options : {
            compilerOptions : {
                declaration : false
            }
        }
      },
    ],
  },

  resolve: {
    extensions: [ '.ts'],
  },

  output: {
    filename: 'aesophia-parser.js',
    path: path.resolve(__dirname, 'bin'),

    libraryTarget: 'commonjs'
  }
};
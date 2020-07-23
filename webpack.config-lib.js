const path = require('path');


module.exports = {
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options : {
            compilerOptions : {
                declaration : true
            }
        }
      }, {
        test: /\.aes$/i,
        use: [
          {
            loader: 'raw-loader',
            options: {
              esModule: true,
            },
          },
        ]
      },
    ],
  },

  resolve: {
    extensions: [ '.ts'],
  },

  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),

    libraryTarget: 'commonjs'
  },

  /**
   * parser-lib.ts uses 'fs' but is only used by the cli right now
   */
  node : {
      fs : 'empty'
  }
};
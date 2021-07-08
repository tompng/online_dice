module.exports = {
  mode: 'development',
  entry: './index.ts',
  output: {
    path: `${__dirname}/../public`,
    filename: 'index.js'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader'
      },
      {
        test: /\.(frag|vert)$/,
        use: 'raw-loader'
      },
      {
        test: /\.(jpg|png)$/,
        use: 'url-loader'
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  }
}

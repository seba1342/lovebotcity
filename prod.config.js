const path = require('path');

module.exports = {
    mode: "production",
    entry: "./js/main",
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: "bundle.js"
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /(node_modules)/,
          use: {
            loader: 'babel-loader',
            options: {
                "presets": [
                    [
                        "env",
                        {
                        "targets": {
                            "chrome": "60"
                        }
                        }
                    ]
                    ]
            }
          }
        }
      ]
    }
  };
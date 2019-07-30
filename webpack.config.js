const path = require('path');

module.exports = {
    mode: "development",
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
    },
    resolve: {
      alias: {
        '@javascript-algorithms': path.resolve(__dirname, 'js/javascript-algorithms')
      }
    }
  };
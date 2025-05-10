const webpack = require("webpack");
const TerserWebpackPlugin = require("terser-webpack-plugin");
const extName = "application-map";

const isDevelopment = process.env.NODE_ENV === "development";

const config = {
  mode: isDevelopment ? "development" : "production",
  devtool: isDevelopment ? "source-map" : false,
  entry: {
    extension: "./src/index.tsx",
  },
  output: {
    filename: `extension-${extName}.js`,
    path: __dirname + `/dist/resources/extension-${extName}.js`,
    libraryTarget: "window",
    library: ["tmp", "extensions"],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json", ".ttf", ".mjs"],
    alias: {
      // "react/jsx-runtime": require.resolve("react/jsx-runtime"),
      // "react/jsx-dev-runtime": require.resolve("react/jsx-dev-runtime"),
    },
  },
  externals: {
    react: "React",
    "react-dom": "ReactDOM",
    moment: "Moment",
  },
  optimization: !isDevelopment
    ? {
        minimize: true,
        minimizer: [
          new TerserWebpackPlugin({
            terserOptions: {
              format: {
                comments: false,
              },
              compress: {
                drop_console: true,
                drop_debugger: true,
              },
            },
            extractComments: false,
          }),
        ],
      }
    : undefined,
  plugins: [
    new webpack.LoaderOptionsPlugin({
      minimize: !isDevelopment,
      debug: isDevelopment,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        loader: "esbuild-loader",
        options: {
          loader: "tsx",
          target: "es2015",
        },
      },
      {
        test: /\.scss$/,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
};

module.exports = config;

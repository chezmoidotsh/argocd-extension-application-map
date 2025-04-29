const webpack = require("webpack");
const TerserWebpackPlugin = require("terser-webpack-plugin");
const extName = "application-map";

const config = {
    mode: "production",
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
            'react/jsx-runtime': require.resolve('react/jsx-runtime'),
            'react/jsx-dev-runtime': require.resolve('react/jsx-dev-runtime'),
            'elkjs/lib/elk-api': require.resolve('elkjs/lib/elk-api.js')
        }
    },
    externals: {
        react: "React",
        "react-dom": "ReactDOM",
        moment: "Moment",
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserWebpackPlugin({
                terserOptions: {
                    format: {
                        comments: false,
                    },
                },
                extractComments: false,
            }),
        ],
    },
    plugins: [
        new webpack.LoaderOptionsPlugin({
            minimize: true,
            debug: false,
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
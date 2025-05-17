import type { StorybookConfig } from '@storybook/react-webpack5';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    "@storybook/addon-webpack5-compiler-swc",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
};

config.webpackFinal = async (config) => {
  if (!config.module) config.module = { rules: [] };
  if (!config.module.rules) config.module.rules = [];
  config.module.rules.push({
    test: /\.scss$/,
    use: ['style-loader', 'css-loader', 'sass-loader'],
    include: /src/,
  });
  return config;
};

export default config;

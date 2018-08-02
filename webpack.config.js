const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: './src/index.js',
    output: {
        filename: './bundle.js'
    },
    mode: 'production'
};
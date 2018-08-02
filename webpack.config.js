const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: './src/game.js',
    output: {
        filename: './bundle.js'
    },
    mode: 'production'
};
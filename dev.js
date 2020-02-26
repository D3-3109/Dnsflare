const webpack = require('webpack')
const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')
const config = require('./webpack.config')

const compiler = webpack(config)
const app = express()

const devMiddleware = webpackDevMiddleware(compiler, {
    publicPath: config.output.publicPath,
    quiet: true,
})

app.use(webpackHotMiddleware(compiler))
app.use(devMiddleware)

app.use('/api', createProxyMiddleware({
    target: 'https://api.cloudflare.com/client/v4',
    changeOrigin: true,
    autoRewrite: true,
}))

app.get('*', (req, res) => {
    let fileBuffer = null

    try {
        // Try read file from filesystem
        fileBuffer = devMiddleware.fileSystem.readFileSync(`${config.output.path}/..${req.path}`)

        if (req.path.endsWith('.js')) {
            res.type('application/javascript')
        }
    } catch (err) {
        // if not exsit
        fileBuffer = devMiddleware.fileSystem.readFileSync(`${config.output.path}/../index.html`)
    }

    res.send(fileBuffer.toString())
})

const PORT = process.env.PORT || 8083

app.listen(PORT, 'localhost')
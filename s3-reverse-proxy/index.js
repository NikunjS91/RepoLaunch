const express = require('express');
const httpProxy = require('http-proxy');

const app = express();
const port = 8000;

const BASE_PATH = process.env.BASE_PATH || 'https://s3.amazonaws.com/nextjs-ssr-reverse-proxy';
const proxy = httpProxy.createProxyServer({});
app.use((req, res) => {
    const hostname = req.hostname;
    const subdomain = hostname.split('.')[0];

    const resolveTo = `${BASE_PATH}/${subdomain}`;
    return proxy.web(req,res,{target: resolveTo, changeOrigin: true})
});

proxy.on('proxyReq', (proxyReq, req, res) => {
    const url = req.url;
    if(url ==='/') {
        proxyReq.path += '/index.html';
    return proxyReq;
    }
})

app.listen(port, () =>  console.log(`Reverse proxy server is running on port ${port}`)) 


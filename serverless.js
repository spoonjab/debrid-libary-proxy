import Router from 'router'
import addonInterface from "./addon.js"
import landingTemplate from "./lib/util/landingTemplate.js"
import StreamProvider from './lib/stream-provider.js'
import { decode } from 'urlencode'
import qs from 'querystring'
import requestIp from 'request-ip'
import { getManifest } from './lib/util/manifest.js'
import { parseConfiguration } from './lib/util/configuration.js'
import { BadTokenError, BadRequestError, AccessDeniedError } from './lib/util/error-codes.js'

const router = new Router();

router.get('/', (_, res) => {
    res.redirect('/configure')
})

router.get('/:configuration?/configure', (req, res) => {
    const config = parseConfiguration(req.params.configuration)
    const landingHTML = landingTemplate(addonInterface.manifest, config)
    res.setHeader('content-type', 'text/html')
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet')
    res.end(landingHTML)
})

router.get('/:configuration?/manifest.json', (req, res) => {
    const config = parseConfiguration(req.params.configuration)
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(getManifest(config)))
})

router.get(`/:configuration?/:resource/:type/:id/:extra?.json`, (req, res, next) => {
    const { resource, type, id } = req.params
    const config = parseConfiguration(req.params.configuration)
    config.addonUrl = `${req.protocol}://${req.get('host')}`
    const extra = req.params.extra ? qs.parse(req.url.split('/').pop().slice(0, -5)) : {}

    addonInterface.get(resource, type, id, extra, config)
        .then(resp => {
            let cacheHeaders = {
                cacheMaxAge: 'max-age',
                staleRevalidate: 'stale-while-revalidate',
                staleError: 'stale-if-error'
            }

            const cacheControl = Object.keys(cacheHeaders)
                .map(prop => Number.isInteger(resp[prop]) && cacheHeaders[prop] + '=' + resp[prop])
                .filter(val => !!val).join(', ')

            res.setHeader('Cache-Control', `${cacheControl}, private`)
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify(resp))
        })
        .catch(err => {
            console.error(err)
            handleError(err, res)
        })
})

router.get('/resolve/:debridProvider/:debridApiKey/:id/:hostUrl', (req, res) => {
    const mediaFlowUrl = req.query.mfUrl ? decode(req.query.mfUrl) : null
    const mediaFlowPassword = req.query.mfPass ? decode(req.query.mfPass) : null
    // When MediaFlow is proxying the stream, it fetches the content server-side.
    // Don't forward the client IP to Real-Debrid, or the download link will be
    // locked to the client IP and MediaFlow's server won't be able to fetch it.
    const clientIp = mediaFlowUrl ? null : requestIp.getClientIp(req)

    StreamProvider.resolveUrl(req.params.debridProvider, req.params.debridApiKey, req.params.id, decode(req.params.hostUrl), clientIp)
        .then(url => {
            if (mediaFlowUrl) {
                const filename = url.split('/').pop().split('?')[0]
                const proxied = mediaFlowUrl.replace(/\/$/, '') + '/proxy/stream?d=' + encodeURIComponent(url) + (mediaFlowPassword ? '&api_password=' + encodeURIComponent(mediaFlowPassword) : '') + '&filename=' + encodeURIComponent(filename)
                res.redirect(proxied)
            } else {
                res.redirect(url)
            }
        })
        .catch(err => {
            console.log(err)
            handleError(err, res)
        })
})

router.get('/ping', (_, res) => {
    res.statusCode = 200
    res.end()
})

function handleError(err, res) {
    if (err == BadTokenError) {
        res.writeHead(401)
        res.end(JSON.stringify({ err: 'Bad token' }))
    } else if (err == AccessDeniedError) {
        res.writeHead(403)
        res.end(JSON.stringify({ err: 'Access denied' }))
    } else if (err == BadRequestError) {
        res.writeHead(400)
        res.end(JSON.stringify({ err: 'Bad request' }))
    } else {
        res.writeHead(500)
        res.end(JSON.stringify({ err: 'Server error' }))
    }
}

export default function (req, res) {
    router(req, res, function () {
        res.statusCode = 404;
        res.end();
    });
}
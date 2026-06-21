import packageInfo from "./../../package.json" assert { type: "json" }

// Docs: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/manifest.md
function getManifest(config = {}) {
    const manifest = {
        id: "community.stremio.debrid-library-proxy",
        version: packageInfo.version,
        name: "Debrid Library Proxy",
        description: packageInfo.description,
        background: `/public/background.jpg`,
        logo: `/public/logo.png`,
        catalogs: getCatalogs(config),
        resources: [
            "catalog",
            "stream"
        ],
        types: [
            "movie",
            "series",
            'anime',
            "other"
        ],
        idPrefixes: ['tt'],
        behaviorHints: {
            configurable: true,
            configurationRequired: isConfigurationRequired(config)
        },
    }

    return manifest
}

function getCatalogs(config) {
    if (!(config && config.DebridProvider)) {
        return []
    }

    return [
        {
            "id": `debridlibrary`,
            "name": `Debrid Library - ${config.DebridProvider}`,
            "type": "other",
            "extra": [
                { "name": "search", "isRequired": false },
                { "name": "skip", "isRequired": false }
            ]
        }
    ]
}

function isConfigurationRequired(config) {
    return !(config && config.DebridProvider)
}

export { getManifest }
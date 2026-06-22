import Cinemeta from './util/cinemeta.js'
import DebridLink from './debrid-link.js'
import RealDebrid from './real-debrid.js'
import AllDebrid from './all-debrid.js'
import Premiumize from './premiumize.js'
import TorBox from './torbox.js'
import { BadRequestError } from './util/error-codes.js'
import { FILE_TYPES } from './util/file-types.js'

const STREAM_NAME_MAP = {
    debridlink: "[DL+] Debrid Library",
    realdebrid: "[RD+] Debrid Library",
    alldebrid: "[AD+] Debrid Library",
    premiumize: "[PM+] Debrid Library",
    torbox: "[TB+] Debrid Library"
}

const LANGUAGE_FLAGS = {
    english: '🇬🇧',
    russian: '🇷🇺',
    french: '🇫🇷',
    german: '🇩🇪',
    spanish: '🇪🇸',
    italian: '🇮🇹',
    portuguese: '🇵🇹',
    dutch: '🇳🇱',
    polish: '🇵🇱',
    turkish: '🇹🇷',
    arabic: '🇸🇦',
    chinese: '🇨🇳',
    japanese: '🇯🇵',
    korean: '🇰🇷',
    hindi: '🇮🇳',
    ukrainian: '🇺🇦',
    czech: '🇨🇿',
    romanian: '🇷🇴',
    hungarian: '🇭🇺',
    greek: '🇬🇷',
    swedish: '🇸🇪',
    norwegian: '🇳🇴',
    danish: '🇩🇰',
    finnish: '🇫🇮',
    hebrew: '🇮🇱',
    thai: '🇹🇭',
    vietnamese: '🇻🇳',
    indonesian: '🇮🇩',
}

// Patterns to detect languages from filenames/titles
const LANGUAGE_PATTERNS = [
    { flag: '🇷🇺', patterns: [/\bru\b/i, /\brussian\b/i, /\.ru\./i, /Ultradox/i, /ColdFilm/i, /Rus\b/i] },
    { flag: '🇬🇧', patterns: [/\benglish\b/i, /\beng\b/i, /\ben\b/i, /WEB[- ]?H?\.?264/i, /WEBRip/i, /BluRay/i, /HDTV/i, /\bJFF\b/i, /\bEZTV/i, /\bYIFY\b/i, /\bYTS\b/i] },
    { flag: '🇫🇷', patterns: [/\bfr\b/i, /\bfrench\b/i, /\.fr\./i, /\bVF\b/, /\bVFF\b/] },
    { flag: '🇩🇪', patterns: [/\bde\b/i, /\bgerman\b/i, /\.de\./i, /\bGER\b/i] },
    { flag: '🇪🇸', patterns: [/\bes\b/i, /\bspanish\b/i, /\.es\./i, /\bSPA\b/i, /\bLATINO\b/i] },
    { flag: '🇮🇹', patterns: [/\bit\b/i, /\bitalian\b/i, /\.it\./i, /\bITA\b/i] },
    { flag: '🇵🇹', patterns: [/\bpt\b/i, /\bportuguese\b/i, /\bpob\b/i] },
    { flag: '🇳🇱', patterns: [/\bnl\b/i, /\bdutch\b/i] },
    { flag: '🇵🇱', patterns: [/\bpl\b/i, /\bpolish\b/i] },
    { flag: '🇹🇷', patterns: [/\btr\b/i, /\bturkish\b/i] },
    { flag: '🇸🇦', patterns: [/\bar\b/i, /\barabic\b/i] },
    { flag: '🇨🇳', patterns: [/\bzh\b/i, /\bchinese\b/i, /\bchs\b/i, /\bcht\b/i] },
    { flag: '🇯🇵', patterns: [/\bja\b/i, /\bjapanese\b/i, /\bjpn\b/i] },
    { flag: '🇰🇷', patterns: [/\bko\b/i, /\bkorean\b/i, /\bkor\b/i] },
    { flag: '🇮🇳', patterns: [/\bhi\b/i, /\bhindi\b/i] },
    { flag: '🇺🇦', patterns: [/\bua\b/i, /\bukrainian\b/i, /\bukr\b/i] },
]

function detectLanguageFlags(text) {
    if (!text) return []
    const found = []
    for (const lang of LANGUAGE_PATTERNS) {
        if (lang.patterns.some(p => p.test(text))) {
            found.push(lang.flag)
        }
    }
    // Default to English if no language detected and it looks like a standard release
    if (found.length === 0) found.push('🇬🇧')
    return found
}

function appendMediaFlowParams(url, config) {
    if (!config || !config.MediaFlowUrl) return url
    const sep = url.includes('?') ? '&' : '?'
    let result = url + sep + 'mfUrl=' + encodeURIComponent(config.MediaFlowUrl)
    if (config.MediaFlowPassword) {
        result += '&mfPass=' + encodeURIComponent(config.MediaFlowPassword)
    }
    return result
}

async function getMovieStreams(config, type, id) {
    const cinemetaDetails = await Cinemeta.getMeta(type, id)
    const searchKey = cinemetaDetails.name

    let apiKey = config.DebridLinkApiKey ? config.DebridLinkApiKey : config.DebridApiKey

    if (config.DebridLinkApiKey || config.DebridProvider == "DebridLink") {
        const torrents = await DebridLink.searchTorrents(apiKey, searchKey, 0.1)
        if (torrents && torrents.length) {
            const torrentIds = torrents
                .filter(torrent => filterYear(torrent, cinemetaDetails))
                .map(torrent => torrent.id)

            if (torrentIds && torrentIds.length) {
                return await DebridLink.getTorrentDetails(apiKey, torrentIds.join(), config.addonUrl)
                    .then(torrentDetailsList => {
                        return torrentDetailsList.map(torrentDetails => toStream(torrentDetails, type, config))
                    })
            }
        }
    } else if (config.DebridProvider == "RealDebrid") {
        let results = []
        const torrents = await RealDebrid.searchTorrents(apiKey, searchKey, 0.1)
        if (torrents && torrents.length) {
            const streams = await Promise.all(torrents
                .filter(torrent => filterYear(torrent, cinemetaDetails))
                .map(torrent => {
                return RealDebrid.getTorrentDetails(apiKey, torrent.id, config.addonUrl)
                    .then(torrentDetails => toStream(torrentDetails, type, config))
                    .catch(err => {
                        console.log(err)
                        Promise.resolve()
                    })
            }))
            results.push(...streams)
        }

        const downloads = await RealDebrid.searchDownloads(apiKey, searchKey, 0.1)
        if (downloads && downloads.length) {
            const streams = await Promise.all(downloads
                .filter(download => filterYear(download, cinemetaDetails))
                .map(download => {return toStream(download, type, config)}))
            results.push(...streams)
        }
        return results.filter(stream => stream)
    } else if (config.DebridProvider == "AllDebrid") {
        const torrents = await AllDebrid.searchTorrents(apiKey, searchKey, 0.1)
        if (torrents && torrents.length) {
            const streams = await Promise.all(
                torrents
                    .filter(torrent => filterYear(torrent, cinemetaDetails))
                    .map(torrent => {
                        return AllDebrid.getTorrentDetails(apiKey, torrent.id, config.addonUrl)
                            .then(torrentDetails => toStream(torrentDetails, type, config))
                            .catch(err => {
                                console.log(err)
                                Promise.resolve()
                            })
                    })
            )

            return streams.filter(stream => stream)
        }
    } else if (config.DebridProvider == "Premiumize") {
        const files = await Premiumize.searchFiles(apiKey, searchKey, 0.1)
        if (files && files.length) {
            const streams = await Promise.all(
                files
                    .filter(file => filterYear(file, cinemetaDetails))
                    .map(torrent => {
                        return Premiumize.getTorrentDetails(apiKey, torrent.id, config.addonUrl)
                            .then(torrentDetails => toStream(torrentDetails, type, config))
                            .catch(err => {
                                console.log(err)
                                Promise.resolve()
                            })
                    })
            )

            return streams.filter(stream => stream)
        }
    } else if (config.DebridProvider == "TorBox") {
        const torrents = await TorBox.searchTorrents(apiKey, searchKey, 0.1, config.addonUrl)
        if (torrents && torrents.length) {
            const streams = await Promise.all(
                torrents
                    .filter(torrent => filterYear(torrent, cinemetaDetails))
                    .map(torrentDetails => toStream(torrentDetails, type, config))
            )

            return streams.filter(stream => stream)
        }
    } else {
        return Promise.reject(BadRequestError)
    }

    return []
}

async function getSeriesStreams(config, type, id) {
    const [imdbId, season, episode] = id.split(":")
    const cinemetaDetails = await Cinemeta.getMeta(type, imdbId)
    const searchKey = cinemetaDetails.name

    let apiKey = config.DebridLinkApiKey ? config.DebridLinkApiKey : config.DebridApiKey

    if (config.DebridLinkApiKey || config.DebridProvider == "DebridLink") {
        const torrents = await DebridLink.searchTorrents(apiKey, searchKey, 0.1)
        if (torrents && torrents.length) {
            const torrentIds = torrents
                .filter(torrent => filterSeason(torrent, season))
                .map(torrent => torrent.id)

            if (torrentIds && torrentIds.length) {
                return DebridLink.getTorrentDetails(apiKey, torrentIds.join(), config.addonUrl)
                    .then(torrentDetailsList => {
                        return torrentDetailsList
                            .filter(torrentDetails => filterEpisode(torrentDetails, season, episode))
                            .map(torrentDetails => toStream(torrentDetails, type, config))
                    })
            }
        }
    } else if (config.DebridProvider == "RealDebrid") {
        let results = []
        const torrents = await RealDebrid.searchTorrents(apiKey, searchKey, 0.1)
        if (torrents && torrents.length) {
            const streams = await Promise.all(torrents
                .filter(torrent => filterSeason(torrent, season))
                .map(torrent => {
                    return RealDebrid.getTorrentDetails(apiKey, torrent.id, config.addonUrl)
                        .then(torrentDetails => {
                            if (filterEpisode(torrentDetails, season, episode)) {
                                return toStream(torrentDetails, type, config)
                            }
                        })
                        .catch(err => {
                            console.log(err)
                            Promise.resolve()
                        })
                }))
            results.push(...streams)
        }

        const downloads = await RealDebrid.searchDownloads(apiKey, searchKey, 0.1)
        if (downloads && downloads.length) {
            const streams = await Promise.all(downloads
                .filter(download => filterDownloadEpisode(download, season, episode))
                .map(download => {return toStream(download, type, config)}))
            results.push(...streams)
        }
        return results.filter(stream => stream)
    } else if (config.DebridProvider == "AllDebrid") {
        const torrents = await AllDebrid.searchTorrents(apiKey, searchKey, 0.1)
        if (torrents && torrents.length) {
            const streams = await Promise.all(torrents
                .filter(torrent => filterSeason(torrent, season))
                .map(torrent => {
                    return AllDebrid.getTorrentDetails(apiKey, torrent.id, config.addonUrl)
                        .then(torrentDetails => {
                            if (filterEpisode(torrentDetails, season, episode)) {
                                return toStream(torrentDetails, type, config)
                            }
                        })
                        .catch(err => {
                            console.log(err)
                            Promise.resolve()
                        })
                })
            )

            return streams.filter(stream => stream)
        }
    } else if (config.DebridProvider == "Premiumize") {
        const torrents = await Premiumize.searchFiles(apiKey, searchKey, 0.1)
        if (torrents && torrents.length) {
            const streams = await Promise.all(torrents
                .filter(torrent => filterSeason(torrent, season))
                .map(torrent => {
                    return Premiumize.getTorrentDetails(apiKey, torrent.id, config.addonUrl)
                        .then(torrentDetails => {
                            if (filterEpisode(torrentDetails, season, episode)) {
                                return toStream(torrentDetails, type, config)
                            }
                        })
                        .catch(err => {
                            console.log(err)
                            Promise.resolve()
                        })
                })
            )

            return streams.filter(stream => stream)
        }
    } else if (config.DebridProvider == "TorBox") {
        const torrents = await TorBox.searchTorrents(apiKey, searchKey, 0.1, config.addonUrl)
        if (torrents && torrents.length) {
            const streams = await Promise.all(
                torrents
                    .filter(torrent => filterEpisode(torrent, season, episode))
                    .map(torrentDetails => toStream(torrentDetails, type, config))
            )
            return streams.filter(stream => stream)
        }
    } else {
        return Promise.reject(BadRequestError)
    }

    return []
}

async function resolveUrl(debridProvider, debridApiKey, itemId, hostUrl, clientIp) {
    if (debridProvider == "DebridLink" || debridProvider == "Premiumize") {
        return hostUrl
    } else if (debridProvider == "RealDebrid") {
        return RealDebrid.unrestrictUrl(debridApiKey, hostUrl, clientIp)
    } else if (debridProvider == "AllDebrid") {
        return AllDebrid.unrestrictUrl(debridApiKey, hostUrl)
    } else if (debridProvider == "TorBox") {
        return TorBox.unrestrictUrl(debridApiKey, itemId, hostUrl, clientIp)
    } else {
        return Promise.reject(BadRequestError)
    }
}

function filterSeason(torrent, season) {
    return torrent?.info.season == season || torrent?.info.seasons?.includes(Number(season))
}

function filterEpisode(torrentDetails, season, episode) {
    torrentDetails.videos = torrentDetails.videos
        .filter(video => (season == video.info.season) && (episode == video.info.episode))

        return torrentDetails.videos && torrentDetails.videos.length
}

function filterYear(torrent, cinemetaDetails) {
    if (torrent?.info?.year && cinemetaDetails?.year) {
        return torrent.info.year == cinemetaDetails.year
    }

    return true
}

function filterDownloadEpisode(download, season, episode) {
    return download && download.info.season == season && download.info.episode == episode
}

function toStream(details, type, config) {
    let video, icon
    if (details.fileType == FILE_TYPES.DOWNLOADS) {
        icon = '⬇️'
        video = details
    } else {
        icon = '💾'
        video = details.videos.sort((a, b) => b.size - a.size) && details.videos[0]
    }

    const resolution = video.info.resolution || details.info.resolution
    const flags = detectLanguageFlags((video.name || '') + ' ' + (details.name || ''))
    const flagStr = flags.join('')
    const proxied = config && config.MediaFlowUrl ? '🔒 Proxied' : ''
    const releaseGroup = video.info.group || details.info.group || ''

    // Left column: provider badge + resolution
    let name = STREAM_NAME_MAP[details.source]
    name = name + '\n' + (resolution || 'Unknown')

    // Right column: show name, size, language flags, release group, proxy status
    // For series, use the torrent/pack name (not the file path which is redundant)
    const displayName = details.name
    let title = displayName + '\n' + icon + ' ' + formatSize(video.size)
    if (flagStr) title += ' ' + flagStr
    if (releaseGroup) title += '\n' + releaseGroup
    if (proxied) title += '\n' + proxied

    let bingeGroup = details.source + '|' + details.id

    return {
        name,
        title,
        url: appendMediaFlowParams(video.url, config),
        behaviorHints: {
            bingeGroup: bingeGroup
        }
    }
}

function formatSize(size) {
    if (!size) {
        return undefined
    }

    const i = size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024))
    return Number((size / Math.pow(1024, i)).toFixed(2)) + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i]
}

export default { getMovieStreams, getSeriesStreams, resolveUrl }
const STYLESHEET = `
* {
	box-sizing: border-box;
}

body,
html {
	margin: 0;
	padding: 0;
	width: 100%;
	min-height: 100%;
}

html {
	background-size: auto 100%;
	background-size: cover;
	background-position: center center;
	background-repeat: repeat-y;
}

body {
	font-size: 2.2vh;
}

body {
	display: flex;
    background-color: transparent;
	font-family: 'Open Sans', Arial, sans-serif;
	color: white;
}

h1 {
	font-size: 4.5vh;
	font-weight: 700;
}

h2 {
	font-size: 2.2vh;
	font-weight: normal;
	font-style: italic;
	opacity: 0.8;
}

h3 {
	font-size: 2.2vh;
    font-weight: normal;
}

h1,
h2,
h3,
p,
label {
	margin: 0;
	text-shadow: 0 0 1vh rgba(0, 0, 0, 0.15);
}

p {
	font-size: 1.75vh;
}

ul {
	font-size: 1.75vh;
	margin: 0;
	margin-top: 1vh;
	padding-left: 3vh;
}

li {
    margin-top: 0.3vh;
}

a {
	color: white;
}

a.install-link {
	text-decoration: none
}

button {
	border: 0;
	outline: 0;
	color: white;
	background: #8A5AAB;
	padding: 1.2vh 3.5vh;
	margin: auto;
	text-align: center;
	font-family: 'Open Sans', Arial, sans-serif;
	font-size: 2.2vh;
	font-weight: 600;
	cursor: pointer;
	display: block;
	box-shadow: 0 0.5vh 1vh rgba(0, 0, 0, 0.2);
	transition: box-shadow 0.1s ease-in-out;
}

button:hover {
	box-shadow: none;
}

button:active {
	box-shadow: 0 0 0 0.5vh white inset;
}

#addon {
   width: 90vh;
   margin: auto;
   padding: 3vh 10%;
   background: rgba(0, 0, 0, 0.60);
}

.logo {
	width: 100%;
	margin: auto;
	margin-bottom: 2vh;
	text-align: center;
}

.logo img {
	max-width: 100%;
	height: auto;
	display: block;
	margin: auto;
}

.header-row {
	display: flex;
	align-items: baseline;
	gap: 1.2vh;
	margin-bottom: 0.4vh;
}

.name {
	margin: 0;
}

.version {
	opacity: 0.7;
	font-size: 2vh;
	font-weight: normal;
	font-style: italic;
}

.contact {
	position: absolute;
	left: 0;
	bottom: 4vh;
	width: 100%;
	text-align: center;
}

.contact a {
	font-size: 1.4vh;
	font-style: italic;
}

.separator {
	margin-bottom: 1.5vh;
}

.label {
  font-size: 2.2vh;
  font-weight: 600;
  padding: 0;
  line-height: inherit;
}

.form-element {
	margin-bottom: 1.5vh;
}

.two-col {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1.5vh;
}

.label-to-top {
	margin-bottom: 1vh;
}

.label-to-right {
	margin-left: 1vh !important;
}

.full-width {
	width: 100%;
}
`

function landingTemplate(manifest, config) {
    const background = manifest.background || 'https://dl.strem.io/addon-background.jpg'
    const logo = manifest.logo || 'https://dl.strem.io/addon-logo.png'
    const contactHTML = manifest.contactEmail ?
        `<div class="contact">
			<p>Contact ${manifest.name} creator:</p>
			<a href="mailto:${manifest.contactEmail}">${manifest.contactEmail}</a>
		</div>` : ''

    let formHTML = ''
    let script = ''

	formHTML = `
	<form class="pure-form" id="mainForm">
		<div class="form-element two-col">
			<div>
				<div class="label-to-top">Provider</div>
				<select id="DebridProvider" name="DebridProvider" class="full-width">
					<option value="RealDebrid">RealDebrid</option>
					<option value="DebridLink">DebridLink</option>
					<option value="AllDebrid">AllDebrid</option>
					<option value="Premiumize">Premiumize</option>
					<option value="TorBox">TorBox</option>
				</select>
			</div>
			<div>
				<div class="label-to-top">API Key</div>
				<input type="text" id="DebridApiKey" name="DebridApiKey" class="full-width" required>
			</div>
		</div>

		<div class="form-element">
			<label class="input" for="ShowCatalog">Show catalog</label>
			<input class="label" type="checkbox" id="ShowCatalog" name="ShowCatalog" value="true">
			<span style="margin-left:1vh;font-size:1.6vh;opacity:0.7;cursor:pointer;user-select:none" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none';this.textContent=this.textContent==='▸ what is this?'?'▾ what is this?':'▸ what is this?'">▸ what is this?</span>
			<p style="display:none;margin-top:0.75vh;opacity:0.7;font-size:1.6vh">When enabled, your Debrid library appears as a browseable catalog in Stremio's <strong>Discover</strong> tab, so you can scroll and search your cloud library directly. When disabled, the addon only provides streams when you open a title Stremio already knows about.</p>
		</div>

		<div class="separator"></div>

		<div style="font-weight:normal;opacity:0.6;font-size:1.5vh;margin-bottom:0.75vh">Routes streams through your proxy so Real-Debrid only sees your MediaFlow server's IP</div>
		<div class="form-element two-col">
			<div>
				<div class="label-to-top">MediaFlow URL <span style="font-weight:normal;opacity:0.7">(optional)</span></div>
				<input type="text" id="MediaFlowUrl" name="MediaFlowUrl" class="full-width" placeholder="https://your-mediaflow-server">
			</div>
			<div>
				<div class="label-to-top">MediaFlow Password <span style="font-weight:normal;opacity:0.7">(optional)</span></div>
				<input type="password" id="MediaFlowPassword" name="MediaFlowPassword" class="full-width">
			</div>
		</div>
	</form>

	<div class="separator"></div>

	<div id="manifestUrlBox" style="display:none">
		<p style="margin-bottom:1vh">Copy the Manifest URL below, then paste it into the <strong>Add addon</strong> box at <a href="https://web.stremio.com/#/addons" target="_blank">web.stremio.com/#/addons</a> or in the Stremio desktop app under <strong>Settings → Addons → Add addon</strong>.</p>
		<div class="form-element">
			<div class="label-to-top">Manifest URL</div>
			<div style="display:flex;gap:1vh">
				<input type="text" id="manifestUrl" class="full-width" readonly style="cursor:pointer" onclick="this.select()">
				<button type="button" id="copyBtn" onclick="copyManifestUrl()" style="margin:0;white-space:nowrap">Copy</button>
			</div>
		</div>
	</div>

	<div class="separator"></div>
	`

	script += `
	console.log("${config.Catalog}")
	$('#DebridProvider option[value="${config.DebridProvider}"]').attr("selected", "selected");
	$('#DebridApiKey').val("${config.DebridApiKey || ''}");
	$('#ShowCatalog').prop('checked', ${config.ShowCatalog || false});
	$('#MediaFlowUrl').val("${config.MediaFlowUrl || ''}");
	$('#MediaFlowPassword').val("${config.MediaFlowPassword || ''}");

	const isValidConfig = (config) => {
		return config.DebridProvider && config.DebridApiKey
	}

	const buildManifestUrl = (config) => {
		const configCopy = Object.assign({}, config)
		if (!configCopy.MediaFlowUrl) delete configCopy.MediaFlowUrl
		if (!configCopy.MediaFlowPassword) delete configCopy.MediaFlowPassword
		return 'https://' + window.location.host + '/' + encodeURIComponent(JSON.stringify(configCopy)) + '/manifest.json'
	}

	const updateLink = () => {
		const config = Object.fromEntries(new FormData(mainForm))
		if (isValidConfig(config)) {
			const manifestUrl = buildManifestUrl(config)
			document.getElementById('manifestUrl').value = manifestUrl
			document.getElementById('manifestUrlBox').style.display = 'block'
		} else {
			document.getElementById('manifestUrlBox').style.display = 'none'
		}
	}
	mainForm.onchange = updateLink

	function copyManifestUrl() {
		const input = document.getElementById('manifestUrl')
		const btn = document.getElementById('copyBtn')
		input.select()
		input.setSelectionRange(0, 99999)
		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard.writeText(input.value).then(() => {
				btn.textContent = 'Copied!'
				setTimeout(() => btn.textContent = 'Copy', 2000)
			}).catch(() => {
				document.execCommand('copy')
				btn.textContent = 'Copied!'
				setTimeout(() => btn.textContent = 'Copy', 2000)
			})
		} else {
			document.execCommand('copy')
			btn.textContent = 'Copied!'
			setTimeout(() => btn.textContent = 'Copy', 2000)
		}
	}
	`

    return `
	<!DOCTYPE html>
	<html style="background-image: url(${background});">

	<head>
		<meta charset="utf-8">
		<title>${manifest.name} - Stremio Addon</title>
		<style>${STYLESHEET}</style>
		<link href="https://fonts.googleapis.com/css?family=Open+Sans:400,600,700&display=swap" rel="stylesheet">
      	<script src="https://code.jquery.com/jquery-3.7.1.slim.min.js"></script>
		<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/purecss@2.1.0/build/pure-min.css" integrity="sha384-yHIFVG6ClnONEA5yB5DJXfW2/KC173DIQrYoZMEtBvGzmf0PKiGyNEqe9N6BNDBH" crossorigin="anonymous">
	</head>

	<body>
		<div id="addon">
			<div class="logo">
			    <img src="${logo}">
			</div>
			<div class="header-row">
				<h1 class="name">${manifest.name}</h1>
				<span class="version">v${manifest.version || '0.0.0'}</span>
			</div>
			<p style="font-size:1.6vh;opacity:0.7;margin-bottom:1.5vh">${manifest.description || ''}</p>

            <p style="font-size:1.6vh;opacity:0.7">Get your API key:
                <a href="https://real-debrid.com/apitoken" target="_blank">RealDebrid</a> ·
                <a href="https://debrid-link.fr/webapp/apikey" target="_blank">DebridLink</a> ·
                <a href="https://alldebrid.com/apikeys" target="_blank">AllDebrid</a> ·
                <a href="https://www.premiumize.me/account" target="_blank">Premiumize</a> ·
                <a href="https://torbox.app/settings" target="_blank">TorBox</a>
            </p>

			<div class="separator"></div>

			${formHTML}

			${contactHTML}
		</div>
		<script>
			${script}

			if (typeof updateLink === 'function')
			    updateLink()
		</script>
	</body>

	</html>`
}

export default landingTemplate

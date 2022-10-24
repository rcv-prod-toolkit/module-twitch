document.querySelector('#settings').addEventListener('submit', (e) => {
  e.preventDefault()

  LPTE.emit({
    meta: {
      namespace: 'module-twitch',
      type: 'set-settings',
      version: 1
    },
    automation: document.querySelector('#automation').checked,
    appId: document.querySelector('#appId').value,
    broadcastLogin: document.querySelector('#broadcastLogin').value,
    length: document.querySelector('#length').value
  })
})

function initSettings(settings) {
  document.querySelector('#automation').checked = settings.automation
  document.querySelector('#appId').value = settings.appId
  document.querySelector('#broadcastLogin').value = settings.broadcastLogin
  document.querySelector('#length').value = parseInt(settings.length)
}

function startPrediction() {
  LPTE.emit({
    meta: {
      namespace: 'module-twitch',
      type: 'start-prediction',
      version: 1
    }
  })
}

function cancelPrediction() {
  LPTE.emit({
    meta: {
      namespace: 'module-twitch',
      type: 'cancel-prediction',
      version: 1
    }
  })
}
function resolvePrediction() {
  LPTE.emit({
    meta: {
      namespace: 'module-twitch',
      type: 'resolve-prediction',
      version: 1
    }
  })
}

function showPrediction() {
  LPTE.emit({
    meta: {
      namespace: 'module-twitch',
      type: 'show-prediction',
      version: 1
    }
  })
}
function hidePrediction() {
  LPTE.emit({
    meta: {
      namespace: 'module-twitch',
      type: 'hide-prediction',
      version: 1
    }
  })
}

let server = ''

LPTE.onready(async () => {
  server = await window.constants.getWebServerPort()
  const location = `http://${server}/pages/op-module-twitch/gfx`

  const apiKey = await window.constants.getApiKey()

  document.querySelector('#prediction-embed').value = `${location}/prediction.html${apiKey !== null ? '?apikey=' + apiKey: ''}`
  document.querySelector('#prediction-gfx').src = `${location}/prediction.html${apiKey !== null ? '?apikey=' + apiKey: ''}`

  const settings = await LPTE.request({
    meta: {
      namespace: 'module-twitch',
      type: 'get-settings',
      version: 1
    }
  })
  initSettings(settings)

  LPTE.on('module-twitch', 'set-settings', initSettings)
})

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
    length: parseInt(document.querySelector('#length').value)
  })
})

function initSettings(settings) {
  document.querySelector('#automation').checked = settings.automation
  document.querySelector('#appId').value = settings.appId
  document.querySelector('#broadcastLogin').value = settings.broadcastLogin
  document.querySelector('#length').value = parseInt(settings.length)
}

const winningOutcome = document.querySelector('#winningOutcome')
function setVoteState (e) {
  const state = e.state

  if (state.teams === {} || state.prediction.outcomes.length <= 0) {
    return
  }

  const total = state.prediction.outcomes.reduce((c, o) => {
    return c + o.channel_points
  }, 0)

  winningOutcome.innerHTML = ''
  for (const outcome of state.prediction.outcomes) {
    const option = document.createElement('option')
    option.value = outcome.id
    option.text = `${total === 0 ? '50' : Math.round((outcome.channel_points / total) * 100)}% - ${outcome.title}`
    winningOutcome.add(option)
  }
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
    },
    winningOutcome: winningOutcome.value
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

  LPTE.on('module-twitch', 'update', setVoteState)

  const res = await LPTE.request({
    meta: {
      namespace: 'module-twitch',
      type: 'request',
      version: 1
    }
  })

  setVoteState(res)

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

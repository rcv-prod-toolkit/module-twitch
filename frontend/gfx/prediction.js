const container = document.querySelector('.container')
const blueTeam = document.querySelector('#blue')
const redTeam = document.querySelector('#red')
const bar = document.querySelector('#bar')

function setVoteState(e) {
  const state = e.state

  if (state.prediction.outcomes.length <= 0) {
    return
  }

  const total = state.prediction.outcomes.reduce((c, o) => {
    return c + (o?.channel_points | o?.votes)
  }, 0)

  let bluePercentage = 50
  let redPercentage = 50

  if (total !== 0) {
    bluePercentage = state.prediction.outcomes[0]?.channel_points === 0 ? 0 : Math.round(
      ((state.prediction.outcomes[0]?.channel_points || state.prediction.outcomes[0]?.votes) / total) * 100
    )
    redPercentage = state.prediction.outcomes[1]?.channel_points === 0 ? 0 : Math.round(
      ((state.prediction.outcomes[1]?.channel_points || state.prediction.outcomes[1]?.votes) / total) * 100
    )
  }

  blueTeam.innerHTML = `${bluePercentage}%`
  redTeam.innerHTML = `${redPercentage}%`

  bar.style.setProperty('--blue-percentage', bluePercentage)
  bar.style.setProperty('--red-percentage', redPercentage)
}

function convertSecsToTime(secs) {
  const minutes = Math.floor(secs / 60)
  const seconds = secs - minutes * 60
  return `${('0' + minutes).slice(-2)}:${('0' + seconds).slice(-2)}`
}

const themeBlue = document
  .querySelector(':root')
  .style.getPropertyValue('--blue-team')
const themeBlueDark = document
  .querySelector(':root')
  .style.getPropertyValue('--blue-team-dark')
const themeRed = document
  .querySelector(':root')
  .style.getPropertyValue('--red-team')
const themeRedDark = document
  .querySelector(':root')
  .style.getPropertyValue('--red-team-dark')

function shadeColor(color, percent) {
  var R = parseInt(color.substring(1, 3), 16)
  var G = parseInt(color.substring(3, 5), 16)
  var B = parseInt(color.substring(5, 7), 16)

  R = parseInt((R * (100 + percent)) / 100)
  G = parseInt((G * (100 + percent)) / 100)
  B = parseInt((B * (100 + percent)) / 100)

  R = R < 255 ? R : 255
  G = G < 255 ? G : 255
  B = B < 255 ? B : 255

  var RR = R.toString(16).length == 1 ? '0' + R.toString(16) : R.toString(16)
  var GG = G.toString(16).length == 1 ? '0' + G.toString(16) : G.toString(16)
  var BB = B.toString(16).length == 1 ? '0' + B.toString(16) : B.toString(16)

  return '#' + RR + GG + BB
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null
}

function changeColor(color) {
  const rgb = hexToRgb(color)
  const brightness = Math.round(
    (parseInt(rgb.r) * 299 + parseInt(rgb.g) * 587 + parseInt(rgb.b) * 114) /
      1000
  )
  return brightness < 150 ? '--text-color' : '--text-color-dark'
}

function changeColors(e) {
  if (e.teams.blueTeam?.color && e.teams.blueTeam?.color !== '#000000') {
    document
      .querySelector(':root')
      .style.setProperty('--blue-team', e.teams.blueTeam.color)
    document
      .querySelector(':root')
      .style.setProperty(
        '--blue-team-dark',
        shadeColor(e.teams.blueTeam.color, -30)
      )

    document.querySelectorAll('#blue .player .level').forEach((i) => {
      i.style.color = `var(${changeColor(e.teams.blueTeam.color)})`
    })
  } else {
    document.querySelector(':root').style.setProperty('--blue-team', themeBlue)
    document
      .querySelector(':root')
      .style.setProperty('--blue-team-dark', themeBlueDark)

    document.querySelectorAll('#blue .player .level').forEach((i) => {
      i.style.color = 'var(--background-color)'
    })
  }
  if (e.teams.redTeam?.color && e.teams.redTeam?.color !== '#000000') {
    document
      .querySelector(':root')
      .style.setProperty('--red-team', e.teams.redTeam.color)
    document
      .querySelector(':root')
      .style.setProperty(
        '--red-team-dark',
        shadeColor(e.teams.redTeam.color, -30)
      )
  } else {
    document.querySelector(':root').style.setProperty('--red-team', themeRed)
    document
      .querySelector(':root')
      .style.setProperty('--red-team-dark', themeRedDark)

    document.querySelectorAll('#red .player .level').forEach((i) => {
      i.style.color = 'var(--text-color)'
    })
  }
}

LPTE.onready(async () => {
  LPTE.on('module-twitch', 'update', setVoteState)

  LPTE.on('module-twitch', 'show-prediction', (e) => {
    container.classList.remove('hide')
  })
  LPTE.on('module-twitch', 'hide-prediction', () => {
    container.classList.add('hide')
  })

  const res = await LPTE.request({
    meta: {
      namespace: 'module-twitch',
      type: 'request',
      version: 1
    }
  })

  setVoteState(res)

  const teams = await window.LPTE.request({
    meta: {
      namespace: 'module-teams',
      type: 'request-current',
      version: 1
    }
  })

  if (teams !== undefined) {
    changeColors(teams)
  }

  window.LPTE.on('module-teams', 'update', changeColors)
})

import type { PluginContext } from '@rcv-prod-toolkit/types'
import { Predictions } from './controller/Predictions'
import { Config } from './types/Config'

module.exports = async (ctx: PluginContext) => {
  const namespace = ctx.plugin.module.getName()

  // Register new UI page
  ctx.LPTE.emit({
    meta: {
      type: 'add-pages',
      namespace: 'ui',
      version: 1
    },
    pages: [
      {
        name: `Twitch`,
        frontend: 'frontend',
        id: `op-${namespace}`
      }
    ]
  })

  const configRes = await ctx.LPTE.request({
    meta: {
      type: 'request',
      namespace: 'plugin-config',
      version: 1
    }
  })
  if (configRes === undefined) {
    ctx.log.warn('config could not be loaded')
  }
  let config: Config = Object.assign({
    appId: '',
    broadcastId: '',
    broadcastLogin: '',
    token: '',
    automation: false,
    length: 240
  }, configRes?.config)

  const prediction = new Predictions(namespace, config, ctx)

  ctx.LPTE.on(namespace, 'set-settings', async (e) => {
    config.appId = e.appId
    config.automation = e.automation
    config.broadcastLogin = e.broadcastLogin
    config.length = e.length

    const user = await prediction.getUser(e.broadcastLogin)
    if (user === undefined) return
    config.broadcastId = user.data[0].id

    ctx.LPTE.emit({
      meta: {
        type: 'set',
        namespace: 'plugin-config',
        version: 1
      },
      config: {
        appId: config.appId,
        broadcastId: config.broadcastId,
        broadcastLogin: config.broadcastLogin,
        token: config.token,
        automation: config.automation,
        length: config.length,
      }
    })
  })

  ctx.LPTE.on(namespace, 'set-token', async (e) => {
    config.token = e.token

    ctx.LPTE.emit({
      meta: {
        type: 'set',
        namespace: 'plugin-config',
        version: 1
      },
      config: {
        token: config.token,
      }
    })
  })

  ctx.LPTE.on(namespace, 'get-settings', (e) => {
    ctx.LPTE.emit({
      meta: {
        type: e.meta.reply!,
        namespace: 'reply',
        version: 1
      },
      appId: config.appId,
      broadcastId: config.broadcastId,
      broadcastLogin: config.broadcastLogin,
      token: config.token,
      automation: config.automation,
      length: config.length,
    })
  })

  ctx.LPTE.on(namespace, 'request', (e) => {
    ctx.LPTE.emit({
      meta: {
        type: e.meta.reply as string,
        namespace: 'reply',
        version: 1
      },
      state: prediction?.gfxState
    })
  })

  ctx.LPTE.on(namespace, 'start-prediction', async (e) => {
    const res = await prediction.startPrediction()

    if (res === undefined) return

    ctx.LPTE.emit({
      meta: {
        type: e.meta.reply as string,
        namespace: 'reply',
        version: 1
      },
      state: prediction.gfxState
    })
  })
  ctx.LPTE.on(namespace, 'cancel-prediction', (e) => {
    if (prediction === undefined) return

    prediction.cancelPrediction()
  })
  ctx.LPTE.on(namespace, 'resolve-prediction', (e) => {
    if (prediction === undefined) return

    prediction.resolvePrediction(e.winningOutcome)
  })

  ctx.LPTE.on(namespace, 'show-prediction', (e) => {
    prediction.gfxState.show = true
  })
  ctx.LPTE.on(namespace, 'hide-prediction', (e) => {
    prediction.gfxState.show = false
  })

  ctx.LPTE.on('module-teams', 'update', (e) => {
    prediction.gfxState.teams = e.teams
    prediction.gfxState.bestOf = e.bestOf
  })

  // Emit event that we're ready to operate
  ctx.LPTE.emit({
    meta: {
      type: 'plugin-status-change',
      namespace: 'lpt',
      version: 1
    },
    status: 'RUNNING'
  })

  await ctx.LPTE.await('lpt', 'ready', 150000)

  const res = await ctx.LPTE.request({
    meta: {
      type: 'request-current',
      namespace: 'module-teams',
      version: 1
    }
  })

  if (res === undefined) {
    return ctx.log.warn('matches could not be loaded')
  }

  if (res) {
    prediction.gfxState.teams = res.teams
    prediction.gfxState.bestOf = res.bestOf
  }
}

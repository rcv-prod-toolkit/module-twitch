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
  let config: Config = Object.assign(
    {
      appId: '',
      broadcastId: '',
      broadcastLogin: '',
      token: '',
      automation: false,
      length: 240,
      usePoll: false
    },
    configRes?.config
  )

  const prediction = new Predictions(namespace, config, ctx)

  ctx.LPTE.on(namespace, 'set-settings', async (e) => {
    if (e.appId === undefined || e.appId === '') {
      return ctx.log.warn('AppId is missing!')
    }

    config.appId = e.appId
    config.automation = e.automation
    config.broadcastLogin = e.broadcastLogin
    config.length = e.length
    config.usePoll = e.usePoll

    if (
      config.token &&
      config.token !== '' &&
      config.broadcastLogin &&
      config.broadcastLogin !== ''
    ) {
      const user = await prediction.getUser(e.broadcastLogin)
      config.broadcastId = user?.data[0].id
    }

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
        usePoll: config.usePoll
      }
    })
  })

  ctx.LPTE.on(namespace, 'set-token', async (e) => {
    config.token = e.token

    if (
      config.token &&
      config.token !== '' &&
      config.broadcastLogin &&
      config.broadcastLogin !== ''
    ) {
      const user = await prediction.getUser(e.broadcastLogin)
      config.broadcastId = user?.data[0].id
    }

    ctx.LPTE.emit({
      meta: {
        type: 'set',
        namespace: 'plugin-config',
        version: 1
      },
      config: {
        token: config.token
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
      usePoll: config.usePoll
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

  ctx.LPTE.on('module-teams', 'teams-loaded', async (e) => {
    prediction.gfxState.teams = e.teams
    prediction.gfxState.bestOf = e.bestOf
  })
}

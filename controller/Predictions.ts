import type { PluginContext } from '@rcv-prod-toolkit/types'
import { Config } from '../types/Config'
import { GfxState } from '../types/GfxState'
import { PredictionEnd } from '../types/PredictionEnd'
import { PredictionStart } from '../types/PredictionStart'
import { PredictionState } from '../types/PredictionState'
import { User } from '../types/User'
import axios, { RawAxiosRequestHeaders } from 'axios'

export class Predictions {

  private timer?: NodeJS.Timeout
  private headers: RawAxiosRequestHeaders
  static url = 'https://api.twitch.tv/helix/predictions'
  static userUrl = 'https://api.twitch.tv/helix/users?login='

  public gfxState: GfxState = {
    teams: {},
    bestOf: 1,
    show: false,
    prediction: {
      inProgress: false,
      id: '',
      length: 240,
      status: '',
      outcomes: []
    }
  }

  constructor(
    private namespace: string,
    private config: Config,
    private ctx: PluginContext
  ) {
    this.headers = {
      Authorization: `Bearer ${config.token}`,
      'Client-Id': config.appId
    }
  }

  async startPrediction(time = 240): Promise<GfxState> {
    const game = (this.gfxState.teams.blueTeam?.score || 0) + (this.gfxState.teams.redTeam?.score || 0) + 1

    try {
      const res = await axios.post<PredictionStart>(Predictions.url,
        {
          broadcaster_id: this.config.broadcastId,
          title: `Who wins game ${game}?`,
          prediction_window: time,
          outcomes: [
            {
              title: this.gfxState.teams.blueTeam?.name
            },
            {
              title: this.gfxState.teams.redTeam?.name
            }
          ]
        },
        {
          headers: this.headers,
        }
      )

      const json = res.data
      this.gfxState.prediction = {
        inProgress: true,
        id: json.data[0].id,
        length: json.data[0].prediction_window,
        outcomes: json.data[0].outcomes,
        status: json.data[0].status,
      }

      this.ctx.LPTE.emit({
        meta: {
          namespace: this.namespace,
          type: 'update',
          version: 1
        },
        state: this.gfxState
      })

      this.timer = setInterval(() => {
        this.getPrediction()
      }, 5000)
    } catch (error) {
      this.ctx.log.error(error)
    }

    return this.gfxState
  }

  async cancelPrediction(): Promise<GfxState> {
    try {
      const url = `${Predictions.url}?broadcaster_id=${this.config.broadcastId}&id=${this.gfxState.prediction.id}&status=CANCELED`
      const res = await axios.patch<PredictionEnd>(url, {}, {
        headers: this.headers
      })

      const json = res.data
      this.gfxState.prediction.inProgress = false
      this.gfxState.prediction.status = json.data[0].status

      this.ctx.LPTE.emit({
        meta: {
          namespace: this.namespace,
          type: 'update',
          version: 1
        },
        state: this.gfxState
      })

      if (this.timer) {
        clearInterval(this.timer)
      }

      return this.gfxState
    } catch (error) {
      this.ctx.log.error(error)
      return this.gfxState
    }
  }

  async resolvePrediction(winningOutcome: string): Promise<GfxState> {
    try {
      const url = `${Predictions.url}?broadcaster_id=${this.config.broadcastId}&id=${this.gfxState.prediction.id}&status=RESOLVED&winning_outcome_id=${winningOutcome}`
      const res = await axios.patch<PredictionEnd>(url, {}, {
        headers: this.headers
      })

      const json = res.data
      this.gfxState.prediction.inProgress = false
      this.gfxState.prediction.status = json.data[0].status

      this.ctx.LPTE.emit({
        meta: {
          namespace: this.namespace,
          type: 'update',
          version: 1
        },
        state: this.gfxState
      })

      if (this.timer) {
        clearInterval(this.timer)
      }

      return this.gfxState
    } catch (error) {
      this.ctx.log.error(error)
      return this.gfxState
    }
  }

  async getPrediction(): Promise<GfxState> {
    try {
      const url = `${Predictions.url}?broadcaster_id=${this.config.broadcastId}&id=${this.gfxState.prediction.id}`
      const res = await axios.get<PredictionState>(url, {
        headers: this.headers
      })

      const json = res.data
      this.gfxState.prediction.inProgress = false
      this.gfxState.prediction.outcomes = json.data[0].outcomes,
      this.gfxState.prediction.status = json.data[0].status

      this.ctx.LPTE.emit({
        meta: {
          namespace: this.namespace,
          type: 'update',
          version: 1
        },
        state: this.gfxState
      })

      if ((json.data[0].status === 'LOCKED' || json.data[0].status === 'RESOLVED' || json.data[0].status === 'CANCELED') && this.timer) {
        clearInterval(this.timer)
      }

      return this.gfxState
    } catch (error) {
      this.ctx.log.error(error)
      return this.gfxState
    }
  }

  async getUser(login: string): Promise<User | undefined> {
    try {
      const url = `${Predictions.userUrl}${login}`
      const res = await axios.get<User>(url, {
        headers: this.headers
      })

      return res.data
    } catch (error) {
      this.ctx.log.error(error)
      return undefined
    }
  }
}

import type { PluginContext } from '@rcv-prod-toolkit/types'
import { Config } from '../types/Config'
import { GfxState } from '../types/GfxState'
import { PredictionEnd } from '../types/PredictionEnd'
import { PredictionStart } from '../types/PredictionStart'
import { PredictionState } from '../types/PredictionState'
import { PollEnd } from '../types/PollEnd'
import { PollStart } from '../types/PollStart'
import { PollState } from '../types/PollState'
import { User } from '../types/User'
import axios, { AxiosError } from 'axios'

export class Predictions {
  private timer?: NodeJS.Timeout
  static url = 'https://api.twitch.tv/helix/predictions'
  static pollUrl = 'https://api.twitch.tv/helix/polls'
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
  ) {}

  async startPrediction(time = 240): Promise<GfxState> {
    const game =
      (this.gfxState.teams.blueTeam?.score || 0) +
      (this.gfxState.teams.redTeam?.score || 0) +
      1

    if(this.config.usePoll) {
      try {
        const res = await axios.post<PollStart>(
          Predictions.pollUrl,
          {
            broadcaster_id: this.config.broadcastId,
            title: `Who wins game ${game}?`,
            duration: time,
            choices: [
              {
                title: this.gfxState.teams.blueTeam?.name
              },
              {
                title: this.gfxState.teams.redTeam?.name
              }
            ]
          },
          {
            headers: {
              Authorization: `Bearer ${this.config.token}`,
              'Client-Id': this.config.appId
            }
          }
        )
  
        const json = res.data
        this.gfxState.prediction = {
          inProgress: true,
          id: json.data[0].id,
          length: json.data[0].duration,
          outcomes: json.data[0].choices,
          status: json.data[0].status
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
        const e = error as AxiosError<any>
        this.ctx.log.error(
          `Request failed with status code ${e.response?.status}: ${e.response?.statusText}. ${e.response?.data.message}`
        )
      }
    } else {
      try {
        const res = await axios.post<PredictionStart>(
          Predictions.url,
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
            headers: {
              Authorization: `Bearer ${this.config.token}`,
              'Client-Id': this.config.appId
            }
          }
        )

        const json = res.data
        this.gfxState.prediction = {
          inProgress: true,
          id: json.data[0].id,
          length: json.data[0].prediction_window,
          outcomes: json.data[0].outcomes,
          status: json.data[0].status
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
        const e = error as AxiosError<any>
        this.ctx.log.error(
          `Request failed with status code ${e.response?.status}: ${e.response?.statusText}. ${e.response?.data.message}`
        )
      }
    }
    return this.gfxState
  }

  async cancelPrediction(): Promise<GfxState> {
    if(this.config.usePoll) {
      try {
        const url = `${Predictions.pollUrl}?broadcaster_id=${this.config.broadcastId}&id=${this.gfxState.prediction.id}&status=ARCHIVED`
        const res = await axios.patch<PollEnd>(
          url,
          {},
          {
            headers: {
              Authorization: `Bearer ${this.config.token}`,
              'Client-Id': this.config.appId
            }
          }
        )
  
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
      } catch (error) {
        const e = error as AxiosError<any>
        this.ctx.log.error(
          `Request failed with status code ${e.response?.status}: ${e.response?.statusText}. ${e.response?.data.message}`
        )
      }
    } else {
      try {
        const url = `${Predictions.url}?broadcaster_id=${this.config.broadcastId}&id=${this.gfxState.prediction.id}&status=CANCELED`
        const res = await axios.patch<PredictionEnd>(
          url,
          {},
          {
            headers: {
              Authorization: `Bearer ${this.config.token}`,
              'Client-Id': this.config.appId
            }
          }
        )

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
      } catch (error) {
        const e = error as AxiosError<any>
        this.ctx.log.error(
          `Request failed with status code ${e.response?.status}: ${e.response?.statusText}. ${e.response?.data.message}`
        )
      }
    }
    return this.gfxState
  }

  async resolvePrediction(winningOutcome: string): Promise<GfxState> {
    if(!this.config.usePoll) {
      try {
        const url = `${Predictions.url}?broadcaster_id=${this.config.broadcastId}&id=${this.gfxState.prediction.id}&status=RESOLVED&winning_outcome_id=${winningOutcome}`
        const res = await axios.patch<PredictionEnd>(
          url,
          {},
          {
            headers: {
              Authorization: `Bearer ${this.config.token}`,
              'Client-Id': this.config.appId
            }
          }
        )

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
      } catch (error) {
        const e = error as AxiosError<any>
        this.ctx.log.error(
          `Request failed with status code ${e.response?.status}: ${e.response?.statusText}. ${e.response?.data.message}`
        )
      }
    }
    return this.gfxState
  }

  async getPrediction(): Promise<GfxState> {
    if(this.config.usePoll) {
      try {
        const url = `${Predictions.pollUrl}?broadcaster_id=${this.config.broadcastId}&id=${this.gfxState.prediction.id}`
        const res = await axios.get<PollState>(url, {
          headers: {
            Authorization: `Bearer ${this.config.token}`,
            'Client-Id': this.config.appId
          }
        })
  
        const json = res.data
        this.gfxState.prediction.inProgress = false
        ;(this.gfxState.prediction.outcomes = json.data[0].choices),
          (this.gfxState.prediction.status = json.data[0].status)
  
        this.ctx.LPTE.emit({
          meta: {
            namespace: this.namespace,
            type: 'update',
            version: 1
          },
          state: this.gfxState
        })
  
        if (
          (json.data[0].status === 'COMPLETED' ||
          json.data[0].status === 'TERMINATED' ||
          json.data[0].status === 'MODERATED' ||
          json.data[0].status === 'ARCHIVED') &&
          this.timer
        ) {
          clearInterval(this.timer)
        }
      } catch (error) {
        const e = error as AxiosError<any>
        this.ctx.log.error(
          `Request failed with status code ${e.response?.status}: ${e.response?.statusText}. ${e.response?.data.message}`
        )
      }
    } else {
      try {
        const url = `${Predictions.url}?broadcaster_id=${this.config.broadcastId}&id=${this.gfxState.prediction.id}`
        const res = await axios.get<PredictionState>(url, {
          headers: {
            Authorization: `Bearer ${this.config.token}`,
            'Client-Id': this.config.appId
          }
        })

        const json = res.data
        this.gfxState.prediction.inProgress = false
        ;(this.gfxState.prediction.outcomes = json.data[0].outcomes),
          (this.gfxState.prediction.status = json.data[0].status)

        this.ctx.LPTE.emit({
          meta: {
            namespace: this.namespace,
            type: 'update',
            version: 1
          },
          state: this.gfxState
        })

        if (
          (json.data[0].status === 'LOCKED' ||
            json.data[0].status === 'RESOLVED' ||
            json.data[0].status === 'CANCELED') &&
          this.timer
        ) {
          clearInterval(this.timer)
        }
      } catch (error) {
        const e = error as AxiosError<any>
        this.ctx.log.error(
          `Request failed with status code ${e.response?.status}: ${e.response?.statusText}. ${e.response?.data.message}`
        )
      }
    }
    return this.gfxState
  }

  async getUser(login: string): Promise<User | undefined> {
    try {
      const url = `${Predictions.userUrl}${login}`
      const res = await axios.get<User>(url, {
        headers: {
          Authorization: `Bearer ${this.config.token}`,
          'Client-Id': this.config.appId
        }
      })

      return res.data
    } catch (error) {
      const e = error as AxiosError<any>
      this.ctx.log.error(
        `Request failed with status code ${e.response?.status}: ${e.response?.statusText}. ${e.response?.data.message}`
      )
      return undefined
    }
  }
}

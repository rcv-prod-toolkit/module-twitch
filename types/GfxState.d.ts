import type { Team } from './Team'
import type { PredictionStart } from './PredictionStart'
import { PollStart } from './PollStart'

export interface GfxState {
  teams: {
    blueTeam?: Team
    redTeam?: Team
  }
  bestOf: number
  show: boolean
  prediction: {
    inProgress: boolean
    id: PredictionStart['data'][0]['id'] | PollStart['data'][0]['id']
    length: number
    outcomes: PredictionStart['data'][0]['outcomes'] | PollStart['data'][0]['choices']
    status: PredictionStart['data'][0]['status'] | PollStart['data'][0]['status']
  }
}

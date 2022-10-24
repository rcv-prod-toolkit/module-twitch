import type { Team } from './Team'
import type { PredictionStart } from './PredictionStart'

export interface GfxState {
  teams: {
    blueTeam?: Team
    redTeam?: Team
  }
  bestOf: number
  show: boolean
  prediction: {
    inProgress: boolean
    id: PredictionStart['data'][0]['id']
    length: number
    outcomes: PredictionStart['data'][0]['outcomes']
    status: PredictionStart['data'][0]['status']
  }
}

export interface PollEnd {
    data: Data[]
  }
  
  export interface Data {
    broadcaster_id: string
    broadcaster_login: string
    broadcaster_name: string
    created_at: Date
    ended_at: Date
    id: string
    locked_at: null
    choices: Choice[]
    duration: number
    status: string
    title: string
    winning_choice_id: string
  }
  
  export interface Choice {
    votes: number
    channel_points_votes: number
    bits_votes: number
    id: string
    title: string
  }
  
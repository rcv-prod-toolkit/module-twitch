export interface PollState {
    data: Data[]
    pagination: Pagination
  }
  
  export interface Data {
    broadcaster_id: string
    broadcaster_login: string
    broadcaster_name: string
    created_at: Date
    ended_at: null
    id: string
    locked_at: null
    choices: Choice[]
    duration: number
    status: string
    title: string
    bits_voting_enabled: boolean
    bits_per_vote: number
    channel_points_voting_enabled: boolean
    channel_points_per_vote: number
  }
  
  export interface Choice {
    votes: number
    channel_points_votes: number
    bits_votes: number
    id: string
    title: string
  }
  
  export interface Pagination {}
  
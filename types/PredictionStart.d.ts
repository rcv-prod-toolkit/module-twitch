export interface PredictionStart {
  data: Datum[];
}

export interface Datum {
  broadcaster_id: string;
  broadcaster_login: string;
  broadcaster_name: string;
  created_at: Date;
  ended_at: null;
  id: string;
  locked_at: null;
  outcomes: Outcome[];
  prediction_window: number;
  status: string;
  title: string;
  winning_outcome_id: null;
}

export interface Outcome {
  channel_points: number;
  color: string;
  id: string;
  title: string;
  top_predictors: TopPredictor[];
  users: number;
}

export interface TopPredictor {
  channel_points_used: number;
  channel_points_won: number;
  user_id: string;
  user_login: string;
  user_name: string;
}

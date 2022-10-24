export interface PredictionEnd {
  data: Data[];
}

export interface Data {
  broadcaster_id: string;
  broadcaster_login: string;
  broadcaster_name: string;
  created_at: Date;
  ended_at: Date;
  id: string;
  locked_at: null;
  outcomes: Outcome[];
  prediction_window: number;
  status: string;
  title: string;
  winning_outcome_id: string;
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

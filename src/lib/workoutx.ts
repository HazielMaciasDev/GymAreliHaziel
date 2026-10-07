import { WorkoutX } from '@workoutx/sdk';

const API_KEY = 'wx_c83698267a987af92f9c80107afc863a8cb232d87cbf019c48e2f447';

let _client: WorkoutX | null = null;

export function getWorkoutX(): WorkoutX {
  if (!_client) {
    _client = new WorkoutX({ apiKey: API_KEY });
  }
  return _client;
}

export const WORKOUTX_BASE_URL = 'https://api.workoutxapp.com';
export const WORKOUTX_API_KEY = API_KEY;
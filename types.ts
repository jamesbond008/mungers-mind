
export interface MentalModel {
  name: string;
  explanation: string;
}

export interface MungerResponse {
  advice: string;
  models: MentalModel[];
  lollapalooza: string;
  inversion: string;
}

export interface Message {
  id: string;
  role: 'user' | 'munger';
  content: string;
  data?: MungerResponse;
  timestamp: number;
}

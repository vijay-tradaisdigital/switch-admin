export interface Submission {
  id: string;
  name: string;
  phone: string;
  email: string;
  state: string;
  city: string;
  vehicle: string;
  mode: "enquire" | "download";
  submittedAt: Date;
  source: string;
  origin: string;
}

export interface ServiceRequest {
  id: string;
  name: string;
  phone: string;
  email: string;
  request_type: string;
  remarks: string;
  submittedAt: Date;
  source: string;
}

export interface TCOSubmission {
  id: string;
  model: string;
  container: string;
  downPaymentPct: string;
  interestRate: number;
  tenure: string;
  monthlyKm: number;
  electricity: number;
  page: string;
  submittedAt: Date;
}

export interface ModelSelectorSubmission {
  id: string;
  appType: string;
  deckLength: string;
  payload: string;
  range: string;
  recommendedModel: string;
  submittedAt: Date;
}

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

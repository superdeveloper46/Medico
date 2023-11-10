export interface ClaimantModelExt {
  companyId: string;
  id: string;
  document_id: string;
  remote_id: string;
  file_name: string;
  media_link: string;
  media_link_original: string;
  media_link_data: string;
  page_count: number;
  uploaded_at: Date | string;
  processed_at: Date | string;
  claimant_name: string;
  address: string;
  phone_number: PhoneNumber;
  ss: string;
  dob: Dob;
  case_: string;
  allegations: string;
  appt_date: string;
  provider: string;
  location: string;
  additional_testing: string;
  appt_time: string;
  field_13: string;
  field_14: any;
  field_15: any;
  field_16: any;
}

export interface Dob {
  formatted: string;
}

export interface PhoneNumber {
  key_0: string;
  formatted: string;
}

export interface Field1 {
  key_0: string;
}
export interface PhysicianDoc {
  companyId: any;
  id: string;
  document_id: string;
  remote_id: string;
  file_name: string;
  media_link: string;
  media_link_original: string;
  media_link_data: string;
  page_count: number;
  uploaded_at: Date;
  processed_at: Date;
  field_1: undefined;
  isProcessed: boolean;
}

export interface Doc {
  name: string;
  value: string;
}

export interface PhysicianExt extends PhysicianDoc {
  patientId: any;
  docContent: any;
  createDate: Date | string;
  documentType: string;
  documentUrls: string;
}

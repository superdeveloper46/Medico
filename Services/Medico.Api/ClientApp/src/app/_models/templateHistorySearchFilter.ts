import { SearchFilter } from '../administration/models/searchFilter';
export class TemplateHistorySearchFilter extends SearchFilter {
  admissionId?: string;
  templateId?: string;
  documentId?: string;
}

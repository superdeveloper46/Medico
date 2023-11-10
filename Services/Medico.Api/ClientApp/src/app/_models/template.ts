import { LookupModel } from './lookupModel';

export class Template {
  id!: string;
  companyId?: string;
  templateOrder?: number;
  title?: string;
  reportTitle!: string;
  detailedTemplateHtml?: string;
  initialDetailedTemplateHtml?: string;
  defaultTemplateHtml?: string;
  isRequired: boolean;
  isActive: boolean;
  isHistorical: boolean;
  templateTypeId?: string;
  libraryTemplateId?: string;
  version?: number;
  dependentTemplates: LookupModel[];
  templatePhrasesUsage: LookupModel[];

  constructor() {
    this.isActive = true;
    this.isRequired = false;
    this.isHistorical = false;
    this.dependentTemplates = [];
    this.templatePhrasesUsage = [];
  }
}

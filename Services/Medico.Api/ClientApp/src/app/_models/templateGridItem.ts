export class TemplateGridItem {
  id!: string;
  templateOrder?: number;
  title?: string;
  reportTitle!: string;
  isRequired: boolean;
  isActive: boolean;
  isHistorical: boolean;
  templateTypeId?: string;
  libraryTemplateId?: string;
  version!: number;
  libraryTemplateVersion?: number;
  templateTypeName?: string;

  constructor() {
    this.isActive = true;
    this.isRequired = false;
    this.isHistorical = false;
  }
}

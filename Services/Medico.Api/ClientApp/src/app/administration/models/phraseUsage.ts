import { PatientChartNodeUsePhraseModel } from './patientChartNodeUsePhraseModel';
import { TemplateUsePhraseModel } from './templateUsePhraseModel';

export class PhraseUsage {
  phraseId?: string;
  patientChartNodeUsePhrases?: PatientChartNodeUsePhraseModel[];
  templateUsePhrases?: TemplateUsePhraseModel[];
}

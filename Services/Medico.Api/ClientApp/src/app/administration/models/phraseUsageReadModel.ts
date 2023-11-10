import { PatientChartNodeUsePhraseReadModel } from './patientChartNodeUsePhraseReadModel';
import { TemplateUsePhraseReadModel } from './templateUsePhraseReadModel';

export class PhraseUsageReadModel {
  phraseId?: string;
  phraseName?: string;
  patientChartNodeUsePhrases?: PatientChartNodeUsePhraseReadModel[];
  templateUsePhrases?: TemplateUsePhraseReadModel[];
}

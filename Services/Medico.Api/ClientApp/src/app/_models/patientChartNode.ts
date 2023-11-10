import { PatientChartNodeType } from './patientChartNodeType';
import { Template } from './template';
import { PatientChartNodeAttributes } from './patientChartNodeAttributes';
import { PatientChartNodeTemplateProviderService } from '../_services/patient-chart-node-template-provider.service';

export class PatientChartNode {
  id!: string;
  name!: string;
  title!: string;
  type!: PatientChartNodeType;
  value?: any | any[];
  attributes!: PatientChartNodeAttributes;
  children?: PatientChartNode[];
  parentId?: string;
  template?: string;

  static createPatientChartNode(
    id: string,
    name: string,
    title: string,
    type: PatientChartNodeType,
    value: any | any[],
    attributes: PatientChartNodeAttributes,
    parentId: string | undefined,
    template: string
  ): PatientChartNode {
    // console.log("in createPatientChartNode")

    const patientChartNode = new PatientChartNode();
    patientChartNode.id = id;
    patientChartNode.name = name;
    patientChartNode.title = title;
    patientChartNode.type = type;
    patientChartNode.value = value;
    patientChartNode.attributes = attributes;
    patientChartNode.children = [];
    patientChartNode.parentId = parentId;
    patientChartNode.template = template;

    return patientChartNode;
  }

  static createPatientChartTemplateNode(
    id: string,
    parentId: string | undefined,
    template: Template,
    templateTypeName: string
  ): PatientChartNode {
    // console.log("in createPatientChartTemplateNode")

    const patientChartNode = new PatientChartNode();

    patientChartNode.id = id;
    patientChartNode.name = template.reportTitle;
    patientChartNode.title = template.reportTitle;
    patientChartNode.type = PatientChartNodeType.TemplateNode;
    patientChartNode.value = {
      defaultTemplateHtml: template.defaultTemplateHtml,
      detailedTemplateHtml: template.initialDetailedTemplateHtml,
      isDetailedTemplateUsed: !template.defaultTemplateHtml,
    };

    patientChartNode.parentId = parentId;
    patientChartNode.template =
      PatientChartNodeTemplateProviderService.getTemplateValueForPatientChartTemplateNode(
        template.id,
        templateTypeName
      );

    const nodeSpecificAttributes = {
      templateId: template.id,
    };

    const attributes = PatientChartNodeAttributes.createPatientChartNodeAttributes(
      template.templateOrder as number,
      true,
      false,
      false,
      false,
      nodeSpecificAttributes
    );

    patientChartNode.attributes = attributes;

    return patientChartNode;
  }

  static createPatientChartTemplateListNode(
    id: string,
    name: string,
    title: string,
    attributes: PatientChartNodeAttributes,
    parentId?: string
  ): PatientChartNode {
    // console.log("in createPatientChartTemplateListNode")

    const patientChartNode = new PatientChartNode();
    patientChartNode.id = id;
    patientChartNode.name = name;
    patientChartNode.title = title;
    patientChartNode.type = PatientChartNodeType.TemplateListNode;
    patientChartNode.value = [];
    patientChartNode.attributes = attributes;
    patientChartNode.children = [];
    patientChartNode.parentId = parentId;
    patientChartNode.template =
      PatientChartNodeTemplateProviderService.getTemplateValueForPatientChartTemplateListNode(
        name
      );

    return patientChartNode;
  }

  static createPatientChartSectionNode(
    id: string,
    name: string,
    title: string,
    attributes: PatientChartNodeAttributes,
    parentId: string | undefined,
    chartId: string
  ): PatientChartNode {
    // console.log("in createPatientChartSectionNode");
    // console.log("\t" + title);

    const patientChartNode = new PatientChartNode();
    patientChartNode.id = id;
    patientChartNode.name = name;
    patientChartNode.title = title;
    patientChartNode.type = PatientChartNodeType.SectionNode;
    patientChartNode.value = {
      chartId,
    };
    patientChartNode.attributes = attributes;
    patientChartNode.children = [];
    patientChartNode.parentId = parentId;
    patientChartNode.template = '';

    return patientChartNode;
  }
}

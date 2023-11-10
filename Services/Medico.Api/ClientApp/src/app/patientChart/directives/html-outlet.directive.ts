import {
  Compiler,
  Component,
  ComponentFactory,
  NgModule,
  Directive,
  ViewContainerRef,
  ComponentRef,
  Input,
  ReflectiveInjector,
  OnChanges,
  OnDestroy,
} from '@angular/core';
import { PatientChartTreeModule } from '../patient-chart-tree/patient-chart-tree.module';
import { PatientChartNode } from 'src/app/_models/patientChartNode';
import { PatientChartInfo } from '../models/patientChartInfo';
import { PredefinedTemplateTypeNames } from 'src/app/_classes/predefinedTemplateTypeNames';
import { PatientChartNodeManagementService } from '../services/patient-chart-node-management.service';
import { ShareModule } from 'src/app/share/share.module';

export function createComponentFactory(
  compiler: Compiler,
  metadata: Component,
  patientChartRootNode: PatientChartNode | undefined,
  patientChartNode: PatientChartNode,
  patientId: string,
  admissionId: string,
  isSignedOff: boolean,
  appointmentId: string,
  companyId: string
): Promise<ComponentFactory<any>> {
  const cmpClass = class DynamicComponent {
    patientChartNode: PatientChartNode;
    patientChartDocumentNode?: PatientChartNode;
    patientId: string;
    admissionId: string;
    appointmentId: string;
    companyId: string;
    isSignedOff: boolean;

    //predefined template types
    ros: string = PredefinedTemplateTypeNames.ros;

    constructor() {
      this.patientChartNode = patientChartNode;
      this.patientChartDocumentNode = patientChartRootNode;

      this.patientId = patientId;
      this.admissionId = admissionId;
      this.appointmentId = appointmentId;
      this.companyId = companyId;
      this.isSignedOff = isSignedOff;
    }
  };
  
  const decoratedCmp = Component(metadata)(cmpClass);

  const module = NgModule({
    imports: [PatientChartTreeModule, ShareModule],
    declarations: [decoratedCmp],
    providers: [],
  })(class DynamicHtmlModule {});

  return compiler.compileModuleAndAllComponentsAsync(module).then(factories => {
    // Get the component factory.
    const componentFactory = factories.componentFactories[0];
    return componentFactory;
  });
}

@Directive({ selector: 'html-outlet' })
export class HtmlOutletDirective implements OnChanges, OnDestroy {
  @Input() patientChartInfo?: PatientChartInfo;

  cmpRef?: ComponentRef<any>;

  constructor(private vcRef: ViewContainerRef, private compiler: Compiler, private patientChartNodeManagementService: PatientChartNodeManagementService) {}

  ngOnChanges() {
    if (!this.patientChartInfo) return;

    var patientChartDocumentNode = this.patientChartInfo.patientChartDocuemntNode;
    var patientChartNode = this.patientChartInfo.patientChartNode;
    var replacePatientChartNode = null;

    const patientId = this.patientChartInfo.patientId;
    const admissionId = this.patientChartInfo.admissionId;

    if (!patientChartNode || !patientId) return;

    const patientChartNodeTemplate = patientChartNode.template;

    const reportNodeViewTemplate = `<report-node-view [isSignedOff]='isSignedOff' [patientChartNode]='patientChartNode'
                [patientChartDocumentNode]='patientChartDocumentNode' 
                [appointmentId]='appointmentId'
                [patientId]='patientId'
                [admissionId]='admissionId'
                [companyId]='companyId'>
             </report-node-view>`;

    var template = patientChartNodeTemplate
      ? patientChartNodeTemplate
      : reportNodeViewTemplate;

    var replaceChartNode = false;
    if(template?.includes("<medication-prescription ")) {
      template = "<medication-prescription [companyId]='companyId' [isSignedOff]='isSignedOff' [admissionId]='admissionId' [patientId]='patientId' [patientChartNode]='patientChartNode'></medication-prescription>";

      if(patientChartDocumentNode) {
        replacePatientChartNode = this.patientChartNodeManagementService.getByName("assessment", patientChartDocumentNode);
        replaceChartNode = true;
      }
    }
    else if(template?.includes("<reviewed-medical-records ")) {
      template = "<reviewed-medical-records [companyId]='companyId' [isSignedOff]='isSignedOff' [patientId]='patientId' [patientChartNode]='patientChartNode'></reviewed-medical-records>";

      if(patientChartDocumentNode) {
        replacePatientChartNode = this.patientChartNodeManagementService.getByName("assessment", patientChartDocumentNode);
        replaceChartNode = true;
      }
    }

    const companyId = this.patientChartInfo.companyId;

    this.createDynamicComponent(
      template,
      patientChartDocumentNode,
      replaceChartNode && replacePatientChartNode ? replacePatientChartNode : patientChartNode,
      patientId,
      admissionId,
      this.patientChartInfo.isSignedOff,
      this.patientChartInfo.appointmentId,
      companyId
    );
  }

  private createDynamicComponent(
    template: string,
    patientChartDocumentNode: PatientChartNode | undefined,
    patientChartNode: PatientChartNode,
    patientId: string,
    admissionId: string,
    isSignedOff: boolean,
    appointmentId: string,
    companyId: string
  ) {
    if (!template) return;

    if (this.cmpRef) {
      this.cmpRef.destroy();
    }

    const compMetadata = new Component({
      selector: 'dynamic-html',
      template: template,
    });

    createComponentFactory(
      this.compiler,
      compMetadata,
      patientChartDocumentNode,
      patientChartNode,
      patientId,
      admissionId,
      isSignedOff,
      appointmentId,
      companyId
    ).then(factory => {
      const injector = ReflectiveInjector.fromResolvedProviders(
        [],
        this.vcRef.parentInjector
      );
      this.cmpRef = this.vcRef.createComponent(factory, 0, injector, []);
    });
  }

  ngOnDestroy() {
    if (this.cmpRef) {
      this.cmpRef.destroy();
    }
  }
}

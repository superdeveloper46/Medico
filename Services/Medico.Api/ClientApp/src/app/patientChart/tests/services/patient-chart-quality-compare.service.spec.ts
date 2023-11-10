import { PatientChartNode } from 'src/app/_models/patientChartNode';
import { PatientChartEqualityComparer } from '../../services/patient-chart-equality-comparer.service';

describe('PatientChartQualityCompareService', () => {
  let patientChartQualityCompare: PatientChartEqualityComparer;
  let origin: PatientChartNode;
  let comparand: PatientChartNode;

  it('should return "true" if two objects the same', () => {
    origin = { id: '1', name: 'A', title: 'medico', type: 1 } as PatientChartNode;
    comparand = { id: '1', name: 'A', title: 'medico', type: 1 } as PatientChartNode;
    patientChartQualityCompare = new PatientChartEqualityComparer();

    expect(patientChartQualityCompare.arePatientChartsEqual(origin, comparand)).toBe(
      true
    );
  });

  it('should return "true" if add new property with empty array', () => {
    origin = { id: '1', name: 'A', title: 'medico', type: 1 } as PatientChartNode;
    comparand = {
      id: '1',
      name: 'A',
      title: 'medico',
      type: 1,
      value: [],
    } as PatientChartNode;
    patientChartQualityCompare = new PatientChartEqualityComparer();

    expect(patientChartQualityCompare.arePatientChartsEqual(origin, comparand)).toBe(
      true
    );
  });

  it('should return "false" if add new property', () => {
    origin = { id: '1', name: 'A', title: 'medico', type: 1 } as PatientChartNode;
    comparand = {
      id: '1',
      name: 'A',
      title: 'medico',
      type: 1,
      parentId: '1',
    } as PatientChartNode;
    patientChartQualityCompare = new PatientChartEqualityComparer();

    expect(patientChartQualityCompare.arePatientChartsEqual(origin, comparand)).toBe(
      false
    );
  });

  it('should return "false" if edit property', () => {
    origin = { id: '1', name: 'A', title: 'medico', type: 1 } as PatientChartNode;
    comparand = { id: '2', name: 'B', title: 'medico', type: 1 } as PatientChartNode;
    patientChartQualityCompare = new PatientChartEqualityComparer();

    expect(patientChartQualityCompare.arePatientChartsEqual(origin, comparand)).toBe(
      false
    );
  });

  it('should return "false" if edit array in property', () => {
    origin = {
      id: '1',
      name: 'A',
      title: 'medico',
      type: 1,
      value: [],
    } as PatientChartNode;
    comparand = {
      id: '1',
      name: 'A',
      title: 'medico',
      type: 1,
      value: [{ a: 1 }, 'A'],
    } as PatientChartNode;
    patientChartQualityCompare = new PatientChartEqualityComparer();

    expect(patientChartQualityCompare.arePatientChartsEqual(origin, comparand)).toBe(
      false
    );
  });

  it('should return "false" if property has deleted', () => {
    origin = { id: '1', name: 'A', title: 'medico', type: 1 } as PatientChartNode;
    comparand = { id: '1', name: 'A', title: 'medico' } as PatientChartNode;
    patientChartQualityCompare = new PatientChartEqualityComparer();

    expect(patientChartQualityCompare.arePatientChartsEqual(origin, comparand)).toBe(
      false
    );
  });

  it('should return "true" if in property tags appear', () => {
    origin = { id: '1', name: 'A', title: 'medico', type: 1 } as PatientChartNode;
    comparand = {
      id: '1',
      name: 'A',
      title: '<span>medico</span>',
      type: 1,
    } as PatientChartNode;
    patientChartQualityCompare = new PatientChartEqualityComparer();

    expect(patientChartQualityCompare.arePatientChartsEqual(origin, comparand)).toBe(
      true
    );
  });

  it('should return "true" if in property tags appear and spaces', () => {
    origin = {
      id: '1',
      name: 'A',
      title: 'medico is the best application',
      type: 1,
    } as PatientChartNode;
    comparand = {
      id: '1',
      name: 'A',
      title: '<span>medico <span>is</span>    <b>the best</b>    application</span>',
      type: 1,
    } as PatientChartNode;
    patientChartQualityCompare = new PatientChartEqualityComparer();

    expect(patientChartQualityCompare.arePatientChartsEqual(origin, comparand)).toBe(
      true
    );
  });
});

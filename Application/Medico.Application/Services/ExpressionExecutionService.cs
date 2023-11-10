using Medico.Application.ExpressionItemsManagement;
using Medico.Application.Interfaces;
using Medico.Application.SelectableItemsManagement;
using Medico.Application.ViewModels.ExpressionExecution;
using Newtonsoft.Json.Linq;
using RazorEngine;
using RazorEngine.Templating;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Medico.Application.ViewModels.ReferenceTable;
using Medico.Application.ViewModels.Expression;
using HtmlAgilityPack;
using Medico.Application.ViewModels;
using DevExtreme.AspNet.Data;
using Medico.Application.ViewModels.Admission;
using Newtonsoft.Json;

namespace Medico.Application.Services
{
    public class ExpressionExecutionService : IExpressionExecutionService
    {
        private readonly IAdmissionService _admissionService;
        private readonly IExpressionItemsService _expressionItemsService;
        private readonly IExpressionService _expressionService;
        private readonly IReferenceTableService _referenceTableService;
        private readonly IPatientService _patientService;
        private readonly ISelectableItemsService _selectableItemsService;
        private readonly IPatientChartService _patientChartService;
        private readonly IVariableService _variableService;
        private readonly IMedicationHistoryService _medicationHistoryService;
        private readonly IMedicalRecordService _medicalRecordService;
        private readonly ITobaccoHistoryService _tobaccoHistoryService;
        private readonly IDrugHistoryService _drugHistoryService;
        private readonly IAlcoholHistoryService _alcoholHistoryService;
        private readonly IMedicalHistoryService _medicalHistoryService;
        private readonly ISurgicalHistoryService _surgicalHistoryService;
        private readonly IFamilyHistoryService _familyHistoryService;
        private readonly IEducationHistoryService _educationHistoryService;
        private readonly IOccupationalHistoryService _occupationalHistoryService;
        private readonly IAllergyService _allergyService;
        private readonly IMedicationPrescriptionService _medicationPrescriptionService;
        private readonly IPatientInsuranceService _patientInsuranceService;
        private readonly IUserService _userService;
        private readonly IVendorDataService _vendorDataService;
        private readonly IAppointmentService _appointmentService;
        public ExpressionExecutionService(IAdmissionService admissionService,
            IExpressionItemsService expressionItemsService,
            IExpressionService expressionService,
            IReferenceTableService referenceTableService,
            IPatientService patientService,
            ISelectableItemsService selectableItemsService,
            IPatientChartService patientChartService,
            IVariableService variableService,
            IMedicationHistoryService medicationHistoryService,
            IMedicalRecordService medicalRecordService,
            ITobaccoHistoryService tobaccoHistoryService,
            IDrugHistoryService drugHistoryService,
            IAlcoholHistoryService alcoholHistoryService,
            IMedicalHistoryService medicalHistoryService,
            ISurgicalHistoryService surgicalHistoryService,
            IFamilyHistoryService familyHistoryService,
            IEducationHistoryService educationHistoryService,
            IOccupationalHistoryService occupationalHistoryService,
            IAllergyService allergyService,
            IMedicationPrescriptionService medicationPrescriptionService,
            IPatientInsuranceService patientInsuranceService,
            IUserService userService,
            IVendorDataService vendorDataService,
            IAppointmentService appointmentService)
        {
            _admissionService = admissionService;
            _expressionItemsService = expressionItemsService;
            _expressionService = expressionService;
            _referenceTableService = referenceTableService;
            _patientService = patientService;
            _selectableItemsService = selectableItemsService;
            _patientChartService = patientChartService;
            _variableService = variableService;
            _medicationHistoryService = medicationHistoryService;
            _medicalRecordService = medicalRecordService;
            _tobaccoHistoryService = tobaccoHistoryService;
            _drugHistoryService = drugHistoryService;
            _alcoholHistoryService = alcoholHistoryService;
            _medicalHistoryService = medicalHistoryService;
            _surgicalHistoryService = surgicalHistoryService;
            _familyHistoryService = familyHistoryService;
            _educationHistoryService = educationHistoryService;
            _occupationalHistoryService = occupationalHistoryService;
            _allergyService = allergyService;
            _medicationPrescriptionService = medicationPrescriptionService;
            _patientInsuranceService = patientInsuranceService;
            _userService = userService;
            _vendorDataService = vendorDataService;
            _appointmentService = appointmentService;
        }

        public async Task<string> CalculateExpressionsInTemplate(
            ExpressionExecutionRequestVm expressionExecutionRequest)
        {
            var admissionId = expressionExecutionRequest.AdmissionId;

            var admission = await _admissionService
                .GetFullAdmissionInfoById(admissionId);

            var patient = await _patientService.GetByIdWithVitalSigns(admission.PatientId);

            var htmlContent = expressionExecutionRequest.DetailedTemplateContent;

            var idToExpressionIdDictionary =
                _expressionItemsService.GeIdToExpressionIdDictionaryFromHtmlContent(htmlContent);

            var expressionIds = idToExpressionIdDictionary.Values;
            if (!expressionIds.Any())
                return htmlContent;

            var expressions =
                await _expressionService.GetAll(e => expressionIds.Contains(e.Id));

            var selectableVariables =
                _selectableItemsService.GetSelectableVariablesFromHtmlContent(htmlContent);

            var elementIdToExpressionResultDictionary = new Dictionary<Guid, string>();

            foreach (var idToExpressionId in idToExpressionIdDictionary)
            {
                var expressionId = idToExpressionId.Value;

                var expression =
                    expressions.FirstOrDefault(e => e.Id == expressionId);

                var elementId = idToExpressionId.Key;

                try
                {
                    var expressionReferenceTables =
                        await GetExpressionReferenceTables(expressionId);

                    var expressionExecutionContextVm = new ExpressionExecutionContextVm
                    {
                        VitalSigns = admission.VitalSigns,
                        Patient = patient.Patient,
                        BaseVitalSigns = patient.BaseVitalSigns,
                        SelectableVariables = selectableVariables,
                        ReferenceTables = expressionReferenceTables
                    };

                    var expressionResult = Engine.Razor.RunCompile(expression.Template, Guid.NewGuid().ToString(),
                        typeof(ExpressionExecutionContextVm),
                        expressionExecutionContextVm
                    );

                    elementIdToExpressionResultDictionary.Add(elementId, expressionResult);
                }
                catch (Exception)
                {
                    elementIdToExpressionResultDictionary.Add(elementId,
                        $"Error happened during expression execution {expression.Title}");
                }
            }

            return _expressionItemsService.UpdateExpressionItems(elementIdToExpressionResultDictionary, htmlContent);
        }

        public async Task<string> CalculateExpression(ExpressionExecutionRequestVm expressionExecutionRequest)
        {
            var admissionId = expressionExecutionRequest.AdmissionId;
            var patientId = expressionExecutionRequest.PatientId;
            var companyId = expressionExecutionRequest.CompanyId;

            var expressionTemplate = expressionExecutionRequest.DetailedTemplateContent;

            IDictionary<string, JObject[]> expressionReferenceTables;
            
            var referenceTableIds = expressionExecutionRequest
                .ReferenceTableIds;

            if (referenceTableIds == null || !referenceTableIds.Any())
                expressionReferenceTables = new Dictionary<string, JObject[]>();
            else
            {
                expressionReferenceTables = (await _referenceTableService
                        .GetAll(t => expressionExecutionRequest.ReferenceTableIds.Contains(t.Id)))
                    .ToDictionary(t => t.Title, t => t.Data.Body);
            }


            string expressionResult;
            try
            {
                ExpressionExecutionContextVm expressionExecutionContextVm = await this.GetBasicExpressionExecutionContextVm(admissionId);
                expressionExecutionContextVm.Providers = _userService.GetProviders(companyId);
                expressionExecutionContextVm.SelectableVariables = _selectableItemsService.GetSelectableVariablesFromHtmlContent(string.Empty, true);
                expressionExecutionContextVm.ReferenceTables = expressionReferenceTables;

                List<ExpressionVm> expressions = await _expressionService.GetAll(e => true);
                Dictionary<string, JObject> mvExpressions = new Dictionary<string, JObject>();
                foreach (ExpressionVm expression in expressions)
                {
                    JObject expression_result = await CalculateExpressionByTitle(expression.Title, patientId, admissionId);
                    mvExpressions.Add(expression.Title, expression_result);
                }

                expressionExecutionContextVm.Expressions = mvExpressions;

                expressionResult = Engine.Razor.RunCompile(expressionTemplate.Replace("&gt;", ">").Replace("&lt;", "<"), Guid.NewGuid().ToString(), typeof(ExpressionExecutionContextVm), expressionExecutionContextVm);

            }
            catch (Exception e)
            {
                expressionResult = e.ToString();
            }

            return expressionResult;
        }

        public async Task<JObject> CalculateExpressionByTitle(string title, Guid patientId, Guid admissionId)
        {
            var expression = await _expressionService.GetByTitle(title);

            var referenceTables = await _expressionService.GetReferenceTables(expression.Id);

            IDictionary<string, JObject[]> expressionReferenceTables;

            var referenceTableIds = referenceTables.Select(d => d.Id);

            if (referenceTableIds == null || !referenceTableIds.Any())
                expressionReferenceTables = new Dictionary<string, JObject[]>();
            else
            {
                expressionReferenceTables = (await _referenceTableService.GetAll(t => referenceTableIds.Contains(t.Id))).ToDictionary(t => t.Title, t => t.Data.Body);
            }
                        
            JObject expressions = new JObject();
            try
            {
                ExpressionExecutionContextVm expressionExecutionContextVm = await this.GetBasicExpressionExecutionContextVm(admissionId);
                expressionExecutionContextVm.SelectableVariables = _selectableItemsService.GetSelectableVariablesFromHtmlContent(string.Empty, true);
                expressionExecutionContextVm.ReferenceTables = expressionReferenceTables;

                string expressionResult = Engine.Razor.RunCompile(expression.Template, Guid.NewGuid().ToString(), typeof(ExpressionExecutionContextVm), expressionExecutionContextVm);

                var rootDocument = new HtmlDocument();
                rootDocument.LoadHtml("<div>" + expressionResult + "</div>");

                var expressionReturnDataNodes = rootDocument.DocumentNode.SelectNodes("//span[@class='expression-return-data']");

                if(expressionReturnDataNodes != null)
                {
                    expressionResult = expressionReturnDataNodes[0].InnerText.Replace("&quot;", "'").Replace("\r\n", "");
                    expressions = JObject.Parse(expressionResult);
                }                

            }
            catch (Exception e)
            {
                expressions.Add("Error", e.ToString());
            }

            return expressions;
        }

        private async Task<IDictionary<string, JObject[]>> GetExpressionReferenceTables(Guid expressionId)
        {
            var expressionReferenceTableLookups =
                await _expressionService.GetReferenceTables(expressionId);

            var expressionReferenceTableIds =
                expressionReferenceTableLookups.Select(t => t.Id);

            return (await _referenceTableService
                    .GetAll(t => expressionReferenceTableIds.Contains(t.Id)))
                .ToDictionary(t => t.Title, t => t.Data.Body);
        }

        public async Task<string> CalculateExpressionItem(Guid expressionId, Guid admissionId)
        {
            var expression = await _expressionService.GetById(expressionId);

            //var admissionId = Guid.Parse("84054d61-6dba-4502-b263-15a02e6b6140");
                        
            var admission = await _admissionService
                .GetFullAdmissionInfoById(admissionId);

            var patient = await _patientService
                .GetByIdWithVitalSigns(admission.PatientId);


            IDictionary<string, JObject[]> expressionReferenceTables;
            
            //ReferenceTableVm referenceTableVm = await _referenceTableService.GetById(expressionId);

            var referenceTables = await _expressionService.GetReferenceTables(expressionId);

            var referenceTableIds = referenceTables.ToList().ConvertAll<Guid>(obj => obj.Id).ToArray();

            if (referenceTableIds == null || !referenceTableIds.Any())
                expressionReferenceTables = new Dictionary<string, JObject[]>();
            else
            {
                expressionReferenceTables = (await _referenceTableService.GetAll(t => referenceTableIds.Contains(t.Id)))
                    .ToDictionary(t => t.Title, t => t.Data.Body);
            }

            string expressionResult;

            try
            {
                expressionResult =
                    Engine.Razor.RunCompile(expression.Template, Guid.NewGuid().ToString(),
                        typeof(ExpressionExecutionContextVm),
                        new ExpressionExecutionContextVm
                        {
                            Patient = patient.Patient,
                            VitalSigns = admission.VitalSigns,
                            BaseVitalSigns = patient.BaseVitalSigns,
                            SelectableVariables =
                                _selectableItemsService.GetSelectableVariablesFromHtmlContent(string.Empty, true),
                            ReferenceTables = expressionReferenceTables,
                        });
            }
            catch (Exception e)
            {
                expressionResult = e.ToString();
            }

            return expressionResult;
        }

        private async Task<ExpressionExecutionContextVm> GetBasicExpressionExecutionContextVm(Guid admissionId)
        {
            var admission = await _admissionService.GetFullAdmissionInfoById(admissionId);

            Guid patientId = admission.PatientId;
            var patient = await _patientService.GetByIdWithVitalSigns(patientId);

            ExpressionExecutionContextVm expressionExecutionContextVm = new ExpressionExecutionContextVm();

            try
            {

                TmvPatientHistory patientHistory = new TmvPatientHistory();

                IEnumerable<MedicalRecordViewModel> patientMedicalRecords = await _medicalRecordService.GetByPatientId(patientId);
                patientHistory.PatientMedicalRecords = patientMedicalRecords.AsQueryable();

                IEnumerable<TobaccoHistoryViewModel> tobaccoHistory = await _tobaccoHistoryService.GetAllByPatientId(patientId);
                patientHistory.TobaccoHistory = tobaccoHistory.AsQueryable();

                IEnumerable<DrugHistoryViewModel> drugHistory = await _drugHistoryService.GetAllByPatientId(patientId);
                patientHistory.DrugHistory = drugHistory.AsQueryable();

                IEnumerable<AlcoholHistoryViewModel> alcoholHistory = await _alcoholHistoryService.GetAllByPatientId(patientId);
                patientHistory.AlcoholHistory = alcoholHistory.AsQueryable();

                IEnumerable<MedicalHistoryViewModel> previousMedicalHistory = await _medicalHistoryService.GetAllByPatientId(patientId);
                patientHistory.PreviousMedicalHistory = previousMedicalHistory.AsQueryable();

                IEnumerable<SurgicalHistoryViewModel> previousSurgicalHistory = await _surgicalHistoryService.GetAllByPatientId(patientId);
                patientHistory.PreviousSurgicalHistory = previousSurgicalHistory.AsQueryable();

                IEnumerable<FamilyHistoryViewModel> familyHistory = await _familyHistoryService.GetAllByPatientId(patientId);
                patientHistory.FamilyHistory = familyHistory.AsQueryable();

                IEnumerable<EducationHistoryViewModel> educationHistory = await _educationHistoryService.GetAllByPatientId(patientId);
                patientHistory.EducationHistory = educationHistory.AsQueryable();

                IEnumerable<OccupationalHistoryViewModel> occupationalHistory = await _occupationalHistoryService.GetAllByPatientId(patientId);
                patientHistory.OccupationalHistory = occupationalHistory.AsQueryable();

                IEnumerable<AllergyViewModel> allergies = await _allergyService.GetAllByPatientId(patientId);
                patientHistory.Allergies = allergies.AsQueryable();

                IEnumerable<MedicationHistoryViewModel> medications = await _medicationHistoryService.GetAllByPatientId(patientId);
                patientHistory.Medications = medications.AsQueryable();

                IEnumerable<MedicationPrescriptionViewModel> Prescription = await _medicationPrescriptionService.GetByAdmissionId(admissionId);

                AdmissionVm admissionVm = await _admissionService.GetById(admissionId);

                List<TmvAssessment> assessmentsAll = new List<TmvAssessment>();
                List<TmvAssessment> assessmentsCurrent = new List<TmvAssessment>();
                List<TmvChiefComplaint> chiefComplaints = new List<TmvChiefComplaint>();
                
                if (admissionVm != null)
                {
                    var admissionData = JObject.Parse(admissionVm.AdmissionData);
                    foreach (var node in admissionData["children"])
                    {
                        if (node["children"] != null)
                        {
                            foreach (var childNode in node["children"])
                            {
                                if (childNode["children"] != null)
                                {
                                    if (childNode["name"].ToString() == "assessment" && childNode["value"] != null)
                                    {
                                        string assessmentHtml = "";
                                        foreach (var childChildNode in childNode["value"])
                                        {
                                            assessmentsAll.Add(TmvAssessment.Create(childChildNode));
                                            if (childChildNode["status"] != null && childChildNode["status"].ToString() == "Current")
                                            {
                                                assessmentsCurrent.Add(TmvAssessment.Create(childChildNode));
                                            }

                                        }
                                    }

                                    if (childNode["name"].ToString() == "chiefComplaint" && childNode["value"] != null)
                                    {
                                        if(childNode["value"]["patientAllegationsSets"] != null)
                                        {
                                            foreach (var childChildNode in childNode["value"]["patientAllegationsSets"])
                                            {
                                                chiefComplaints.Add(TmvChiefComplaint.Create(childChildNode));
                                            }
                                        }
                                        
                                    }
                                }

                            }
                        }

                    }
                }

                PatientInsuranceViewModel patientInsurance = new PatientInsuranceViewModel();
                PatientInsuranceViewModel patientInsuranceTmp = await _patientInsuranceService.GetByPatientId(patientId);
                if (patientInsuranceTmp != null)
                {
                    patientInsurance = patientInsuranceTmp;
                    patient.Patient.Rqid = patientInsurance.Rqid;
                    patient.Patient.CaseNumber = patientInsurance.CaseNumber;
                    patient.Patient.Mrn = patientInsurance.MRN;
                   // patient.Patient.Fin = patientInsurance.FIN;
                }

                var appointments = await _appointmentService.GetByPatientAndCompanyId(patient.Patient.Id, patient.Patient.CompanyId);
                if (appointments != null)
                {
                    var first = appointments.OrderBy(c => c.Date).FirstOrDefault();
                    if (first != null)
                    {
                        patient.Patient.AdmissionDate = first.Date;
                    }
                }


                IEnumerable<CareTeamViewModel> careTeams = await _vendorDataService.GetCareTeamDdl();

                expressionExecutionContextVm = new ExpressionExecutionContextVm
                {
                    Admission = admission,
                    Patient = patient.Patient,
                    VitalSigns = admission.VitalSigns,
                    MedicationPrescriptions = admission.MedicationPrescriptions.AsQueryable(),
                    BaseVitalSigns = patient.BaseVitalSigns,
                    PatientHistory = patientHistory,
                    Prescriptions = Prescription.AsQueryable(),
                    PatientInsurance = patientInsurance,
                    AssessmentsAll = assessmentsAll.AsQueryable(),
                    AssessmentsCurrent = assessmentsCurrent.AsQueryable(),
                    ChiefComplaints = chiefComplaints.AsQueryable(),
                    Appointments = appointments.AsQueryable(),
                    //Providers = _userService.GetProviders(companyId),
                    CareTeams = careTeams.AsQueryable()
                };


            }
            catch (Exception e)
            {
                
            }

            return expressionExecutionContextVm;
        }
    }
}
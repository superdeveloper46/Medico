using System;
using System.Threading.Tasks;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels.Admission;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using JsonDiffPatchDotNet;
using Medico.Application.ViewModels.Enums;
using Medico.Application.ViewModels;
using Medico.Application.ViewModels.ExpressionExecution;
using System.Collections.Generic;
using System.Linq;

namespace Medico.Api.Controllers
{
    [Authorize]
    [Route("api/admission")]
    public class AdmissionController : ApiController
    {
        #region DI
        private readonly IAdmissionService _admissionService;
        private readonly IAppointmentService _appointmentService;
        private readonly IPatientService _patientService;
        private readonly IAuditTrailService _auditTrailService;
        private readonly ISendEmailService _sendEmailService;

        public AdmissionController(IAdmissionService admissionService,
            ICompanySecurityService companySecurityService,
            IAuditTrailService auditTrailService,
            ISendEmailService sendEmailService,
            IPatientService patientService, IAppointmentService appointmentService)
            : base(companySecurityService)
        {
            _admissionService = admissionService;
            _patientService = patientService;
            _appointmentService = appointmentService;
            _auditTrailService = auditTrailService;
            _sendEmailService = sendEmailService;
        }
        #endregion

        #region Methods
        [HttpGet]
        [Route("appointment/{appointmentId}")]
        public async Task<IActionResult> GetByAppointmentId(Guid appointmentId)
        {
            var admission = await _admissionService.GetByAppointmentId(appointmentId);
            if (admission == null)
                return Ok();

            var isCurrentUserHaveAccessToCompanyAdmission =
                await CompanySecurityService
                    .DoesUserHaveAccessToCompanyAdmission(admission.Id);

            if (!isCurrentUserHaveAccessToCompanyAdmission)
                return Unauthorized();

            return Ok(admission);
        }

        [HttpGet]
        [Route("previous/patient/{patientId}/date/{fromDate}")]
        public async Task<IActionResult> GetPatientLastVisit(Guid patientId, DateTime fromDate)
        {
            var isCurrentUserHaveAccessToCompanyPatient =
                await CompanySecurityService
                    .DoesUserHaveAccessToCompanyPatient(patientId);

            if (!isCurrentUserHaveAccessToCompanyPatient)
                return Unauthorized();

            return Ok(await _admissionService.GetPreviousPatientAdmissions(patientId, fromDate));
        }

        [HttpPut]
        public async Task<IActionResult> Put(
            [FromBody] UpdatePatientChartDocumentNodesVm updatePatientChartDocumentNodesVm)
        {
            if (!ModelState.IsValid)
                return BadRequest();

            var admissionId = updatePatientChartDocumentNodesVm.AdmissionId;
            var appointment = await _appointmentService.GetByAdmissionId(admissionId);
            if (appointment == null)
                return BadRequest();

            var appointmentCompanyId = appointment.CompanyId;

            var patientId = appointment.PatientId;
            var patient = await _patientService.GetById(patientId);
            if (patient == null)
                return BadRequest();

            var patientCompanyId = patient.CompanyId;

            if (appointmentCompanyId != patientCompanyId)
                return Unauthorized();

            var isCurrentUserHaveAccessToCompany =
                await CompanySecurityService.DoesUserHaveAccessToCompany(patientCompanyId);

            if (!isCurrentUserHaveAccessToCompany)
                return Unauthorized();

            var updatedAdmission =
                await _admissionService.UpdatePatientChartDocumentNodes(updatePatientChartDocumentNodesVm);

            return Ok(updatedAdmission);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] AdmissionVm admissionViewModel)
        {
            if (!ModelState.IsValid)
                return BadRequest();

            var appointmentId = admissionViewModel.AppointmentId;
            var appointment = await _appointmentService.GetById(appointmentId);
            if (appointment == null)
                return BadRequest();

            var appointmentCompanyId = appointment.CompanyId;

            var patientId = admissionViewModel.PatientId;
            var patient = await _patientService.GetById(patientId);
            if (patient == null)
                return BadRequest();

            var patientCompanyId = patient.CompanyId;

            if (appointmentCompanyId != patientCompanyId)
                return Unauthorized();

            var isCurrentUserHaveAccessToCompany =
                await CompanySecurityService.DoesUserHaveAccessToCompany(patientCompanyId);

            if (!isCurrentUserHaveAccessToCompany)
                return Unauthorized();

            admissionViewModel.ModifiedDate = admissionViewModel.CreatedDate;
            admissionViewModel.ModifiedBy = CurrentUserId;

            if (admissionViewModel.Id != Guid.Empty)
            {
                // await Audit(admissionViewModel);
                // var json2 = JValue.Parse(existing.AdmissionData);

                // var diffObj = new JsonDiffPatch();
                // var result = diffObj.Diff(json, json2);
            }
            else
            {
                admissionViewModel.CreatedBy = CurrentUserId;
            }

            // var jsonString = admissionViewModel.AdmissionData;
            // dynamic json = JValue.Parse(jsonString);
            //dynamic charts = json.children;

            //dynamic historyAndPhysical = charts[0].children[0].value.detailedTemplateHtml;

            //).ChildrenTokens).Items[6])).ChildrenTokens

            //int i = ((Newtonsoft.Json.Linq.JContainer)(new System.Collections.Generic.ICollectionDebugView<Newtonsoft.Json.Linq.JToken>(((Newtonsoft.Json.Linq.JObject)historyAndPhysical).ChildrenTokens).Items[6])).Count;

            //dynamic historyAndPhysicalChildren = historyAndPhysical.ChildrenTokens;

            //var x = historyAndPhysicalChildren.children.length;

            //for(int i=0; i < historyAndPhysicalChildren.length;i++)
            //{
            //    dynamic a = historyAndPhysicalChildren[0];
            //}

            var createUpdateTask = admissionViewModel.Id == Guid.Empty
                ? _admissionService.Create(admissionViewModel)
                : _admissionService.Update(admissionViewModel);

            var admission = await createUpdateTask;

            return Ok(admission);
        }

        [HttpGet]
        [Route("{id}")]
        public async Task<IActionResult> Get(Guid id)
        {
            var isCurrentUserHaveAccessToCompany =
                await CompanySecurityService
                    .DoesUserHaveAccessToCompanyAdmission(id);

            if (!isCurrentUserHaveAccessToCompany)
                return Unauthorized();

            return Ok(await _admissionService.GetById(id));
        }

        [HttpDelete]
        [Route("{id}")]
        public async Task<IActionResult> DeleteById(Guid id)
        {
            var isCurrentUserHaveAccessToCompany =
                await CompanySecurityService
                    .DoesUserHaveAccessToCompanyAdmission(id);

            if (!isCurrentUserHaveAccessToCompany)
                return Unauthorized();

            await _admissionService.DeleteWithAllRelatedData(id);

            return Ok();
        }

        #endregion

        #region Non Action
        private async Task Audit(AdmissionVm admissionVm)
        {
            var existing = await _admissionService.GetSingle(admissionVm.Id);

            await _auditTrailService.CreateAuditTrail(AuditActionType.Update, Convert.ToString(admissionVm.Id), "admission", existing, admissionVm);
        }

        private async Task SendEmail(EmailViewModel emailModel)
        {
            try
            {
                EmailAccountViewModel emailAccount = await _sendEmailService.GetEmailAccount();

                var email = new EmailViewModel
                {
                    FromName = emailAccount.FromName,
                    To = emailModel.To,
                    BccList = emailAccount.Bcc,
                    Subject = string.Format("Reset your {0} password", emailAccount.AppName)
                };

                await _sendEmailService.Execute(email, emailAccount);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }
        #endregion

        [HttpGet]
        [Route("assessments/current/{patientId}")]
        public async Task<IActionResult> GetAdmissionAssessmentsCurrent(Guid patientId)
        {

            IQueryable<AppointmentViewModel> patientAppointments = _appointmentService.GetPatientAllVisits(patientId);

            //return Ok(new { data = patientAppointments != null ? patientAppointments.ToArray() : Array.Empty<AppointmentViewModel>() });

            List<TmvAssessment> assessmentsCurrent = new List<TmvAssessment>();

            if (patientAppointments == null)
            {
                return Ok(assessmentsCurrent.ToArray());
            }

            foreach (var patientAppointment in patientAppointments)
            {
                if (!patientAppointment.AdmissionId.HasValue)
                {
                    continue;
                }

                AdmissionVm admissionVm = await _admissionService.GetById(patientAppointment.AdmissionId.Value);

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
                                            if (childChildNode["status"] != null && childChildNode["status"].ToString() == "Current")
                                            {
                                                assessmentsCurrent.Add(TmvAssessment.Create(childChildNode));
                                            }

                                        }
                                    }
                                }

                            }
                        }

                    }
                }

                //if(assessmentsCurrent.Count != 0)
                //{
                //    break;
                //}
            }
            
            return Ok(assessmentsCurrent.ToArray());
        }

        [HttpGet]
        [Route("chiefcomplaints/current/{patientId}")]
        public async Task<IActionResult> GetAdmissionChiefCompaintCurrent(Guid patientId)
        {
            IQueryable<AppointmentViewModel> patientAppointments = _appointmentService.GetPatientAllVisits(patientId);

            //return Ok(new { data = patientAppointments != null ? patientAppointments.ToArray() : Array.Empty<AppointmentViewModel>() });

            List<TmvAssessment> assessmentsCurrent = new List<TmvAssessment>();

            if (patientAppointments == null)
            {
                return Ok(assessmentsCurrent.ToArray());
            }

            List<TmvChiefComplaint> chiefComplaints = new List<TmvChiefComplaint>();

            foreach (var patientAppointment in patientAppointments)
            {
                if (!patientAppointment.AdmissionId.HasValue)
                {
                    continue;
                }

                AdmissionVm admissionVm = await _admissionService.GetById(patientAppointment.AdmissionId.Value);

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

                                    if (childNode["name"].ToString() == "chiefComplaint" && childNode["value"] != null)
                                    {
                                        if (childNode["value"]["patientAllegationsSets"] != null)
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
            }
            
            return Ok(chiefComplaints.ToArray());
        }
    }
}
using DevExtreme.AspNet.Data;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Medico.Application.ViewModels.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace Medico.Api.Controllers
{
    [Authorize]
    [Route("api/vitalsigns")]
    public class VitalSignsController : ApiController
    {
        #region DI
        private readonly IVitalSignsService _vitalSignsService;
        private readonly IAuditTrailService _auditTrailService;
        private readonly IExpressionExecutionService _expressionExecutionService;
        public VitalSignsController(
            IAuditTrailService auditTrailService,
            IVitalSignsService vitalSignsService,
            IExpressionExecutionService expressionExecutionService,
            ICompanySecurityService companySecurityService) : base(companySecurityService)
        {
            _vitalSignsService = vitalSignsService;
            _auditTrailService = auditTrailService;
            _expressionExecutionService = expressionExecutionService;
        }
        #endregion

        #region Methods
        [HttpGet]
        [Route("last/patient/{patientId}/date/{createDate}")]
        public async Task<IActionResult> GetLastPatientVitalSigns(Guid patientId, DateTime createDate)
        {
            if (!await CompanySecurityService.DoesUserHaveAccessToCompanyPatient(patientId))
                return Unauthorized();

            return Ok(await _vitalSignsService
                .GetLastPatientVitalSigns(patientId, createDate));
        }

        [HttpGet]
        [Route("{id}")]
        public async Task<IActionResult> Get(Guid id)
        {
            var vitalSigns = await _vitalSignsService.GetById(id);
            if (vitalSigns == null)
                return Ok();

            var patientId = vitalSigns.PatientId;

            if (!await CompanySecurityService.DoesUserHaveAccessToCompanyPatient(patientId))
                return Unauthorized();

            return Ok(vitalSigns);
        }

        [HttpGet]
        [Route("patient/{patientId}/admission/{admissionId}")]
        public async Task<IActionResult> Get(Guid patientId, Guid admissionId)
        {
            if (!await CompanySecurityService.DoesUserHaveAccessToCompanyAdmission(admissionId))
                return Unauthorized();

            return Ok(await _vitalSignsService.GetByPatientAndAdmissionIds(patientId, admissionId));
        }

        [HttpGet]
        [Route("expression/patient/{patientId}/admission/{admissionId}")]
        public async Task<IActionResult> GetFromExpression(Guid patientId, Guid admissionId)
        {
            if (!await CompanySecurityService.DoesUserHaveAccessToCompanyAdmission(admissionId))
                return Unauthorized();

            return Ok(await _expressionExecutionService.CalculateExpressionByTitle("Vital Signs", patientId, admissionId));
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] VitalSignsViewModel vitalSignsViewModel)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest();

                var patientId = vitalSignsViewModel.PatientId;

                if (!await CompanySecurityService.DoesUserHaveAccessToCompanyPatient(patientId))
                    return Unauthorized();

                if (vitalSignsViewModel.Id == Guid.Empty)
                {
                    vitalSignsViewModel.CreatedBy = CurrentUserId;
                    vitalSignsViewModel.ModifiedDate = vitalSignsViewModel.CreatedDate;
                }
                else
                {
                    vitalSignsViewModel.ModifiedDate = vitalSignsViewModel.CreatedDate;
                    vitalSignsViewModel.ModifiedBy = CurrentUserId;

                    await Audit(vitalSignsViewModel);
                }

                var createUpdateTask = vitalSignsViewModel.Id == Guid.Empty
                    ? _vitalSignsService.Create(vitalSignsViewModel)
                    : _vitalSignsService.Update(vitalSignsViewModel);

                await createUpdateTask;

                return Ok();
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        private async Task Audit(VitalSignsViewModel vitalSignsViewModel)
        {
            var existing = await _vitalSignsService.GetSingle(vitalSignsViewModel.Id);
            await _auditTrailService.CreateAuditTrail(AuditActionType.Update, Convert.ToString(vitalSignsViewModel.Id), "vitalSigns", existing, vitalSignsViewModel);
        }

        [HttpGet]
        [Route("dx/grid")]
        public object DxGridData(PatientAdmissionDxOptionsViewModel vitalSignsDxOptionsViewModel)
        {
            vitalSignsDxOptionsViewModel.PrimaryKey = new[] { "Id" };
            vitalSignsDxOptionsViewModel.PaginateViaPrimaryKey = true;

            var data = _vitalSignsService.GetAll(vitalSignsDxOptionsViewModel);

            return DataSourceLoader.Load(data.Result, vitalSignsDxOptionsViewModel);
        }

        [HttpDelete]
        [Route("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var vitalSigns = await _vitalSignsService.GetById(id);
            if (vitalSigns == null)
                return Ok();

            var patientId = vitalSigns.PatientId;
            if (!await CompanySecurityService.DoesUserHaveAccessToCompanyPatient(patientId))
                return Unauthorized();

            await _vitalSignsService.Delete(id);
            return Ok();
        }

        [HttpPut]
        [Route("delete/{id}")]
        public async Task<IActionResult> IsDelete(UpdateIsDelete data, Guid id)
        {
            var status = await _vitalSignsService.IsDelete(data, id);
            return Ok(new
            {
                success = status,
                message = "Data Deleted",
                data = status
            });
        }
        #endregion
    }
}

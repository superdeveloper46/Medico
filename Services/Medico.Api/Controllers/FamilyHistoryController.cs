using System;
using System.Threading.Tasks;
using DevExtreme.AspNet.Data;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Medico.Api.Controllers
{
    [Authorize]
    [Route("api/familyhistory")]
    public class FamilyHistoryController : ApiController
    {
        private readonly IFamilyHistoryService _familyHistoryService;

        public FamilyHistoryController(IFamilyHistoryService familyHistoryService,
            ICompanySecurityService companySecurityService) : base(companySecurityService)
        {
            _familyHistoryService = familyHistoryService;
        }

        [HttpGet]
        [Route("{id}")]
        public async Task<IActionResult> Get(Guid id)
        {
            var familyHistory = await _familyHistoryService.GetById(id);
            if (familyHistory == null)
                return Ok();

            var patientId = familyHistory.PatientId;
            if (!await CompanySecurityService.DoesUserHaveAccessToCompanyPatient(patientId))
                return Unauthorized();

            return Ok(familyHistory);
        }

        [HttpGet]
        [Route("historyexistence/patient/{patientId}")]
        public async Task<IActionResult> GetLastPatientFamilyHistory(Guid patientId)
        {
            if (!await CompanySecurityService.DoesUserHaveAccessToCompanyPatient(patientId))
                return Unauthorized();

            return Ok(await _familyHistoryService.IsHistoryExist(patientId));
        }

        [HttpGet]
        [Route("patient/{patientId}")]
        public async Task<IActionResult> GetPatientFamilyHistory(Guid patientId)
        {
            if (!await CompanySecurityService.DoesUserHaveAccessToCompanyPatient(patientId))
                return Unauthorized();

            return Ok(await _familyHistoryService.GetAllByPatientId(patientId));
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody]FamilyHistoryViewModel familyHistoryViewModel)
        {
            if (!ModelState.IsValid)
                return BadRequest();

            var patientId = familyHistoryViewModel.PatientId;
            if (!await CompanySecurityService.DoesUserHaveAccessToCompanyPatient(patientId))
                return Unauthorized();

            var createUpdateTask = familyHistoryViewModel.Id == Guid.Empty
                ? _familyHistoryService.Create(familyHistoryViewModel)
                : _familyHistoryService.Update(familyHistoryViewModel);

            await createUpdateTask;

            return Ok();
        }

        [HttpGet]
        [Route("dx/grid")]
        public object DxGridData(HistoryDxOptionsViewModel historyDxOptionsViewModel)
        {
            historyDxOptionsViewModel.PrimaryKey = new[] { "Id" };
            historyDxOptionsViewModel.PaginateViaPrimaryKey = true;

            return DataSourceLoader.Load(_familyHistoryService.GetAll(historyDxOptionsViewModel),
                historyDxOptionsViewModel);
        }

        [HttpDelete]
        [Route("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var familyHistory = await _familyHistoryService.GetById(id);
            if (familyHistory == null)
                return Ok();

            var patientId = familyHistory.PatientId;
            if (!await CompanySecurityService.DoesUserHaveAccessToCompanyPatient(patientId))
                return Unauthorized();

            await _familyHistoryService.Delete(id);
            return Ok();
        }
    }
}
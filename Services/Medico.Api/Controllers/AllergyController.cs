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
    [Route("api/allergy")]
    public class AllergyController : ApiController
    {
        private readonly IAllergyService _allergyService;

        public AllergyController(IAllergyService allergyService,
            ICompanySecurityService companySecurityService) : base(companySecurityService)
        {
            _allergyService = allergyService;
        }

        [HttpGet]
        [Route("{id}")]
        public async Task<IActionResult> Get(Guid id)
        {
            var allergy = await _allergyService.GetById(id);
            if (allergy == null)
                return Ok(null);

            var patientId = allergy.PatientId;

            if (!await CompanySecurityService.DoesUserHaveAccessToCompanyPatient(patientId))
                return Unauthorized();

            return Ok(allergy);
        }

        [HttpGet]
        [Route("patient/{patientId}/medication/{medicationNameId}")]
        public async Task<IActionResult> GetPatientAllergyOnMedication(Guid patientId, Guid medicationNameId)
        {
            // patientId = new Guid("5590646E-8635-EB11-9FB4-0003FF21D4D7");
            if (!await CompanySecurityService.DoesUserHaveAccessToCompanyPatient(patientId))
                return Unauthorized();

            var patientAllergyOnMedication = await
                _allergyService.GetPatientAllergyOnMedication(patientId, medicationNameId);

            return Ok(patientAllergyOnMedication);
        }

        [HttpGet]
        [Route("patient/{patientId}")]
        public async Task<IActionResult> GetPatientAllergies(Guid patientId)
        {
            if (!await CompanySecurityService.DoesUserHaveAccessToCompanyPatient(patientId))
                return Unauthorized();

            var patientAllergies = await _allergyService.GetAllByPatientId(patientId);
            return Ok(patientAllergies);
        }

        [HttpGet]
        [Route("patient/{patientId}/date/{dateTime}")]
        public async Task<IActionResult> Get(Guid patientId, DateTime dateTime)
        {
            if (!await CompanySecurityService.DoesUserHaveAccessToCompanyPatient(patientId))
                return Unauthorized();

            var patientAllergies =
                await _allergyService.GetByPatientIdAndDate(patientId, dateTime);

            return Ok(patientAllergies);
        }

        [HttpGet]
        [Route("allergyexistence/patient/{patientId}")]
        public async Task<IActionResult> GetLastPatientAllergy(Guid patientId)
        {
            if (!await CompanySecurityService.DoesUserHaveAccessToCompanyPatient(patientId))
                return Unauthorized();

            return Ok( await _allergyService.IsAllergyExist(patientId));
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody]AllergyViewModel allergyViewModel)
        {
            if (!ModelState.IsValid)
                return BadRequest();

            var patientId = allergyViewModel.PatientId;

            if (!await CompanySecurityService.DoesUserHaveAccessToCompanyPatient(patientId))
                return Unauthorized();

            var createUpdateTask = allergyViewModel.Id == Guid.Empty
                ? _allergyService.Create(allergyViewModel)
                : _allergyService.Update(allergyViewModel);

            await createUpdateTask;

            return Ok();
        }

        [HttpGet]
        [Route("dx/grid")]
        public object DxGridData(HistoryDxOptionsViewModel historyDxOptionsViewModel)
        {
            historyDxOptionsViewModel.PrimaryKey = new[] { "Id" };
            historyDxOptionsViewModel.PaginateViaPrimaryKey = true;

            return DataSourceLoader.Load(_allergyService.GetAll(historyDxOptionsViewModel),
                historyDxOptionsViewModel);
        }

        [HttpDelete]
        [Route("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var allergy = await _allergyService.GetById(id);
            if (allergy == null)
                return Ok();

            var patientId = allergy.PatientId;

            if (!await CompanySecurityService.DoesUserHaveAccessToCompanyPatient(patientId))
                return Unauthorized();

            await _allergyService.Delete(id);
            return Ok();
        }
    }
}

using System;
using System.Linq;
using System.Threading.Tasks;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Medico.Api.Controllers
{
    [Authorize]
    [Route("api/patientinsurance")]
    public class PatientInsuranceController : ApiController
    {
        private readonly IPatientInsuranceService _patientInsuranceService;

        public PatientInsuranceController(IPatientInsuranceService patientInsuranceService,
            ICompanySecurityService companySecurityService) : base(companySecurityService)
        {
            _patientInsuranceService = patientInsuranceService;
        }

        [HttpGet]
        [Route("patient/{patientId}")]
        public async Task<IActionResult> Get(Guid patientId)
        {
            if (!await CompanySecurityService.DoesUserHaveAccessToCompanyPatient(patientId))
                return Unauthorized();

            return Ok(await _patientInsuranceService.GetByPatientId(patientId));
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody]PatientInsuranceViewModel patientInsuranceViewModel)
        {
            if (!ModelState.IsValid)
                return BadRequest();

            var patientId = patientInsuranceViewModel.PatientId;
            if (!await CompanySecurityService.DoesUserHaveAccessToCompanyPatient(patientId))
                return Unauthorized();

            var createUpdateTask = patientInsuranceViewModel.Id == Guid.Empty
                ? _patientInsuranceService.Create(patientInsuranceViewModel)
                : _patientInsuranceService.Update(patientInsuranceViewModel);

            var savedPatientInsurance = await createUpdateTask;

            return Ok(savedPatientInsurance);
        }

        [HttpGet]
        [Route("maxMrn")]
        public async Task<IActionResult> GetMaxId()
        {
            var patientCount = _patientInsuranceService.GetAll().Where(c => c.MRN != null).Count();

            return Ok(_patientInsuranceService.GetMaxId() + patientCount + 1);
        }
    }
}

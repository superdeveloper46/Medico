using System.Threading.Tasks;
using Medico.Application.Interfaces;
using Medico.Application.PatientIdentificationCodes.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Medico.Api.Controllers
{
    [Authorize]
    [Route("api/patient-identification-numeric-codes")]
    public class PatientIdentificationNumericCodeController : ApiController
    {
        private readonly IPatientIdentificationCodeService _patientIdentificationCodeService;

        public PatientIdentificationNumericCodeController(ICompanySecurityService companySecurityService,
            IPatientIdentificationCodeService patientIdentificationCodeService)
            : base(companySecurityService)
        {
            _patientIdentificationCodeService = patientIdentificationCodeService;
        }

        [HttpGet]
        public async Task<IActionResult> Get(IdentificationCodeSearchFilterVm searchFilter)
        {
            if (!await CompanySecurityService.DoesUserHaveAccessToCompany(searchFilter.CompanyId))
                return Unauthorized();

            return Ok(await _patientIdentificationCodeService.GetNextValidNumericCodeValue(searchFilter));
        }
    }
}
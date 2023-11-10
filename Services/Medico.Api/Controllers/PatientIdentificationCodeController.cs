using System.Threading.Tasks;
using Medico.Application.Interfaces;
using Medico.Application.PatientIdentificationCodes.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Medico.Api.Controllers
{
    [Authorize]
    [Route("api/patient-identification-codes")]
    public class PatientIdentificationCodeController : ApiController
    {
        private readonly IPatientIdentificationCodeService _patientIdentificationCodeService;

        public PatientIdentificationCodeController(ICompanySecurityService companySecurityService,
            IPatientIdentificationCodeService patientIdentificationCodeService) 
            : base(companySecurityService)
        {
            _patientIdentificationCodeService = patientIdentificationCodeService;
        }
        
        [HttpGet]
        public async Task<IActionResult> Get(IdentificationCodeSearchFilterVm searchFilter)
        {
            if(!await CompanySecurityService.DoesUserHaveAccessToCompany(searchFilter.CompanyId))
                return Unauthorized();
            
            return Ok(await _patientIdentificationCodeService.Get(searchFilter));
        }
        
        [HttpPost]
        public async Task<IActionResult> Post([FromBody] PatientIdentificationCodeVm code)
        {
            if (!ModelState.IsValid)
                return BadRequest();

            if (!await CompanySecurityService.DoesUserHaveAccessToCompany(code.CompanyId))
                return Unauthorized();

            return Ok(await _patientIdentificationCodeService.Save(code));
        }
    }
}
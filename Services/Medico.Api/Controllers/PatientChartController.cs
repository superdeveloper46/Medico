using System;
using System.Threading.Tasks;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels.PatientChart;
using Medico.Application.ViewModels.PatientChartDocument;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Medico.Api.Controllers
{
    [Route("api/patient-charts")]
    public class PatientChartController : ApiController
    {
        private readonly IPatientChartService _patientChartService;

        public PatientChartController(ICompanySecurityService companySecurityService,
            IPatientChartService patientChartService)
            : base(companySecurityService)
        {
            _patientChartService = patientChartService;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> Get(PatientChartDocumentFilterVm searchFilterVm)
        {
            return Ok(await _patientChartService.GetByFilter(searchFilterVm));
        }

        [HttpPost]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> Post([FromBody]PatientChartVm patientChartVm)
        {
            var companyId = patientChartVm.CompanyId;
            if (companyId == null)
                return BadRequest();

            if (!await CompanySecurityService.DoesUserHaveAccessToCompany(companyId.Value))
                return Unauthorized();

            return Ok(await _patientChartService
                .Update(patientChartVm));
        }

        [HttpGet]
        [Route("list")]
        [Authorize]
        public async Task<IActionResult> List(PatientChartDocumentFilterVm searchFilterVm)
        {
            return Ok(new { data = await _patientChartService.GetAsList(searchFilterVm) });
        }

        [HttpGet]
        [Route("expression/{patientChartId}/{companyId}/{admissionId}")]
        [Authorize]
        public async Task<IActionResult> Expression(Guid patientChartId, Guid companyId, Guid admissionId)
        {
            return Ok(new { patientChartItemHtmlString = await _patientChartService.Expression(patientChartId, companyId, admissionId) });
        }
    }
}

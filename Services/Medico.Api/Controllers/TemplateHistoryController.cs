using System.Threading.Tasks;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels.TemplateHistory;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Medico.Api.Controllers
{
    [Authorize]
    [Route("api/template-history")]
    public class TemplateHistoryController : ApiController
    {
        #region DI
        private readonly IAdmissionService _admissionService;
        private readonly ITemplateHistoryService _templateHistoryService;

        public TemplateHistoryController(ICompanySecurityService companySecurityService,
            IAdmissionService admissionService,
            ITemplateHistoryService templateHistoryService)
            : base(companySecurityService)
        {
            _admissionService = admissionService;
            _templateHistoryService = templateHistoryService;
        }
        #endregion

        #region Methods
        [HttpGet]
        public async Task<IActionResult> Get(TemplateHistorySearchFilterVm searchFilter)
        {
            if (!ModelState.IsValid)
                return BadRequest();

            var admissionId = searchFilter.AdmissionId;

            var admission = await _admissionService
                .GetById(admissionId);

            if (admission == null)
                return NotFound();

            var patientId = admission.PatientId;
            if (!await CompanySecurityService.DoesUserHaveAccessToCompanyPatient(patientId))
                return Unauthorized();

            return Ok(await _templateHistoryService
                .GetPreviousTemplateContent(admissionId, searchFilter.TemplateId,
                    admission.PatientId, searchFilter.DocumentId));
        }
        #endregion
    }
}
using System;
using System.Threading.Tasks;
using DevExtreme.AspNet.Data;
using Medico.Api.Constants;
using Medico.Application.Interfaces;
using Medico.Application.Services.PatientChart;
using Medico.Application.ViewModels;
using Medico.Application.ViewModels.PatientChartDocument;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;

namespace Medico.Api.Controllers
{
    [Authorize]
    [Route("api/patient-chart-documents")]
    public class PatientChartDocumentController : ApiController
    {
        private readonly IPatientChartDocumentNodeService _patientChartDocumentNodeService;
        private readonly IPatientChartNodeManagementService _patientChartNodeManagementService;

        public PatientChartDocumentController(ICompanySecurityService companySecurityService,
            IPatientChartDocumentNodeService patientChartDocumentNodeService,
            IPatientChartNodeManagementService patientChartNodeManagementService)
            : base(companySecurityService)
        {
            _patientChartDocumentNodeService = patientChartDocumentNodeService;
            _patientChartNodeManagementService = patientChartNodeManagementService;
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] PatientChartDocumentSearchVm searchFilterVm)
        {
            return Ok(await _patientChartDocumentNodeService.GetByFilter(searchFilterVm));
        }

        [HttpGet]
        [Route("{id}")]
        public async Task<IActionResult> Get(Guid id)
        {
            var patientChartDocument = await _patientChartDocumentNodeService
                .GetWithVersionById(id);

            var company = patientChartDocument.CompanyId;
            if (!company.HasValue)
                return BadRequest();

            if (!await CompanySecurityService.DoesUserHaveAccessToCompany(company.Value))
                return Unauthorized();

            return Ok(patientChartDocument);
        }

        [HttpGet]
        [Route("getByCompanyId/{companyId}")]
        public object GetByCompanyId(Guid companyId)
        {
            var data = _patientChartDocumentNodeService.GetByCompanyId(companyId);

            return Ok(new
            {
                success = true,
                data = data.Result
            });
        }

        [HttpGet]
        [Route("{id}/nodes")]
        public async Task<IActionResult> GetPatientChartDocumentNodes(Guid id)
        {
            var patientChartDocument = await _patientChartDocumentNodeService
                .GetById(id);

            if (!await CompanySecurityService.DoesUserHaveAccessToCompany(patientChartDocument.CompanyId))
                return Unauthorized();

            return Ok(_patientChartNodeManagementService
                .SetPatientChartRootNode(
                    JsonConvert.DeserializeObject<PatientChartNode>(patientChartDocument
                        .PatientChartDocumentNodeJsonString)).GetNodes());
        }

        [Authorize(Roles = "Admin,SuperAdmin")]
        [HttpPatch]
        [Route("imported-documents")]
        public async Task<IActionResult> Patch(
            [FromBody] JsonPatchDocument<PatientChartDocumentsImportVm> documentsImportPatchVm)
        {
            var importedDocumentsPatch = new PatientChartDocumentsImportVm();
            documentsImportPatchVm.ApplyTo(importedDocumentsPatch);

            var importedDocuments = await _patientChartDocumentNodeService
                .ImportFromLibrary(importedDocumentsPatch);

            return Ok(importedDocuments);
        }

        [Route("{id}/version")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        [HttpPatch]
        public async Task<IActionResult> Patch(Guid id,
            [FromBody] JsonPatchDocument<PatientChartDocumentVersionPatchVm> libraryPatch)
        {
            var patientChartDocument =
                await _patientChartDocumentNodeService.GetWithVersionById(id);

            if (patientChartDocument == null)
                return Ok();

            var companyId = patientChartDocument.CompanyId;
            if (!companyId.HasValue)
                return BadRequest();

            if (!await CompanySecurityService.DoesUserHaveAccessToCompany(companyId.Value))
                return Unauthorized();

            var templatePatchVm = new PatientChartDocumentVersionPatchVm();
            libraryPatch.ApplyTo(templatePatchVm);

            await _patientChartDocumentNodeService.SyncWithLibrary(id, templatePatchVm.PatientChartRootNodeId);

            return Ok();
        }

        [HttpGet]
        [Route("{id}/copy")]
        public async Task<IActionResult> GetPatientChartDocumentCopy(Guid id)
        {
            var patientChartDocument = await _patientChartDocumentNodeService
                .GetById(id);

            var companyId = patientChartDocument.CompanyId;

            if (!await CompanySecurityService.DoesUserHaveAccessToCompany(companyId))
                return Unauthorized();

            return Ok(_patientChartDocumentNodeService.GetPatientChartDocumentCopy(patientChartDocument));
        }

        [HttpGet]
        [Route("dx/lookup")]
        public object DxLookupData(CompanyDxOptionsViewModel loadOptions)
        {
            var query = _patientChartDocumentNodeService
                .Lookup(loadOptions);

            loadOptions.PrimaryKey = new[] {"Id"};
            loadOptions.PaginateViaPrimaryKey = true;

            var takeItemsCount = loadOptions.Take;
            loadOptions.Take = takeItemsCount != 0
                ? takeItemsCount
                : AppConstants.SearchConfiguration.LookupItemsCount;

            return DataSourceLoader.Load(query, loadOptions);
        }
    }
}
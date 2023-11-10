using System;
using System.Linq;
using System.Threading.Tasks;
using DevExtreme.AspNet.Data;
using Medico.Api.Constants;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Medico.Application.ViewModels.TemplateType;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Mvc;

namespace Medico.Api.Controllers
{
    [Authorize]
    [Route("api/template-types")]
    public class TemplateTypeController : ApiController
    {
        #region DI
        private readonly ITemplateTypeService _templateTypeService;
        private readonly ITemplateService _templateService;
        public TemplateTypeController(
            ITemplateTypeService templateTypeService,
            ITemplateService templateService,
            ICompanySecurityService companySecurityService)
            : base(companySecurityService)
        {
            _templateTypeService = templateTypeService;
            _templateService = templateService;
        }
        #endregion

        #region Methods
        [Authorize(Roles = "Admin,SuperAdmin")]
        [HttpPost]
        public async Task<IActionResult> Post(
            [FromBody] TemplateTypeVm templateTypeViewModel)
        {
            if (!ModelState.IsValid)
                return BadRequest();

            var companyId = templateTypeViewModel.CompanyId;
            if (!companyId.HasValue)
                return BadRequest();

            if (!await CompanySecurityService.DoesUserHaveAccessToCompany(companyId.Value))
                return Unauthorized();

            var createUpdateTask = templateTypeViewModel.Id == Guid.Empty
                ? _templateTypeService.Create(templateTypeViewModel)
                : _templateTypeService.Update(templateTypeViewModel);

            await createUpdateTask;

            return Ok();
        }

        [HttpGet]
        [Authorize(Roles = "Admin,SuperAdmin")]
        [Route("{id}")]
        public async Task<IActionResult> Get(Guid id)
        {
            var templateType = await _templateTypeService.GetById(id);
            if (templateType == null)
                return Ok();

            var companyId = templateType.CompanyId;
            if (!companyId.HasValue)
                return BadRequest();

            if (!await CompanySecurityService.DoesUserHaveAccessToCompany(companyId.Value))
                return Unauthorized();

            return Ok(templateType);
        }

        [Authorize(Roles = "Admin,SuperAdmin")]
        [HttpPatch]
        [Route("{id}")]
        public async Task<IActionResult> Patch(Guid id, [FromBody] JsonPatchDocument<TemplateTypeVm> templatePatch)
        {
            var templateType = await _templateTypeService.GetById(id);
            if (templateType == null)
                return Ok();

            var companyId = templateType.CompanyId;
            if (!companyId.HasValue)
                return BadRequest();

            if (!await CompanySecurityService.DoesUserHaveAccessToCompany(companyId.Value))
                return Unauthorized();

            var templateViewModel = new TemplateTypeVm();
            templatePatch.ApplyTo(templateViewModel);

            if (templateViewModel.IsActive)
            {
                await _templateTypeService.ActivateTemplate(id);
                return Ok();
            }

            await _templateTypeService.DeactivateTemplate(id);

            return Ok();
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> Get(TemplateTypeSearchFilterVm templateTypeSearchFilter)
        {
            return Ok(await _templateTypeService
                .GetByFilter(templateTypeSearchFilter));
        }

        [HttpGet]
        [Authorize]
        [Route("company/{companyId}")]
        public async Task<IActionResult> GetByCompanyId(Guid companyId)
        {
            var result = await _templateTypeService
                .GetByFilter(new TemplateTypeSearchFilterVm());

            return Ok(result.Where(c => c.CompanyId == companyId));
        }

        [Authorize(Roles = "Admin,SuperAdmin")]
        [HttpDelete]
        [Route("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var templateType = await _templateTypeService.GetById(id);
            if (templateType == null)
                return Ok();

            var companyId = templateType.CompanyId;
            if (!companyId.HasValue)
                return BadRequest();

            if (!await CompanySecurityService.DoesUserHaveAccessToCompany(companyId.Value))
                return Unauthorized();

            await _templateTypeService.Delete(id);
            return Ok();
        }

        [HttpGet]
        [Authorize(Roles = "Admin,SuperAdmin")]
        [Route("dx/grid")]
        public object DxGridData(CompanyDxOptionsViewModel loadOptions)
        {
            var query = _templateTypeService.Grid(loadOptions);

            loadOptions.PrimaryKey = new[] { "Id" };
            loadOptions.PaginateViaPrimaryKey = true;

            return DataSourceLoader.Load(query, loadOptions);
        }

        [HttpGet]
        [Route("dx/lookup")]
        public object DxLookupData(CompanyDxOptionsViewModel loadOptions)
        {
            var query = _templateTypeService.Lookup(loadOptions);

            loadOptions.PrimaryKey = new[] { "Id" };
            loadOptions.PaginateViaPrimaryKey = true;

            var takeItemsCount = loadOptions.Take;
            loadOptions.Take = takeItemsCount != 0
                ? takeItemsCount
                : AppConstants.SearchConfiguration.LookupItemsCount;

            return DataSourceLoader.Load(query, loadOptions);
        }

        [HttpPost]
        [Route("duplicate")]
        public async Task<IActionResult> Duplicate([FromBody] TemplateDuplicateInputModel templateViewModel)
        {
            if (!ModelState.IsValid)
                return BadRequest();

            foreach (var companyId in templateViewModel.Companies)
            {
                TemplateTypeVm savedUpdatedTemplate = await SaveTemplateTypes(templateViewModel, companyId);

                foreach (var item in templateViewModel.Templates)
                {
                    await SaveTemplate(savedUpdatedTemplate, item, companyId);
                }
            }

            return Ok();
        }

        private async Task SaveTemplate(TemplateTypeVm savedUpdatedTemplate, Application.ViewModels.Template.TemplateVm item, string companyId)
        {
            var existingTemplate = await _templateService.GetById(item.Id);

            item.Id = Guid.NewGuid();
            item.TemplateTypeId = savedUpdatedTemplate.Id;
            item.DefaultTemplateHtml = existingTemplate.DefaultTemplateHtml ?? string.Empty;
            item.DetailedTemplateHtml = existingTemplate.DetailedTemplateHtml ?? string.Empty;

            item.DependentTemplates = existingTemplate.DependentTemplates;
            item.TemplatePhrasesUsage = existingTemplate.TemplatePhrasesUsage;
            item.CompanyId = Guid.Parse(companyId);

            var savedTemplate = await _templateService.Create(item);
        }

        private async Task<TemplateTypeVm> SaveTemplateTypes(TemplateDuplicateInputModel templateViewModel, string companyId)
        {
            var templateTypeViewModel = new TemplateTypeVm
            {
                IsActive = true,
                IsPredefined = false,
                LibraryTemplateTypeId = Guid.Parse("3D894F76-4459-4E05-87FE-F37225B42E39"),
                Name = templateViewModel.NewTitle,
                Title = templateViewModel.NewTitle,
                CompanyId = Guid.Parse(companyId)
            };

            var createUpdateTask = templateTypeViewModel.Id == Guid.Empty
               ? _templateTypeService.Create(templateTypeViewModel)
               : _templateTypeService.Update(templateTypeViewModel);

            var savedUpdatedTemplate = await createUpdateTask;
            return savedUpdatedTemplate;
        }
        #endregion
    }
}

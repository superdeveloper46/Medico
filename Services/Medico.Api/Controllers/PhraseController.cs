using System;
using System.Threading.Tasks;
using DevExtreme.AspNet.Data;
using Medico.Api.Constants;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Medico.Application.ViewModels.Phrase;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Medico.Api.Controllers
{
    [Authorize]
    [Route("api/phrase")]
    public class PhraseController : ApiController
    {
        private readonly IPhraseService _phraseServiceService;
        private readonly IPhraseCategoryService _phraseCategoryServiceService;
        public PhraseController(IPhraseService phraseService,
            IPhraseCategoryService phraseCategoryServiceService,
            ICompanySecurityService companySecurityService) : base(companySecurityService)
        {
            _phraseServiceService = phraseService;
            _phraseCategoryServiceService = phraseCategoryServiceService;
        }

        [HttpGet]
        public async Task<IActionResult> Get(PhraseDxOptionsViewModel loadOptions)
        {
            var queryItems = await _phraseServiceService.Lookup(loadOptions);

            loadOptions.PrimaryKey = new[] { "Id" };
            loadOptions.PaginateViaPrimaryKey = true;

            return Ok(DataSourceLoader.Load(queryItems, loadOptions));
        }

        [Authorize(Roles = "SuperAdmin,Admin")]
        [HttpPost]
        public async Task<IActionResult> Post([FromBody] PhraseVm phraseViewModel)
        {
            if (!ModelState.IsValid)
                return BadRequest();

            var companyId = phraseViewModel.CompanyId;
            if (!await CompanySecurityService.DoesUserHaveAccessToCompany(companyId))
                return Unauthorized();

            var createUpdateTask = phraseViewModel.Id == Guid.Empty
                ? _phraseServiceService.Create(phraseViewModel)
                : _phraseServiceService.Update(phraseViewModel);

            var savedUpdatedPhrase = await createUpdateTask;

            return Ok(savedUpdatedPhrase);
        }

        [HttpPost]
        [Route("category")]
        public async Task<IActionResult> PostPhraseCategory([FromBody] PhraseCategoryViewModel phraseCategoryViewModel)
        {
            if (!ModelState.IsValid)
                return BadRequest();

            var createUpdateTask = phraseCategoryViewModel.Id == Guid.Empty
                ? _phraseCategoryServiceService.Create(phraseCategoryViewModel)
                : _phraseCategoryServiceService.Update(phraseCategoryViewModel);

            var savedUpdatedPhraseCategory = await createUpdateTask;

            return Ok(savedUpdatedPhraseCategory);
        }

        [HttpGet]
        [Route("category")]
        public IActionResult GetPhraseCategory()
        {
            var phraseCategories = _phraseCategoryServiceService.GetAll();

            return Ok(phraseCategories);
        }

        [HttpGet]
        [Route("category/{id}")]
        public async Task<IActionResult> GetCatById(Guid id)
        {
            var phraseCategory = await _phraseCategoryServiceService.GetCatById(id);

            return Ok(phraseCategory);
        }

        [HttpGet]
        [Route("{id}")]
        public async Task<IActionResult> Get(Guid id)
        {
            var phrase = await _phraseServiceService.GetById(id);
            if (phrase == null)
                return Ok();

            if (!await CompanySecurityService.DoesUserHaveAccessToCompany(phrase.CompanyId))
                return Unauthorized();

            return Ok(phrase);
        }

        [HttpGet]
        [Route("name/{name}/company/{companyId}")]
        public async Task<IActionResult> Get(string name, Guid companyId)
        {
            if (!await CompanySecurityService.DoesUserHaveAccessToCompany(companyId))
                return Unauthorized();

            var phrase = await _phraseServiceService
                .GetByName(name, companyId);

            return Ok(phrase);
        }

        [Authorize(Roles = "SuperAdmin,Admin")]
        [HttpDelete]
        [Route("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var phrase = await _phraseServiceService.GetById(id);
            if (phrase == null)
                return Ok();

            var companyId = phrase.CompanyId;
            if (!await CompanySecurityService.DoesUserHaveAccessToCompany(companyId))
                return Unauthorized();

            await _phraseServiceService.Delete(id);
            return Ok();
        }

        [HttpGet]
        [Authorize(Roles = "SuperAdmin,Admin")]
        [Route("dx/grid")]
        public object DxGridData(CompanyDxOptionsViewModel loadOptions)
        {
            var query = _phraseServiceService.Grid(loadOptions);

            loadOptions.PrimaryKey = new[] { "Id" };
            loadOptions.PaginateViaPrimaryKey = true;

            return DataSourceLoader.Load(query, loadOptions);
        }

        [HttpGet]
        [Route("dx/lookup")]
        public async Task<object> DxLookupData(PhraseDxOptionsViewModel loadOptions)
        {
            var queryItems = await _phraseServiceService.Lookup(loadOptions);

            loadOptions.PrimaryKey = new[] { "Id" };
            loadOptions.PaginateViaPrimaryKey = true;

            var takeItemsCount = loadOptions.Take;
            loadOptions.Take = takeItemsCount != 0
                ? takeItemsCount
                : AppConstants.SearchConfiguration.LookupItemsCount;

            return DataSourceLoader.Load(queryItems, loadOptions);
        }
    }
}
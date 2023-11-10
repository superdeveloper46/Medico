using System.Threading.Tasks;
using DevExtreme.AspNet.Data;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Medico.Application.ViewModels.PhraseUsage;
using Microsoft.AspNetCore.Mvc;

namespace Medico.Api.Controllers
{
    [Route("api/phrase-usage")]
    public class PhraseUsageController : ApiController
    {
        private readonly IPhraseUsageService _phraseUsageService;
        
        public PhraseUsageController(ICompanySecurityService companySecurityService,
            IPhraseUsageService phraseUsageService) 
            : base(companySecurityService)
        {
            _phraseUsageService = phraseUsageService;
        }
        
        [HttpPost]
        public async Task<IActionResult> Post([FromBody] PhraseUsageVm phraseUsage)
        {
            await _phraseUsageService.Update(phraseUsage);
            return Ok(phraseUsage);
        }
        
        [HttpGet]
        [Route("dx/grid")]
        public async Task<object> DxGridData(CompanyDxOptionsViewModel loadOptions)
        {
            var query = await _phraseUsageService.Grid(loadOptions);

            loadOptions.PrimaryKey = new[] { "PhraseId" };
            loadOptions.PaginateViaPrimaryKey = true;

            return DataSourceLoader.Load(query, loadOptions);
        }
    }
}
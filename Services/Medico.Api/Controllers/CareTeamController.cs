using DevExtreme.AspNet.Data;
using Medico.Api.Constants;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Medico.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CareTeamController : ApiController
    {
        private readonly IVendorDataService _vendorDataService;
   

        #region DI
        public CareTeamController(IVendorDataService vendorDataService, ICompanySecurityService companySecurityService) : base(companySecurityService)
        {
            _vendorDataService = vendorDataService;
        }
        #endregion

        #region Methods

        [HttpGet]
        [Route("Get-CareTeam/{patientId}")]
        public async Task<IActionResult> GetCareTeamDdl(string patientId)
        {
            IEnumerable<CareTeamViewModel> careteam = await _vendorDataService.GetCareTeamDdl(patientId);
            return Ok(new
            {
                Data = careteam,
                success = true,
                Message = "done"
            });
        }
        [HttpGet]
        [Route("Get-CareTeamAdditionalInformation")]
        public async Task<IActionResult> GetCareTeamAdditionalInformationDdl()
        {
            IEnumerable<CareTeamAdditionalInformationViewModel> careteamadditionalinformation = await _vendorDataService.GetCareTeamAdditionalInformationDdl();
            return Ok(new
            {
                Data = careteamadditionalinformation   
,
                success = true,
                Message = "done"
            });
        }

        [HttpGet]
        [Route("dx/lookup")]
        public object DxLookupData(CompanyDxOptionsViewModel loadOptions)
        {
            var query = _vendorDataService.GetCareTeamAllForLookup(loadOptions, AppConstants.SearchConfiguration.LookupItemsCount);

            return DataSourceLoader.Load(query, loadOptions);
        }
        #endregion
    }
}
using DevExtreme.AspNet.Data;
using Medico.Api.Constants;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace Medico.Api.Controllers
{
    [Route("api/insurance")]
    [ApiController]
    public class InsuranceController : ControllerBase
    {
        private readonly IInsuranceService _insuranceService;

        public InsuranceController(IInsuranceService insuranceService)
        {
            _insuranceService = insuranceService;
        }

        [HttpPost]
        [Route("company")]
        public async Task<IActionResult> Post([FromBody] InsuranceCompanyViewModel insuranceCompanyViewModel)
        {
            var dynamic = insuranceCompanyViewModel.Id == Guid.Empty ? "added" : "updated";
            try
            {
                var createUpdateTask = insuranceCompanyViewModel.Id == Guid.Empty
                               ? _insuranceService.Create(insuranceCompanyViewModel)
                               : _insuranceService.Update(insuranceCompanyViewModel);

                await createUpdateTask;

                return Ok(new { success = true, message = $"Insurance company {dynamic} successfully" });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, message = $"Insurance company could not be { dynamic}" });
            }

        }

        [HttpGet]
        [Route("company/dx/grid")]
        public object DxGridData(DxOptionsViewModel dxOptionsViewModel)
        {
            dxOptionsViewModel.PrimaryKey = new[] { "Id" };
            dxOptionsViewModel.PaginateViaPrimaryKey = true;

            return DataSourceLoader.Load(_insuranceService.GetAllCompanies(),
                dxOptionsViewModel);
        }

        [HttpGet]
        [Route("company/{id}")]
        public object GetById(string id)
        {
            var insuranceCompany = _insuranceService.GetById(new Guid(id));

            return Ok(new
            {
                success = true,
                data = insuranceCompany.Result
            });
        }

        [HttpGet]
        [Route("company/dx/lookup")]
        public object DxLookupData(DxOptionsViewModel loadOptions)
        {
            var query = _insuranceService
                .GetAllCompaniesForLookup(loadOptions, AppConstants.SearchConfiguration.LookupItemsCount);

            return DataSourceLoader.Load(query, loadOptions);
        }

        [HttpDelete]
        [Route("company/{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                var alcoholHistory = await _insuranceService.GetById(id);
                if (alcoholHistory == null)
                    return Ok();

                await _insuranceService.DeleteCompany(id);
                return Ok(new
                {
                    success = true,
                    message = "Insurance company deleted  successfully"
                });
            }
            catch (Exception ex)
            {
                return Ok(new
                {
                    success = false,
                    message = "Insurance company could not be deleted"
                });
            }

        }

    }
}

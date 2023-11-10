using DevExtreme.AspNet.Data;
using Medico.Api.Constants;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace Medico.Api.Controllers
{
    [Route("api/vitalsigns-lookup")]
    [ApiController]
    public class VitalSignsLookUpController : ControllerBase
    {
        #region DI
        private readonly IVitalSignsLookUpService _vitalSignsLookUpService;

        public VitalSignsLookUpController(IVitalSignsLookUpService vitalSignsLookUpService)
        {
            _vitalSignsLookUpService = vitalSignsLookUpService;
        }
        #endregion

        #region Methods
        [HttpPost]
        public async Task<IActionResult> Post([FromBody] VitalSignsLookUpViewModel vitalSignsLookUpViewModel)
        {
            var dynamic = vitalSignsLookUpViewModel.Id == Guid.Empty ? "added" : "updated";
            vitalSignsLookUpViewModel.Gender = string.IsNullOrEmpty(vitalSignsLookUpViewModel.Gender) ? "na" : vitalSignsLookUpViewModel.Gender;

            try
            {
                var createUpdateTask = vitalSignsLookUpViewModel.Id == Guid.Empty
                               ? _vitalSignsLookUpService.Create(vitalSignsLookUpViewModel)
                               : _vitalSignsLookUpService.Update(vitalSignsLookUpViewModel);

                await createUpdateTask;

                return Ok(new { success = true, message = $"Look up Values {dynamic} successfully" });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, message = $"Look up Values could not be { dynamic}" });
            }

        }

        [HttpGet]
        [Route("dx/grid")]
        public object DxGridData(DxOptionsViewModel dxOptionsViewModel)
        {
            dxOptionsViewModel.PrimaryKey = new[] { "Id" };
            dxOptionsViewModel.PaginateViaPrimaryKey = true;

            return DataSourceLoader.Load(_vitalSignsLookUpService.GetAll(),
                dxOptionsViewModel);
        }

        [HttpGet]
        [Route("{id}")]
        public object GetById(string id)
        {
            var insuranceCompany = _vitalSignsLookUpService.GetById(new Guid(id));

            return Ok(new
            {
                success = true,
                data = insuranceCompany.Result
            });
        }

        [HttpGet]
        [Route("dx/lookup")]
        public object DxLookupData(DxOptionsViewModel loadOptions)
        {
            var query = _vitalSignsLookUpService
                .GetAllForLookup(loadOptions, AppConstants.SearchConfiguration.LookupItemsCount);

            return DataSourceLoader.Load(query, loadOptions);
        }

        [HttpDelete]
        [Route("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                var alcoholHistory = await _vitalSignsLookUpService.GetById(id);
                if (alcoholHistory == null)
                    return Ok();

                await _vitalSignsLookUpService.Delete(id);
                return Ok(new
                {
                    success = true,
                    message = "Look up Values deleted  successfully"
                });
            }
            catch (Exception ex)
            {
                return Ok(new
                {
                    success = false,
                    message = "Look up Values could not be deleted"
                });
            }

        }
        #endregion
    }
}

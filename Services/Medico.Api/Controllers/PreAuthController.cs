using DevExtreme.AspNet.Data;
using Medico.Api.Constants;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace Medico.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PreAuthController : ApiController
    {
        #region DI
        private readonly IPreAuthDataService _preAuthDataService;

        public PreAuthController(IPreAuthDataService preAuthDataService, ICompanySecurityService companySecurityService) : base(companySecurityService)
        {
            _preAuthDataService = preAuthDataService;
        }
        #endregion

        #region Methods
        [HttpPost]
        public async Task<IActionResult> Post([FromBody] PreAuthDataViewModel preAuthDataViewModel)
        {
            try
            {
                if(preAuthDataViewModel.Id == Guid.Empty)
                {
                    preAuthDataViewModel.CreatedOn = DateTime.UtcNow;
                }
                else
                {
                    preAuthDataViewModel.ModifiedOn = DateTime.UtcNow;
                }

                var companyId = preAuthDataViewModel.CompanyId;

                if (!await CompanySecurityService.DoesUserHaveAccessToCompany(companyId))
                    return Unauthorized();

                var createUpdateTask = preAuthDataViewModel.Id == Guid.Empty
                               ? _preAuthDataService.Create(preAuthDataViewModel)
                               : _preAuthDataService.Update(preAuthDataViewModel);

                await createUpdateTask;

                return Ok(new { success = true, message = $"Data added", data = preAuthDataViewModel });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, message = $"Data could not be added" });
            }

        }

        [HttpGet]
        [Route("dx/grid")]
        public object DxGridData(DxOptionsViewModel dxOptionsViewModel)
        {
            dxOptionsViewModel.PrimaryKey = new[] { "Id" };
            dxOptionsViewModel.PaginateViaPrimaryKey = true;

            return DataSourceLoader.Load(_preAuthDataService.GetAll(),
                dxOptionsViewModel);
        }

        [HttpGet]
        [Route("{id}")]
        public object GetById(string id)
        {
            var preAuthData = _preAuthDataService.GetById(new Guid(id));

            return Ok(new
            {
                success = true,
                data = preAuthData.Result
            });
        }

        [HttpGet]
        [Route("appointmentId/{appointmentId}")]
        public object GetAll(Guid appointmentId)
        {
            var preAuthData = _preAuthDataService.GetByAppointmentId(appointmentId);

            return Ok(new
            {
                success = true,
                data = preAuthData.Result
            });
        }

        [HttpGet]
        [Route("companyId/{companyId}")]
        public object GetByCompanyId(Guid companyId)
        {
            var preAuthData = _preAuthDataService.GetByCompanyId(companyId);

            return Ok(new
            {
                success = true,
                data = preAuthData.Result
            });
        }

        /*[HttpGet]
        [Route("dx/lookup")]
        public object DxLookupData(DxOptionsViewModel loadOptions)
        {
            var query = _preAuthDataService
                .GetAllForLookup(loadOptions, AppConstants.SearchConfiguration.LookupItemsCount);

            return DataSourceLoader.Load(query, loadOptions);
        }*/

        [HttpDelete]
        [Route("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                var alcoholHistory = await _preAuthDataService.GetById(id);
                if (alcoholHistory == null)
                    return Ok();

                await _preAuthDataService.Delete(id);
                return Ok(new
                {
                    success = true,
                    message = "Data deleted  successfully"
                });
            }
            catch (Exception ex)
            {
                return Ok(new
                {
                    success = false,
                    message = "Data could not be deleted"
                });
            }

        }
        #endregion
    }
}

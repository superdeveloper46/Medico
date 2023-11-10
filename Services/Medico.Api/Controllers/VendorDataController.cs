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
    public class VendorDataController : ApiController
    {
        private readonly IVendorDataService _vendorDataService;

        #region DI
        public VendorDataController(IVendorDataService vendorDataService, ICompanySecurityService companySecurityService) : base(companySecurityService)
        {
            _vendorDataService = vendorDataService;
        }
        #endregion

        #region Methods
        [HttpPost]
        public async Task<IActionResult> Post(VendorDataViewModel vendorDataViewModel)
        {

            int vendorId = await _vendorDataService.Create(vendorDataViewModel);
            return Ok(new
            {
                success = vendorId != 0,
                message = vendorId != 0 ? "Vendor saved." : "Error Saving Vendor",
                data = vendorId
            });

        }

        [HttpPut]
        [Route("{id}")]
        public async Task<IActionResult> Put(int id,VendorDataViewModel vendorDataViewModel)
        {

            bool result = await _vendorDataService.Update(id, vendorDataViewModel);

            return Ok(new
            {
                success = result == true,
                message = result == true ? "Vendor Updated." : "Error Updating Vendor",
                data = result
            });

        }

        [HttpGet]
        [Route("Get-Vendor")]
        public async Task<IActionResult> GetVendorDdl()
        {
            IEnumerable<VendorDataViewModel> vendor = await _vendorDataService.GetVendorDdl();
            return Ok(new
            {
                Data = vendor,
                success = true,
                Message = "done"
            });
        }
        
        [HttpDelete]
        [Route("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            bool result = await _vendorDataService.Delete(id);

            return Ok(new
            {
                success = result == true,
                message = result == true ? "Vendor Delete." : "Error Deleting Vendor",
                data = result
            });
        }
        #endregion
    }
}

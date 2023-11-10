using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using DevExtreme.AspNet.Data;
using Medico.Api.Constants;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Medico.Application.Services;
using System.Linq;
using Dapper;
using System.Collections.Generic;

namespace Medico.Api.Controllers
{
    [Authorize]
    [Route("api/business-hours")]
    public class BusinessHoursController : ApiController
    {
        private readonly IBusinessHourService _businessHourService;

        public BusinessHoursController(IBusinessHourService businessHourService,
            ICompanySecurityService companySecurityService) : base(companySecurityService)
        {
            _businessHourService = businessHourService;
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody]BusinessHourViewModel[] businessHourViewModels)
        {
            if (!ModelState.IsValid)
                return BadRequest();

            //var companyId = locationViewModel.CompanyId;
            //if (!await CompanySecurityService.DoesUserHaveAccessToCompany(companyId))
            //    return Unauthorized();
            await _businessHourService.DeleteAll();

            foreach (BusinessHourViewModel businessHourViewModel in businessHourViewModels)
            {
                businessHourViewModel.Id = Guid.NewGuid();
                await _businessHourService.Create(businessHourViewModel);
            }

            return Ok("");
        }

        [HttpGet]
        [Route("")]
        public async Task<IActionResult> Get()
        {
            IQueryable<BusinessHourViewModel> businessHourViewModel = _businessHourService.GetAll();
            if (businessHourViewModel == null)
                return Ok(null);

            return Ok(businessHourViewModel.AsList());
        }
    }
}
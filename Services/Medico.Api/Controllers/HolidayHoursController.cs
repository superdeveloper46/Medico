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
    [Route("api/holiday-hours")]
    public class HolidayHoursController : ApiController
    {
        private readonly IHolidayHourService _holidayHourService;

        public HolidayHoursController(IHolidayHourService holidayHourService,
            ICompanySecurityService companySecurityService) : base(companySecurityService)
        {
            _holidayHourService = holidayHourService;
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody]HolidayHourViewModel[] holidayHourViewModels)
        {
            if (!ModelState.IsValid)
                return BadRequest();

            //var companyId = locationViewModel.CompanyId;
            //if (!await CompanySecurityService.DoesUserHaveAccessToCompany(companyId))
            //    return Unauthorized();
            await _holidayHourService.DeleteAll();

            foreach (HolidayHourViewModel holidayHourViewModel in holidayHourViewModels)
            {
                holidayHourViewModel.Id = Guid.NewGuid();
                await _holidayHourService.Create(holidayHourViewModel);
            }

            return Ok("");
        }

        [HttpGet]
        [Route("")]
        public async Task<IActionResult> Get()
        {
            IQueryable<HolidayHourViewModel> holidayHourViewModel = _holidayHourService.GetAll();
            if (holidayHourViewModel == null)
                return Ok(null);

            return Ok(holidayHourViewModel.AsList());
        }
    }
}
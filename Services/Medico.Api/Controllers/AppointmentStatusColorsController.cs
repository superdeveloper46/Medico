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
    [Route("api/appointment-status-color")]
    public class AppointmentStatusColorsController : ApiController
    {
        private readonly IAppointmentStatusColorService _appointmentStatusColorService;

        public AppointmentStatusColorsController(IAppointmentStatusColorService appointmentStatusColorService,
            ICompanySecurityService companySecurityService) : base(companySecurityService)
        {
            _appointmentStatusColorService = appointmentStatusColorService;
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody]AppointmentStatusColorViewModel[] appointmentStatusColorViewModels)
        {
            if (!ModelState.IsValid)
                return BadRequest();

            //var companyId = locationViewModel.CompanyId;
            //if (!await CompanySecurityService.DoesUserHaveAccessToCompany(companyId))
            //    return Unauthorized();
            await _appointmentStatusColorService.DeleteAll();

            foreach (AppointmentStatusColorViewModel appointmentStatusColorViewModel in appointmentStatusColorViewModels)
            {
                appointmentStatusColorViewModel.Id = Guid.NewGuid();
                await _appointmentStatusColorService.Create(appointmentStatusColorViewModel);
            }

            return Ok("");
        }

        [HttpGet]
        [Route("")]
        public async Task<IActionResult> Get()
        {
            IQueryable<AppointmentStatusColorViewModel> appointmentStatusColorViewModel = _appointmentStatusColorService.GetAll();
            if (appointmentStatusColorViewModel == null)
                return Ok(null);

            return Ok(appointmentStatusColorViewModel.AsList());
        }
    }
}
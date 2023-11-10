using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Medico.Identity.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Medico.Api.Controllers
{
    [Authorize]
    [Route("api/basevitalsigns")]
    public class BaseVitalSignsController : ApiController
    {
        #region DI

        private readonly IBaseVitalSignsService _baseVitalSignsService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IUserService _userService;
        public BaseVitalSignsController(IBaseVitalSignsService baseVitalSignsService,
            UserManager<ApplicationUser> userManager,
            IUserService userService,
            ICompanySecurityService companySecurityService)
            : base(companySecurityService)
        {
            _baseVitalSignsService = baseVitalSignsService;
            _userManager = userManager;
            _userService = userService;
        }

        #endregion

        #region Methods

        [HttpGet]
        [Route("patient/{patientId}")]
        public async Task<IActionResult> GetByPatientId(Guid patientId)
        {
            if (!await CompanySecurityService
                .DoesUserHaveAccessToCompanyPatient(patientId))
                return Unauthorized();

            return Ok(await _baseVitalSignsService.GetByPatientId(patientId));
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] BaseVitalSignsViewModel baseVitalSignsViewModel)
        {
            if (!ModelState.IsValid)
                return BadRequest();

            var patientId = baseVitalSignsViewModel.PatientId;
            if (!await CompanySecurityService
                .DoesUserHaveAccessToCompanyPatient(patientId))
                return Unauthorized();

            baseVitalSignsViewModel.CreatedBy = CurrentUserId;
            baseVitalSignsViewModel.CreatedOn = DateTime.UtcNow;

            var createUpdateTask = baseVitalSignsViewModel.Id == Guid.Empty
                ? _baseVitalSignsService.Create(baseVitalSignsViewModel)
                : _baseVitalSignsService.Update(baseVitalSignsViewModel);

            var savedVitalSigns = await createUpdateTask;

            return Ok(savedVitalSigns);
        }

        [HttpGet]
        [Route("history/patient/{patientId}")]
        public async Task<IActionResult> GetHistoryByPatientId(Guid patientId)
        {
            if (!await CompanySecurityService
                .DoesUserHaveAccessToCompanyPatient(patientId))
                return Unauthorized();

            IEnumerable<BaseVitalSignsViewModel> vitalSigns = await _baseVitalSignsService.GetHistoryByPatientId(patientId);
            var aspNetUsers = _userManager.Users.ToList();
            var medAppUsers = _userService.GetAll().Where(c => c.EmployeeType != 7).ToList();

            var data = from vs in vitalSigns
                       join u in aspNetUsers on vs.CreatedBy equals u.Id
                       join m in medAppUsers on u.Email equals m.Email into gj
                       from subpet in gj.DefaultIfEmpty()
                       orderby vs.CreatedOn
                       select new BaseVitalSignsViewModel
                       {
                           Id = vs.Id,
                           CreatedBy = subpet == null ? "Superadmin" : $"{subpet.FirstName} {subpet.LastName}",
                           CreatedOn = vs.CreatedOn,
                           DominantHand = vs.DominantHand,
                           HeadCircumference = vs.HeadCircumference,
                           Height = vs.Height,
                           LeftBicep = vs.LeftBicep,
                           LeftCalf = vs.LeftCalf,
                           LeftForearm = vs.LeftForearm,
                           LeftThigh = vs.LeftThigh,
                           OxygenAmount = vs.OxygenAmount,
                           OxygenUse = vs.OxygenUse,
                           PatientId = vs.PatientId,
                           RightBicep = vs.RightBicep,
                           RightCalf = vs.RightCalf,
                           RightForearm = vs.RightForearm,
                           RightThigh = vs.RightThigh,
                           Weight = vs.Weight
                       };

            return Ok(new
            {
                Status = true,
                Data = data
            });
        }

        #endregion
    }
}
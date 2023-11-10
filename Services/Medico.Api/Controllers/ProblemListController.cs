using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Medico.Identity.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;


namespace Medico.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProblemListController : ApiController
    {
        #region DI

        private readonly IProblemListService _problemListService;
        private readonly IUserService _userService;
        private readonly UserManager<ApplicationUser> _userManager;

        public ProblemListController(IProblemListService problemListService,
            IUserService userService,
            UserManager<ApplicationUser> userManager,
            ICompanySecurityService companySecurityService) : base(companySecurityService)
        {
            _problemListService = problemListService;
            _userService = userService;
            _userManager = userManager;
        }

        #endregion

        #region Models

        [HttpGet]
        [Route("appointment/{appointmentId}")]
        public async Task<IActionResult> Get(Guid appointmentId)
        {
            var problemList = await _problemListService.GetByAppointmentId(appointmentId);
            problemList.ToList().ForEach(c => c.CreatedBy = "Superadmin");

            var users = _userService.GetAll().Where(c => c.RoleName != "Patient");
            var aspNetUsers = await _userManager.Users.ToListAsync();

            var list = from vs in problemList
                       join a in aspNetUsers on vs.CreatedBy equals a.Id 
                       join u in users on a.Email equals u.Email into gj
                       from subpet in gj.DefaultIfEmpty()
                       select new ProblemListViewModel
                       {
                           Id = vs.Id,
                           Assessment = vs.Assessment,
                           CreatedBy = subpet.FirstName ?? "Superadmin",
                           CreatedOn = vs.CreatedOn,
                           Status = vs.Status,
                           Notes = vs.Notes
                       };

            return Ok(new
            {
                status = true,
                data = list.Count() == 0 ? problemList : list
            });
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] ProblemListViewModel problemListViewModel)
        {
            problemListViewModel.CreatedBy = CurrentUserId;
            problemListViewModel.CreatedOn = DateTime.UtcNow.AddHours(-7);

            var createUpdateTask = problemListViewModel.Id == Guid.Empty
                ? _problemListService.Create(problemListViewModel)
                : _problemListService.Update(problemListViewModel);

            var savedProblemList = await createUpdateTask;

            return Ok(new
            {
                status = true,
                message = "Problem list added",
                data = savedProblemList
            });
        }

        #endregion
    }
}

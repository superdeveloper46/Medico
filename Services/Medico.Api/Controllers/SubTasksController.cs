using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Medico.Domain.Models;
using Medico.Identity.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;


namespace Medico.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SubTasksController : ApiController
    {
        #region DI
        private readonly ISubTaskService _subTaskService;
        private readonly ISubTaskUserService _subTaskUserService;
        private readonly IUserService _userService;
        private readonly UserManager<ApplicationUser> _userManager;

        public SubTasksController(
            IUserService userService,
             UserManager<ApplicationUser> userManager,
            ISubTaskService subTaskService,
            ISubTaskUserService subTaskUserService,
            ICompanySecurityService companySecurityService) : base(companySecurityService)
        {
            _subTaskService = subTaskService;
            _subTaskUserService = subTaskUserService;
            _userService = userService;
            _userManager = userManager;
        }
        #endregion

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] SubTaskInputModel subTaskInputModel)
        {
            if (!ModelState.IsValid)
                return BadRequest();

            SubTaskViewModel subTaskViewModel = new SubTaskViewModel
            {
                CreatedBy = CurrentUserId,
                CreatedOn = DateTime.UtcNow,
                ReporterId = CurrentUserId,
                Status = "Open",
                Description = subTaskInputModel.Description,
                Title = subTaskInputModel.Title,
                DueDate = subTaskInputModel.DueDate,
                NotificationId = subTaskInputModel.NotificationId,
                Priority = subTaskInputModel.Priority,
                TaskTypeId = subTaskInputModel.TaskTypeId,
                CreateDate = subTaskInputModel.CreateDate,
                NotificationStatus = subTaskInputModel.NotificationStatus,
                PatientOrderId = subTaskInputModel.PatientOrderId
            };

            var id = subTaskInputModel.Id;
            if(id != "") {
                subTaskViewModel.Id = new Guid(id);
                await _subTaskUserService.DeleteBySubTaskId(new Guid(id));
            }
            // sub task
            var createUpdateTask = subTaskViewModel.Id == Guid.Empty
                ? _subTaskService.Create(subTaskViewModel)
                : _subTaskService.Update(subTaskViewModel);

            await createUpdateTask;



            for (int i = 0; i < subTaskInputModel.UserIds.Length; i++)
            {
                SubTaskUserViewModel subTaskUserViewModel = new SubTaskUserViewModel
                {
                    SubTaskId = subTaskViewModel.Id,
                    UserId = subTaskInputModel.UserIds[0]
                };

                // sub task user
                var createUpdateTask2 = _subTaskUserService.Create(subTaskUserViewModel);

                await createUpdateTask2;
            }

            return Ok(new
            {
                success = true,
                message = "Sub task added successfully"
            });
        }

        [HttpGet]
        [Route("{id}")]
        public async Task<IActionResult> Get(Guid id)
        {
            var subTask = await _subTaskService.GetById(id);
            if (subTask == null)
                return Ok();

            return Ok(subTask);
        }

        [HttpGet]
        [Route("notification/{notificationId}")]
        public async Task<IActionResult> GetByNotification(int notificationId)
        {
            IEnumerable<SubTaskViewModel> subTasks = await _subTaskService.GetByNotification(notificationId);
            if (subTasks == null)
                return Ok();

            foreach (var item in subTasks)
            {
                item.SubTaskUsers = await GetTaskAssignees(item.Id);
            }

            return Ok(new
            {
                success = true,
                message = "Sub task fetched successfully",
                data = subTasks
            });
        }

        private async Task<IEnumerable<SubTaskUserViewModel>> GetTaskAssignees(Guid id)
        {
            var subTaskUsers = await _subTaskUserService.GetByTaskId(id);

            var users = _userService.GetAll().Where(c => c.EmployeeType != 7).ToList();
            var aspNetUsers = await _userManager.Users.ToListAsync();

            var list = from u in users
                       join a in aspNetUsers on u.Email equals a.Email
                       join sub in subTaskUsers on a.Id equals sub.UserId
                       select new SubTaskUserViewModel
                       {
                           Id = Guid.Parse(a.Id),
                           FullName = $"{u.FirstName} {u.LastName}",
                       };

            return list;
        }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DevExtreme.AspNet.Data;
using Medico.Api.Constants;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Medico.Identity.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Medico.Api.Controllers
{
    [Route("api/user")]
    public class UserController : ApiController
    {
        #region DI
        private readonly IUserService _userService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IUniqueUsernameService _uniqueUsernameService;

        public UserController(IUserService userService,
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            ICompanySecurityService companySecurityService,
            IVendorDataService vendorDataService,
            IUniqueUsernameService usernameService) : base(companySecurityService)
        {
            _userService = userService;
            _userManager = userManager;
            _roleManager = roleManager;
            _uniqueUsernameService = usernameService;
        }
        #endregion

        #region Methods
        [Route("email/{email}")]
        [HttpGet]
        public async Task<EntityExistenceViewModel> GetUserExistence(string email)
        {
            var entityExistenceModel = new EntityExistenceViewModel();

            var user = await _userManager.FindByEmailAsync(email);
            if (user != null)
                entityExistenceModel.IsEntityExist = true;

            return entityExistenceModel;
        }

        [Route("companies/email/{email}")]
        [HttpGet]
        public async Task<IEnumerable<LookupViewModel>> GetUserCompanies(string email)
        {
            return await _userService.GetUserCompanies(email);
        }

        [HttpGet]
        [Route("companies")]
        public async Task<IActionResult> GetPatientCompanies(UserIdentificationInfoVm userIdentificationInfo)
        {
            if (!ModelState.IsValid)
                return BadRequest();

            var userCompanies =
                await _userService.GetPatientCompanies(userIdentificationInfo);

            return Ok(userCompanies);
        }

        [HttpGet]
        //[Authorize(Roles = "Admin,SuperAdmin")]
        [Route("{id}")]
        public async Task<IActionResult> Get(Guid id)
        {
            var user = await _userService.GetByUserId(id);
            if (user == null)
            {
                return Ok();
            }
            var companyId = user.CompanyId;
            if (!await CompanySecurityService.DoesUserHaveAccessToCompany(companyId))
            {
                return Unauthorized();
            }

            if(user.EmployeeTypes == null || user.EmployeeTypes.Count() == 0)
            {
                user.EmployeeTypes = new int[] { user.EmployeeType };
            }
            return Ok(user);
        }

        [HttpGet]
        //[Authorize(Roles = "Admin,SuperAdmin")]
        [Route("medicoUser/{email}")]
        public async Task<IActionResult> Get(string email)
        {
            var user = await _userService.GetByUserEmail(email);
            if (user == null)
            {
                return Ok();
            }
            var companyId = user.CompanyId;
            if (!await CompanySecurityService.DoesUserHaveAccessToCompany(companyId))
            {
                return Unauthorized();
            }

            if(user.EmployeeTypes == null || user.EmployeeTypes.Count() == 0)
            {
                user.EmployeeTypes = new int[] { user.EmployeeType };
            }
            return Ok(user);
        }

        [Authorize(Roles = "Admin,SuperAdmin")]
        [HttpPost]
        public async Task<IActionResult> Post(
            [FromBody] MedicoApplicationCreateUserViewModel medicoApplicationCreateUserViewModel)
        {
            if (!ModelState.IsValid)
                return BadRequest();

            var companyId = medicoApplicationCreateUserViewModel.CompanyId;
            if (!await CompanySecurityService.DoesUserHaveAccessToCompany(companyId))
                return Unauthorized();

            var isNewUser = medicoApplicationCreateUserViewModel.Id == Guid.Empty;

            if(medicoApplicationCreateUserViewModel.EmployeeTypes.Count() > 0)
            {
                medicoApplicationCreateUserViewModel.EmployeeType = medicoApplicationCreateUserViewModel.EmployeeTypes.First();
            }
            
            var createUpdateTask = isNewUser
                ? _userService.Create(medicoApplicationCreateUserViewModel)
                : _userService.Update(medicoApplicationCreateUserViewModel);

            await createUpdateTask;

            var newRoleId = medicoApplicationCreateUserViewModel.Role;
            var newRole = await _roleManager.FindByIdAsync(newRoleId);

            var email = medicoApplicationCreateUserViewModel.Email;
            var username = _uniqueUsernameService.Get(email, companyId);

            if (isNewUser)
            {
                var password = medicoApplicationCreateUserViewModel.Password;

                var newUser = new ApplicationUser
                {
                    Email = email,
                    UserName = username,
                    EmailConfirmed = true,
                    CompanyId = companyId
                };

                await _userManager.CreateAsync(newUser, password);
            }

            var medicoApplicationUser = await _userManager.FindByNameAsync(username);

            if (isNewUser)
            {
                await _userManager.AddToRoleAsync(medicoApplicationUser, newRole.Name);
            }
            else
            {
                var userRoles = await _userManager.GetRolesAsync(medicoApplicationUser);
                if (userRoles.Contains(newRole.Name))
                    return Ok();

                await _userManager.RemoveFromRolesAsync(medicoApplicationUser, userRoles);
                await _userManager.AddToRoleAsync(medicoApplicationUser, newRole.Name);
            }

            return Ok();
        }

        [HttpGet]
        [Authorize(Roles = "Admin,SuperAdmin")]
        [Route("dx/grid")]
        public object DxGridData(CompanyDxOptionsViewModel loadOptions)
        {
            var query = _userService.Grid(loadOptions);
            query = query.Where(x => x.EmployeeType != 7);

            loadOptions.PrimaryKey = new[] { "Id" };
            loadOptions.PaginateViaPrimaryKey = true;

            return DataSourceLoader.Load(query, loadOptions);
        }

        [HttpGet]
        [Authorize]
        [Route("dx/lookup")]
        public object DxLookupData(UserDxOptionsViewModel loadOptions)
        {
            var query = _userService.Lookup(loadOptions);

            loadOptions.PrimaryKey = new[] { "Id" };
            loadOptions.PaginateViaPrimaryKey = true;

            var takeItemsCount = loadOptions.Take;
            loadOptions.Take = takeItemsCount != 0
                ? takeItemsCount
                : AppConstants.SearchConfiguration.LookupItemsCount;

            return DataSourceLoader.Load(query, loadOptions);
        }

        [Authorize(Roles = "Admin,SuperAdmin")]
        [HttpDelete]
        [Route("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var medicoApplicationUser = await _userService.GetById(id);
            if (medicoApplicationUser == null)
                return Ok();

            var companyId = medicoApplicationUser.CompanyId;
            if (!await CompanySecurityService.DoesUserHaveAccessToCompany(companyId))
                return Unauthorized();

            await _userService.Delete(id);

            var email = medicoApplicationUser.Email;
            var username = _uniqueUsernameService.Get(email, companyId);

            var identityUser = await _userManager.FindByNameAsync(username);

            if (identityUser == null)
                return Ok();

            await _userManager.DeleteAsync(identityUser);

            return Ok();
        }
        #endregion

        #region Methods2
        [HttpGet]
        [Authorize]
        [Route("ddl")]
        public object DropdownData(string companyId, int empType)
        {
            var loadOptions = new UserDxOptionsViewModel
            {
                CompanyId = new Guid(companyId),
                EmployeeType = empType
            };
            var query = _userService.Lookup(loadOptions);

            loadOptions.PrimaryKey = new[] { "Id" };
            loadOptions.PaginateViaPrimaryKey = true;

            var takeItemsCount = loadOptions.Take;
            loadOptions.Take = takeItemsCount != 0
                ? takeItemsCount
                : AppConstants.SearchConfiguration.LookupItemsCount;

            return DataSourceLoader.Load(query, loadOptions);
        }

        [HttpGet]
        [Authorize]
        [Route("medico-staff")]
        public async Task<IActionResult> MedicoUser(string companyId)
        {
            var compId = Guid.Parse(companyId);
            var users = _userService.GetAll().Where(c => c.CompanyId == compId && c.EmployeeType != 7 && c.IsActive).ToList();
            var aspNetUsers = await _userManager.Users.Where(c => c.CompanyId == compId).ToListAsync();

            var list = from u in users
                       join a in aspNetUsers on u.Email equals a.Email
                       select new MedicoApplicationUserViewModel
                       {
                           Id = Guid.Parse(a.Id),
                           FirstName = $"{u.FirstName} {u.LastName}",
                           MedicoUserId = u.Id
                       };

            return Ok(list);
        }

        [HttpGet]
        [Authorize]
        [Route("careTeam-provider")]
        public async Task<IActionResult> CareTeamProvider(string companyId, string patientId)
        {
            Guid cId = Guid.Parse(companyId);
            Guid pId = Guid.Parse(patientId);

            return Ok(_userService.GetCareTeamProviders(cId, pId));
        }

        [HttpGet]
        [Route("getProfile/{email}")]
        public async Task<IActionResult> GetProfile(string email)
        {

            var profileData = await _userService.GetProfile(email);

            return Ok(new { success = true, data = profileData });
        }
        #endregion
    }
}
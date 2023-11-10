using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DevExtreme.AspNet.Data;
using Medico.Api.Constants;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Medico.Application.ViewModels.Patient;
using Medico.Identity.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Medico.Api.Controllers
{
    [Authorize]
    [Route("api/patients")]
    public class PatientController : ApiController
    {
        #region DI
        private readonly IPatientService _patientService;
        private readonly IPatientInsuranceService _patientInsuranceService;
        private readonly IAdmissionService _admissionService;
        private readonly IAppointmentService _appointmentService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IUniqueUsernameService _uniqueUsernameService;
        private readonly IUserService _userService;
        private readonly IUserValidPasswordGenerator _userPasswordGenerator;
        private readonly IPatientUserEmailService _uniquePatientEmailService;
        private readonly FeatureSwitchesSettingsVm _featureSwitchesSettings;
        private readonly IPatientNoteService _patientNoteService;
        private readonly INotificationService _notificationService;

        public PatientController(IPatientService patientService,
            IPatientInsuranceService patientInsuranceService,
            IPatientNoteService patientNoteService,
            ICompanySecurityService companySecurityService,
            UserManager<ApplicationUser> userManager,
            IUniqueUsernameService uniqueUsernameService,
            IUserService userService,
            IOptions<FeatureSwitchesSettingsVm> featureSwitchesSettingsOptions,
            IUserValidPasswordGenerator userPasswordGenerator,
            INotificationService notificationService,
            IAdmissionService admissionService,
            IAppointmentService appointmentService,
            IPatientUserEmailService uniquePatientEmailService) : base(companySecurityService)
        {
            _patientService = patientService;
            _patientInsuranceService = patientInsuranceService;
            _userManager = userManager;
            _uniqueUsernameService = uniqueUsernameService;
            _userService = userService;
            _userPasswordGenerator = userPasswordGenerator;
            _uniquePatientEmailService = uniquePatientEmailService;
            _featureSwitchesSettings = featureSwitchesSettingsOptions.Value;
            _patientNoteService = patientNoteService;
            _notificationService = notificationService;
            _admissionService = admissionService;
            _appointmentService = appointmentService;
        }
        #endregion

        #region Patient
        [HttpPost]
        [Authorize(Roles = "SuperAdmin")]
        [Route("security-hashes")]
        public async Task<IActionResult> CreateSecurityHashesIfNeeded()
        {
            var notRegisteredPatients = await _patientService
                .GetNotRegisteredAsync();

            if (!notRegisteredPatients.Any())
                return Ok();

            foreach (var patient in notRegisteredPatients)
            {
                var patientUserPassword = _userPasswordGenerator.Generate();
                patient.Password = patientUserPassword;

                var updatedPatient =
                    await _patientService.Update(patient);

                await RegisterPatientAsync(updatedPatient, patientUserPassword);
            }

            return Ok();
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] PatientVm patientViewModel)
        {
            if (!ModelState.IsValid)
                return BadRequest();

            var companyId = patientViewModel.CompanyId;

            if (!await CompanySecurityService.DoesUserHaveAccessToCompany(companyId))
                return Unauthorized();

            var isNewPatient = patientViewModel.Id == Guid.Empty;

            if (!isNewPatient)
                return Ok(await _patientService.Update(patientViewModel));

            var isPatientPortalEnabled = _featureSwitchesSettings.IsPatientPortalEnabled;

            if (!isPatientPortalEnabled)
                return Ok(await _patientService.Create(patientViewModel));

            var patientUserPassword = _userPasswordGenerator.Generate();

            patientViewModel.Password = patientUserPassword;

            var savedPatient =
                await _patientService.Create(patientViewModel);

            await RegisterPatientAsync(savedPatient, patientUserPassword);

            return Ok(savedPatient);
        }

        [HttpPatch]
        public async Task<IActionResult> Patch([FromBody] JsonPatchDocument<PatientPatchVm> patientPatchVm)
        {
            var patientNotesPatch = new PatientPatchVm();
            patientPatchVm.ApplyTo(patientNotesPatch);

            // 1. Update Notes
            await _patientService.UpdatePatientNotes(patientNotesPatch);

            // 2. Save Notes History
            var notes = await _patientNoteService.Create(patientNotesPatch);
            return Ok(notes);
        }

        [HttpGet]
        public async Task<IActionResult> Get(PatientFilterVm patientSearchFilter)
        {
            return Ok(await _patientService.GetByFilter(patientSearchFilter));
        }

        [HttpGet]
        [Route("{id}")]
        public async Task<IActionResult> Get(Guid id)
        {
            var patient = await _patientService.GetById(id);
            if (patient == null)
                return NotFound();

            DateTime accessedAt = DateTime.Now;
            patient.AccessedAt = accessedAt;

            await _patientService.UpdatePatientAccessedAt(patient.Id, accessedAt);

            var insurance = await _patientInsuranceService.GetByPatientId(patient.Id);
            if (insurance != null)
            {
                patient.Rqid = insurance.Rqid;
                patient.CaseNumber = insurance.CaseNumber;
                patient.Mrn = insurance.MRN;
                //patient.Fin = insurance.FIN;
            }

            var appointments = await _appointmentService.GetByPatientAndCompanyId(patient.Id, patient.CompanyId);
            if (appointments != null)
            {
                var first = appointments.OrderBy(c => c.Date).FirstOrDefault();
                if (first != null)
                {
                    patient.AdmissionDate = first.Date;
                }
            }
            //var admission = await _admissionService.GetByAppointmentId(Guid.Parse("91e91f10-bedb-eb11-a7ad-dc98403cdfe8"));
            //if (admission != null)
            //{

            //}

            return Ok(patient);
        }

        [HttpDelete]
        [Route("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var patientToDelete = await _patientService.GetById(id);
            if (patientToDelete == null)
                throw new NullReferenceException();

            await _patientService.Delete(id);

            var isPatientPortalEnabled =
                _featureSwitchesSettings.IsPatientPortalEnabled;

            if (!isPatientPortalEnabled)
                return Ok();

            //delete patient user from portal
            var patientUserEmail =
                _uniquePatientEmailService.GeneratePatientUserEmailBasedOnPatientId(id);

            var patientUserNormalizedName = _uniqueUsernameService
                .Get(patientUserEmail, patientToDelete.CompanyId);

            var patientUser = await _userManager.FindByNameAsync(patientUserNormalizedName);
            if (patientUser != null)
                await _userManager.DeleteAsync(patientUser);

            var patientApplicationUser =
                await _userService.GetByEmail(patientUserEmail);

            await _userService.Delete(patientApplicationUser.Id);

            return Ok();
        }

        [HttpGet]
        [Route("dx/grid")]
        public object DxGridData(PatientDxOptionsViewModel loadOptions)
        {
            IQueryable<PatientProjectionViewModel> query;

            var companyId = loadOptions.CompanyId;
            if (companyId == Guid.Empty)
                query = Enumerable.Empty<PatientProjectionViewModel>()
                    .AsQueryable();
            else
            {
                loadOptions.PrimaryKey = new[] { "Id" };
                loadOptions.PaginateViaPrimaryKey = true;

                if(loadOptions.Sort == null)
                {
                    loadOptions.Sort = new[] { new SortingInfo { Selector = "accessedAt", Desc = true } };
                }
                else
                {
                    loadOptions.Sort.Append(new SortingInfo { Selector = "accessedAt", Desc = true });
                }
                
                query = _patientService.GetPatientsByKeyword(loadOptions)
                    .Where(c => c.CompanyId == companyId);
            }

            //provide ability of case-insensitive search
            //consider to use this configuration value globally
            loadOptions.StringToLower = true;
            return DataSourceLoader.Load(query, loadOptions);
        }

        [HttpGet]
        [Route("dx/lookup")]
        public object DxLookupData(DateRangeDxOptionsViewModel loadOptions)
        {
            loadOptions.PrimaryKey = new[] { "Id" };
            loadOptions.PaginateViaPrimaryKey = true;

            var query = _patientService.Lookup(loadOptions);

            var takeItemsCount = loadOptions.Take;
            loadOptions.Take = takeItemsCount != 0
                ? takeItemsCount
                : AppConstants.SearchConfiguration.LookupItemsCount;

            return DataSourceLoader.Load(query, loadOptions);
        }
        #endregion

        #region Patient Notes
        [HttpPost]
        [Route("notes")]
        public async Task<IActionResult> PostNotes([FromBody] PatientPatchVm patientPatchVm)
        {
            patientPatchVm.CreatedBy = CurrentUserId;
            var notes = await _patientNoteService.Create(patientPatchVm);

            if (notes.Count() > 0)
            {
                // Send notification to current user id
                //var newArray = new string[patientPatchVm.UserIds.Length + 1];
                //newArray[0] = CurrentUserId;
                //Array.Copy(patientPatchVm.UserIds, 0, newArray, 1, patientPatchVm.UserIds.Length);

                //patientPatchVm.UserIds = newArray;
                if (patientPatchVm.UserIds != null)
                {
                    await SaveNotification(patientPatchVm);
                }
            }
            return Ok(notes);
        }

        [NonAction]
        private async Task SaveNotification(PatientPatchVm patientPatchVm)
        {
            NotificationViewModel notificationDto = new NotificationViewModel();

            string notes = string.IsNullOrEmpty(patientPatchVm.Notes) ? "" :
(patientPatchVm.Notes.Length > 200 ? patientPatchVm.Notes.Substring(0, 200) : patientPatchVm.Notes);

            var reminderDate = patientPatchVm.ReminderDate.HasValue ? patientPatchVm.ReminderDate.Value.AddHours(-7).ToString() : null;

            notificationDto.Title = "Patient note added";
            notificationDto.Description = $"<b>{patientPatchVm.Subject}</b>" +
                $"<br><span>{notes}</span>";
            notificationDto.Link = patientPatchVm.Link;
            notificationDto.CreatedBy = CurrentUserId;
            notificationDto.ModifiedBy = CurrentUserId;
            notificationDto.CreatedOn = DateTime.UtcNow;
            notificationDto.NotificationTypeId = 2;
            notificationDto.MessageTypeId = "Message";
            notificationDto.EntityStatus = patientPatchVm.Status;
            notificationDto.ReminderDate = Convert.ToDateTime(reminderDate);

            int notifyId = await _notificationService.Create(notificationDto);
            if (notifyId != 0)
            {
                patientPatchVm.UserIds.Add(CurrentUserId);

                // Map Parent Notification to Replied User
                int notifyAddedId = await _notificationService.MapParentNotification(notifyId, patientPatchVm.UserIds);
            }
        }

        [HttpPut]
        [Route("notes/{id}")]
        public async Task<IActionResult> EditNotes(string id, [FromBody] PatientPatchVm patientPatchVm)
        {
            var notes = await _patientNoteService.EditNotes(id, patientPatchVm);
            return Ok(notes);
        }

        [HttpGet]
        [Route("patient-notes")]
        //patientId=${id}&fromDate=${fromDate}&toDate=${toDate}&subject=${subject}&status=${status}&employee=${employee}
        public async Task<IActionResult> GetNotes(string patientId, string fromDate, string toDate, string subject, string status, string employee)
        {
            var result = await _patientNoteService.GetNotes(patientId,
                fromDate ?? string.Empty,
                toDate ?? string.Empty,
                subject ?? string.Empty,
                status ?? string.Empty,
                employee ?? string.Empty);

            return Ok(result);
        }

        [HttpGet]
        [Route("notesById/{id}")]
        public async Task<IActionResult> GetNotesById(Guid id)
        {
            return Ok(await _patientNoteService.GetNotesById(id));
        }

        [HttpDelete]
        [Route("patient-notes-delete/{id}")]
        public async Task<IActionResult> DeleteNote(string id)
        {
            return Ok(await _patientNoteService.DeleteNote(id));
        }
        #endregion

        #region Non Action
        private async Task RegisterPatientAsync(PatientVm patient, string password)
        {
            var patientUserEmail =
                _uniquePatientEmailService.GeneratePatientUserEmailBasedOnPatientId(patient.Id);

            await _userService.Create(new MedicoApplicationUserViewModel
            {
                Role = "Patient",
                RoleName = "Patient",
                FirstName = patient.FirstName,
                MiddleName = patient.MiddleName,
                LastName = patient.LastName,
                Email = patientUserEmail,
                Address = patient.PrimaryAddress,
                SecondaryAddress = patient.SecondaryAddress,
                City = patient.City,
                State = patient.State,
                Zip = patient.Zip,
                ZipCodeType = patient.ZipCodeType,
                PrimaryPhone = patient.PrimaryPhone,
                SecondaryPhone = patient.SecondaryPhone,
                EmployeeType = 7,
                Ssn = patient.Ssn,
                Gender = patient.Gender,
                DateOfBirth = patient.DateOfBirth,
                CompanyId = patient.CompanyId,
                IsActive = true
            });

            var patientUserName =
                _uniqueUsernameService.Get(patientUserEmail, patient.CompanyId);

            var newUser = new ApplicationUser
            {
                Email = patientUserEmail,
                UserName = patientUserName,
                CompanyId = patient.CompanyId
            };

            var userCreationResult =
                await _userManager.CreateAsync(newUser, password);

            if (!userCreationResult.Succeeded)
                throw new InvalidOperationException(userCreationResult.Errors.ToString());

            var medicoApplicationUser = await _userManager.FindByNameAsync(patientUserName);

            await _userManager.AddToRoleAsync(medicoApplicationUser, "Patient");
        }

        private async Task<IEnumerable<PatientNoteVm>> SaveNotes(PatientPatchVm patientViewModel)
        {
            return await _patientNoteService.Create(patientViewModel);
        }
        #endregion
    }
}
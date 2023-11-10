using DevExtreme.AspNet.Data;
using Medico.Api.Constants;
using Medico.Api.Extensions;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Medico.Domain.Models;
using Medico.Identity.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;

namespace Medico.Api.Controllers
{
    [Authorize]
    [Route("api/appointment")]
    public class AppointmentController : ApiController
    {
        #region DI
        private readonly IAppointmentService _appointmentService;
        private readonly IUserService _userService;
        private readonly IAdmissionService _admissionService;
        private readonly IPatientSecurityService _patientSecurityService;
        private readonly ISendEmailService _sendEmailService;
        INotificationService _notificationService;
        private readonly UserManager<ApplicationUser> _userManager;

        public AppointmentController(IAppointmentService appointmentService,
        IUserService userService,
        ICompanySecurityService companySecurityService,
            IAdmissionService admissionService,
             ISendEmailService sendEmailService,
             INotificationService notificationService,
            IPatientSecurityService patientSecurityService,
            UserManager<ApplicationUser> userManager) : base(companySecurityService)
        {
            _appointmentService = appointmentService;
            _admissionService = admissionService;
            _patientSecurityService = patientSecurityService;
            _sendEmailService = sendEmailService;
            _userService = userService;
            _notificationService = notificationService;
            _userManager = userManager;
        }
        #endregion

        [HttpGet]
        [Route("{id}")]
        public async Task<IActionResult> Get(Guid id)
        {
            var appointment = await _appointmentService.GetById(id);
            if (appointment == null)
                return Ok(null);

            var companyId = appointment.CompanyId;

            if (!await CompanySecurityService.DoesUserHaveAccessToCompany(companyId))
                return Unauthorized();

            return Ok(appointment);
        }

        [HttpGet]
        [Route("admission/{admissionId}")]
        public async Task<IActionResult> GetByAdmissionId(Guid admissionId)
        {
            if (!await CompanySecurityService
                .DoesUserHaveAccessToCompanyAdmission(admissionId))
                return Unauthorized();

            return Ok(await _appointmentService.GetByAdmissionId(admissionId));
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] AppointmentViewModel appointmentViewModel)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest();

                var companyId = appointmentViewModel.CompanyId;

                //if(appointmentViewModel.ProviderIds.Count() > 0)
                //{
                //    appointmentViewModel.PhysicianId = Guid.Parse(appointmentViewModel.ProviderIds[0]);
                //}

                //if (appointmentViewModel.MaIds.Count() > 0)
                //{
                //    appointmentViewModel.NurseId = Guid.Parse(appointmentViewModel.MaIds[0]);
                //}

                if (!await CompanySecurityService.DoesUserHaveAccessToCompany(companyId))
                    return Unauthorized();

                var appointmentId = appointmentViewModel.Id;
                var appointment = await _appointmentService.GetAppointmentGridItemById(appointmentId);

                var isNewAppointmentCreation = appointmentId == Guid.Empty;
                if (!isNewAppointmentCreation)
                {
                    //before appointment updating we should check if admission was already created for this appointment
                    //and set admissionId in appointment

                    var admission = await _admissionService.GetByAppointmentId(appointmentId);
                    if (admission != null)
                    {
                        appointmentViewModel.AdmissionId = admission.Id;
                    }
                }

                // chcek if doc is app is saved from doc parser
                if (appointmentViewModel.StartDate.Equals(appointmentViewModel.EndDate))
                {
                    // appointmentViewModel.Allegations = @"Blind or low vision; Low back pain; Shoulder pain; Knee pain; Hand/wrist pain; PTSD; Depression; Other specified personality disorder; Sleep disoder/insomnia; Memory issues; 99244PM PHYSICAL MEDICINE CONSULTATION WITH REPORT. PLEASE $124.00";
                    appointmentViewModel.StartDate = appointmentViewModel.StartDate.AddHours(7);
                    appointmentViewModel.EndDate = appointmentViewModel.StartDate.AddMinutes(30);

                    StringBuilder allegations = new StringBuilder();
                    if (!string.IsNullOrEmpty(appointmentViewModel.Allegations))
                    {
                        appointmentViewModel.Allegations = appointmentViewModel.Allegations.Replace(";", ",");
                        var index = appointmentViewModel.Allegations.LastIndexOf(',');
                        if (index > 0)
                        {
                            appointmentViewModel.Allegations = appointmentViewModel.Allegations.Substring(0, index);
                        }

                        var words = appointmentViewModel.Allegations.Split(",");
                        foreach (var word in words)
                        {
                            allegations.Append(word.CapitalizeFirst()).Append(",");
                        }

                        if (allegations.Length == 0)
                        {
                            words = appointmentViewModel.Allegations.Split(" ");
                            foreach (var word in words)
                            {
                                allegations.Append(word.CapitalizeFirst()).Append(",");
                            }
                        }
                        appointmentViewModel.Allegations = Convert.ToString(allegations);
                    }
                }

                var createUpdateTask = isNewAppointmentCreation
                    ? _appointmentService.Create(appointmentViewModel)
                    : _appointmentService.Update(appointmentViewModel);

                await createUpdateTask;

                if (!isNewAppointmentCreation && (appointmentViewModel.AppointmentStatus != appointment.AppointmentStatus))
                {
                    await SaveNotification(appointmentViewModel, appointment);
                }

                return Ok();
            }
            catch (Exception ex)
            {

                throw ex;
            }
        }

        [HttpPost]
        [Route("savesimple")]
        public async Task<IActionResult> SaveSimple([FromBody] AppointmentViewModel appointmentViewModel)
        {
            if(appointmentViewModel.Id != Guid.Empty)
            {                
                await _appointmentService.Update(appointmentViewModel);
            }
                
            return Ok();
        }

        [NonAction]
        private async Task SaveNotification(AppointmentViewModel appointmentViewModel, AppointmentGridItemViewModel appointmentGridViewModel)
        {
            NotificationViewModel notificationDto = new NotificationViewModel
            {
                Title = "Appointment Status Changed",
                Description = $"<b>{appointmentGridViewModel.PatientFirstName} {appointmentGridViewModel.PatientLastName}</b>" +
                $"<br><span>The status of appoinment dated {appointmentViewModel.StartDate.ToString("MM/dd/yyyy")} has been changed from <b>{ appointmentGridViewModel.AppointmentStatus }</b> to</span> <b>{ appointmentViewModel.AppointmentStatus }</b>",
                Link = $"/patient-chart/{appointmentViewModel.Id}",
                CreatedBy = CurrentUserId,
                ModifiedBy = CurrentUserId,
                CreatedOn = DateTime.UtcNow,
                NotificationTypeId = 3,
                MessageTypeId = "Message",
                EntityStatus = appointmentViewModel.AppointmentStatus
            };

            int notifyId = await _notificationService.Create(notificationDto);
            if (notifyId != 0)
            {
                try
                {
                    List<string> newArray = new List<string>
                    {
                        CurrentUserId,
                        // appointmentViewModel.PhysicianId.ToString(),
                        appointmentViewModel.NurseId.ToString(),
                        appointmentViewModel.PatientId.ToString()
                    };

                    // Get Physicain's USER ID
                    var user = await _userService.GetById(appointmentViewModel.PhysicianId);
                    if (user != null)
                    {
                        var aspNetUser = await _userManager.FindByEmailAsync(user.Email);
                        if (aspNetUser != null)
                        {
                            newArray.Add(aspNetUser.Id);
                        }
                    }

                    NotificationReadViewModel notificationReadViewModel = new NotificationReadViewModel
                    {
                        IsRead = false,
                        UserIds = newArray
                    };
                    //_ = await _notificationService.AddNotifyRead(notificationReadViewModel, notifyId);

                    // Map Parent Notification to Replied User
                    int notifyAddedId = await _notificationService.MapParentNotification(notifyId, newArray);
                }
                catch (Exception ex)
                {

                }
            }
        }

        [HttpGet]
        [Route("last/patient/{patientId}/date/{currentDate}")]
        public async Task<IActionResult> GetPatientLastVisit(Guid patientId, DateTime currentDate)
        {
            if (!await CompanySecurityService.DoesUserHaveAccessToCompanyPatient(patientId))
                return Unauthorized();

            return Ok(await _appointmentService.GetPatientLastVisit(patientId, currentDate));
        }

        [HttpGet]
        [Route("previous/{patientId}/date/{currentDate}")]
        public async Task<IActionResult> GetPatientPreviousVisits(Guid patientId, DateTime currentDate)
        {
            if (!await CompanySecurityService.DoesUserHaveAccessToCompanyPatient(patientId))
                return Unauthorized();

            var previous = await _appointmentService.GetPatientPreviousVisits(patientId, currentDate);

            foreach (var apppointment in previous)
            {
                if (apppointment.AdmissionId.HasValue)
                {
                    apppointment.AppointmentPatientChartDocuments = await GetAppointmentPatientChartDocument(apppointment.AdmissionId.ToString());
                }
            }

            return Ok(previous);
        }

        [HttpGet]
        [Route("previous/{patientId}/twodates/{startDate}/{endDate}/{quantity}")]
        public async Task<IActionResult> GetPatientPreviousVisitsBetweenDates(Guid patientId, DateTime startDate, DateTime endDate, int quantity)
        {
            if (!await CompanySecurityService.DoesUserHaveAccessToCompanyPatient(patientId))
                return Unauthorized();

            var previous = await _appointmentService.GetPatientPreviousVisitsBetweenDates(patientId, startDate, endDate, quantity);

            foreach (var apppointment in previous)
            {
                if (apppointment.AdmissionId.HasValue)
                {
                    apppointment.AppointmentPatientChartDocuments = await GetAppointmentPatientChartDocument(apppointment.AdmissionId.ToString());
                }
            }

            return Ok(previous);
        }

        private async Task<IEnumerable<AppointmentPatientChartDocumentModel>> GetAppointmentPatientChartDocument(string admissionId)
        {
            var chart = await _appointmentService.GetAppointmentPatientChartDocument(admissionId);
            return chart;
        }

        [HttpDelete]
        [Route("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var appointment = await _appointmentService.GetById(id);
            if (appointment == null)
                return Ok();

            var companyId = appointment.CompanyId;
            if (!await CompanySecurityService.DoesUserHaveAccessToCompany(companyId))
                return Unauthorized();

            var admission = await _admissionService.GetByAppointmentId(appointment.Id);
            if (admission != null)
                await _admissionService.Delete(admission.Id);

            await _appointmentService.Delete(id);
            return Ok();
        }

        [HttpGet]
        [Authorize(Roles = AppConstants.BuildInRoleNames.Patient)]
        [Route("patient/{patientId}/company/{companyId}")]
        public async Task<IActionResult> GetPatientAppointments(Guid patientId, Guid companyId)
        {
            if (!await CompanySecurityService.DoesUserHaveAccessToCompany(companyId))
                return Unauthorized();

            if (!await _patientSecurityService.DoesPatientUserRequestHisOwnInfo(patientId))
                return Unauthorized();

            var patientAppointments =
                await _appointmentService.GetByPatientAndCompanyId(patientId, companyId);

            return Ok(patientAppointments);
        }

        [HttpGet]
        [Route("griditem/dx/grid")]
        public object GridItems(AppointmentDxOptionsViewModel loadOptions)
        {
            loadOptions.PrimaryKey = new[] { "Id" };
            loadOptions.PaginateViaPrimaryKey = true;

            var query = _appointmentService
                .GetAllAppointmentGridItems(loadOptions);

            return DataSourceLoader.Load(query, loadOptions);
        }

        [HttpGet]
        [Route("griditem/{gridItemId}")]
        public async Task<IActionResult> GetAppointmentGridItemById(Guid gridItemId)
        {
            var appointmentGridItem =
                await _appointmentService.GetAppointmentGridItemById(gridItemId);

            var users = _userService.GetAll().Where(c => c.Id == appointmentGridItem.PhysicianId).ToList();
            appointmentGridItem.PatientNameSuffix = users.FirstOrDefault().NameSuffix;

            var companyId = appointmentGridItem.CompanyId;
            if (!await CompanySecurityService.DoesUserHaveAccessToCompany(companyId))
                return Unauthorized();

            return Ok(appointmentGridItem);
        }

        [HttpGet]
        [Route("location/{locationId}")]
        public async Task<IActionResult> GetByLocationId(Guid locationId)
        {
            if (!await CompanySecurityService
                .DoesUserHaveAccessToCompanyLocation(locationId))
                return Unauthorized();

            return Ok(await _appointmentService.GetByLocationId(locationId));
        }

        [HttpGet]
        [Route("room/{roomId}")]
        public async Task<IActionResult> GetByRoomId(Guid roomId)
        {
            if (!await CompanySecurityService
                .DoesUserHaveAccessToCompanyRoom(roomId))
                return Unauthorized();

            return Ok(await _appointmentService.GetByRoomId(roomId));
        }

        [HttpGet]
        [Route("user/{userId}")]
        public async Task<IActionResult> GetByUserId(Guid userId)
        {
            if (!await CompanySecurityService
                .DoesUserHaveAccessToCompanyEmployee(userId))
                return Unauthorized();

            return Ok(await _appointmentService.GetByUserId(userId));
        }

        [HttpGet]
        [Route("dx/grid")]
        public object DxGridData(AppointmentDxOptionsViewModel loadOptions)
        {
            loadOptions.PrimaryKey = new[] { "Id" };
            loadOptions.PaginateViaPrimaryKey = true;

            var query = _appointmentService
                .GetAll(loadOptions);

            return DataSourceLoader.Load(query, loadOptions);
        }

        [HttpPut]
        [Route("status")]
        public async Task<IActionResult> PutStatus([FromBody] AppointmentStatusVM appointmentStatus, string email)
        {
            appointmentStatus.CreatedBy = CurrentUserId;
            var result = await _appointmentService.PutStatus(appointmentStatus);

            if (appointmentStatus.SendEmail)
                await this.SendEmail(email, appointmentStatus.EmailContent);

            return Ok(result);
        }

        [HttpGet]
        [Route("status/timeline/{appointmentId}/{startDate}/{endDate}")]
        public async Task<IActionResult> GetStatusTimeline(Guid appointmentId, string startDate, string endDate)
        {
            var apppointmentHistory = await _appointmentService.GetAppointmentStatus(appointmentId);
            var appointment = await _appointmentService.GetById(appointmentId);
            var aspNetUsers = await _userManager.Users.ToListAsync();
            var users = _userService.GetAll().Where(c => c.RoleName != "Patient");
            TimeSpan timeSpan = new TimeSpan();
            if (apppointmentHistory.Count() > 0)
            {
                timeSpan = apppointmentHistory.FirstOrDefault().CreatedOn
                    .Subtract(appointment.StartDate);
            }
            Console.WriteLine(startDate);
            Console.WriteLine(endDate);
            DateTime startDateTime, endDateTime;
            if (!DateTime.TryParse(startDate, out startDateTime) || !DateTime.TryParse(endDate, out endDateTime))
            {
                return BadRequest("Invalid date format. Please provide dates in a valid format.");
            }
            var data = from vs in apppointmentHistory
                        join a in aspNetUsers on vs.CreatedBy equals a.Id
                        join u in users on a.Email equals u.Email into gj
                        from subpet in gj.DefaultIfEmpty()
                        where vs.CreatedOn >= startDateTime  && vs.CreatedOn <= endDateTime
                        select new AppointmentStatusSearch
                        {
                            CreatedOn = vs.CreatedOn,
                            CreatedBy = vs.CreatedBy,
                            CreatedByName = subpet == null ? "SuperAdmin" : $"{subpet.NamePrefix} {subpet.FirstName} {subpet.LastName}",
                            Notes = vs.Notes,
                            Status = vs.Status,
                            TimeElapsed = $"{timeSpan.Days}d {timeSpan.Hours}h  {timeSpan.Minutes}m"
                        };
            return Ok(new { success = true, data = data });
        }

        [HttpGet]
        [Route("status/report/{companyId}")]
        public async Task<IActionResult> GetAppointmentStatusByCompany(Guid companyId)
        {
            var result = await _appointmentService.GetAppointmentStatusByCompany(companyId);

            return Ok(new { success = true, data = result });
        }

        private async Task SendEmail(string to, string body)
        {
            try
            {
                EmailAccountViewModel emailAccount = await _sendEmailService.GetEmailAccount();
                var emailModel = new EmailViewModel
                {
                    FromName = emailAccount.FromName,
                    To = to,
                    BccList = emailAccount.Bcc,
                    Subject = string.Format("Discharge Instructions"),
                    Body = body
                };
                await _sendEmailService.Execute(emailModel, emailAccount);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        [HttpGet]
        [Route("Get-Piechart")]
        public async Task<IActionResult> GetAppointmentStatusPieChart()
        {
            IEnumerable<AppointmentStatusPieChart> data = await _appointmentService.GetAppointmentStatusPieChart();

            return Ok(new
            {
                Data = data,
                success = true,
                Message = "done"
            });
        }

        [HttpGet]
        [Route("providers/{appointmentId}")]
        public async Task<IActionResult> GetAppointmentProviders(Guid appointmentId)
        {
            var appointment = await _appointmentService.GetById(appointmentId);
            if (appointment == null)
                return Ok(null);

            IQueryable<MedicoApplicationUserViewModel> appointmentProviders =_userService.GetByIds(appointment.ProviderIds.Select(d => Guid.Parse(d)).ToList());

            return Ok(new { data = appointmentProviders.Select(d => new { id = d.Id, name = (d.FirstName != null ? d.FirstName : "") + ' ' + (d.MiddleName != null ? d.MiddleName : "") + ' ' + (d.LastName != null ? d.LastName : "")}).ToArray() });
        }
    }
}
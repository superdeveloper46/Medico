using System;
using System.Threading.Tasks;
using Medico.Application.Interfaces;
using Medico.Application.Report;
using Medico.Application.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Medico.Api.Controllers
{
    [Authorize]
    [Route("api/report")]
    public class ReportController : ApiController
    {
        private readonly IReportService _reportService;
        private readonly IPatientSecurityService _patientSecurityService;
        private readonly IPatientChartReportBuilder _patientChartReportBuilder;
        private readonly IAppointmentService _appointmentService;

        public ReportController(IReportService reportService,
            ICompanySecurityService companySecurityService,
            IPatientSecurityService patientSecurityService,
            IPatientChartReportBuilder patientChartReportBuilder,
            IAppointmentService appointmentService) : base(companySecurityService)
        {
            _reportService = reportService;
            _patientSecurityService = patientSecurityService;
            _patientChartReportBuilder = patientChartReportBuilder;
            _appointmentService = appointmentService;
        }

        [Route("appointment/{appointmentId}/offset/{utcOffset}/view")]
        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetPatientChartReportView(Guid appointmentId, int utcOffset)
        {
            var appointment = await _appointmentService.GetById(appointmentId);

            var companyId = appointment.CompanyId;
            if (!await CompanySecurityService.DoesUserHaveAccessToCompany(companyId))
                return Forbid();

            if (appointment.AdmissionId == null)
                return Ok(new ReportViewModel {ReportContent = "No content"});

            var appointmentReportContent =
                await _patientChartReportBuilder.BuildReportBasedOnPatientChart(appointment.AdmissionId.Value,
                    companyId, appointment.PatientId, utcOffset);

            return Ok(new ReportViewModel {ReportContent = appointmentReportContent});
        }

        [Route("appointment/{appointmentId}/offset/{utcOffset}/pdf")]
        [Authorize(Roles = Constants.AppConstants.BuildInRoleNames.Patient)]
        [HttpGet]
        public async Task<IActionResult> GetPatientChartPdfReportView(Guid appointmentId, int utcOffset)
        {
            var appointment = await _appointmentService.GetById(appointmentId);

            var patientId = appointment.PatientId;
            if (!await _patientSecurityService.DoesPatientUserRequestHisOwnInfo(patientId))
                return Forbid();

            var companyId = appointment.CompanyId;
            if (!await CompanySecurityService.DoesUserHaveAccessToCompany(companyId))
                return Forbid();

            if (appointment.AdmissionId == null)
                return BadRequest();

            var appointmentReportContent =
                await _patientChartReportBuilder.BuildReportBasedOnPatientChart(appointment.AdmissionId.Value,
                    companyId, patientId, utcOffset);

            var appointmentPdfReport = _reportService
                .SelectPdfPostWithWebClient(appointmentReportContent);

            FileResult fileResult = new FileContentResult(appointmentPdfReport, "application/pdf")
            {
                FileDownloadName = "report.pdf"
            };

            return fileResult;
        }

        [Authorize(Roles = "SuperAdmin,Physician")]
        [HttpPost]
        public FileResult PdfReport([FromBody] ReportViewModel reportViewModel)
        {
            string userId = CurrentUserId;
            string userName = CurrentUserName;

            reportViewModel.ReportContent = $"{reportViewModel.ReportContent}<br><small>Created By: {userName}</small><br>";

            var report = _reportService
                .SelectPdfPostWithWebClient(reportViewModel.ReportContent);

            FileResult fileResult = new FileContentResult(report, "application/pdf")
            {
                FileDownloadName = "report.pdf"
            };

            return fileResult;
        }
    }
}
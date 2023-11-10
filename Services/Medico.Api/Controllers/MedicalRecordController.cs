using System;
using System.Threading.Tasks;
using DevExtreme.AspNet.Data;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Medico.Api.Controllers
{
    [Authorize]
    [Route("api/medicalrecord")]
    public class MedicalRecordController : ApiController
    {
        private readonly IMedicalRecordService _medicalRecordService;

        public MedicalRecordController(IMedicalRecordService medicalRecordService,
            ICompanySecurityService companySecurityService) : base(companySecurityService)
        {
            _medicalRecordService = medicalRecordService;
        }

        [HttpGet]
        [Route("patient/{patientId}")]
        public async Task<IActionResult> GetPatientMedicalRecords(Guid patientId)
        {
            if (!await CompanySecurityService.DoesUserHaveAccessToCompanyPatient(patientId))
                return Unauthorized();

            return Ok(await _medicalRecordService.GetAllByPatientId(patientId));
        }

        [HttpGet]
        [Route("{id}")]
        public async Task<IActionResult> Get(Guid id)
        {
            var medicalRecord = await _medicalRecordService.GetById(id);
            if (medicalRecord == null)
                return Ok();

            var patientId = medicalRecord.PatientId;
            if (!await CompanySecurityService.DoesUserHaveAccessToCompanyPatient(patientId))
                return Unauthorized();

            return Ok(medicalRecord);
        }

        [HttpGet]
        [Route("historyexistence/patient/{patientId}")]
        public async Task<IActionResult> GetLastPatientMedicalRecord(Guid patientId)
        {
            if (!await CompanySecurityService.DoesUserHaveAccessToCompanyPatient(patientId))
                return Unauthorized();

            return Ok(await _medicalRecordService.IsHistoryExist(patientId));
        }

        [HttpPost, DisableRequestSizeLimit]
        public async Task<IActionResult> Post(List<IFormFile> files, [FromBody] MedicalRecordViewModel medicalRecordViewModel)
        {
            if (!ModelState.IsValid)
                return BadRequest();

            var patientId = medicalRecordViewModel.PatientId;
            if (!await CompanySecurityService.DoesUserHaveAccessToCompanyPatient(patientId))
                return Unauthorized();

            if(files.Count > 0)
            {
                await _medicalRecordService.CreateWithDocs(files, medicalRecordViewModel);
            }

            var createUpdateTask = medicalRecordViewModel.Id == Guid.Empty
                ? _medicalRecordService.Create(medicalRecordViewModel)
                : _medicalRecordService.Update(medicalRecordViewModel);

            medicalRecordViewModel = await createUpdateTask;

            Console.WriteLine("\nNotes:\n");
            Console.WriteLine(medicalRecordViewModel.Notes);
            Console.WriteLine("\nEnd\n");

            Console.WriteLine("\nID:\n");
            Console.WriteLine(medicalRecordViewModel.Id);
            Console.WriteLine("\nEnd\n");

            return Ok(medicalRecordViewModel);
        }

        [HttpGet]
        [Route("dx/grid")]
        public object DxGridData(HistoryDxOptionsViewModel historyDxOptionsViewModel)
        {
            historyDxOptionsViewModel.PrimaryKey = new[] { "Id" };
            historyDxOptionsViewModel.PaginateViaPrimaryKey = true;

            return DataSourceLoader.Load(_medicalRecordService.GetAll(historyDxOptionsViewModel),
                historyDxOptionsViewModel);
        }

        [HttpDelete]
        [Route("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var medicalRecord = await _medicalRecordService.GetById(id);
            if (medicalRecord == null)
                return Ok();

            var patientId = medicalRecord.PatientId;
            if (!await CompanySecurityService.DoesUserHaveAccessToCompanyPatient(patientId))
                return Unauthorized();

            await _medicalRecordService.Delete(id);
            return Ok();
        }
    }
}
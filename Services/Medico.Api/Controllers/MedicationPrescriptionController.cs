using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using DevExtreme.AspNet.Data;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Medico.Api.Controllers
{
    [Authorize]
    [Route("api/prescription")]
    public class MedicationPrescriptionController : ApiController
    {
        private readonly IMedicationPrescriptionService _medicationPrescriptionService;
        private readonly IMedicationHistoryService _medicationHistoryService;

        public MedicationPrescriptionController(IMedicationPrescriptionService medicationPrescriptionService,
            IMedicationHistoryService medicationHistoryService,
            ICompanySecurityService companySecurityService) : base(companySecurityService)
        {
            _medicationPrescriptionService = medicationPrescriptionService;
            _medicationHistoryService = medicationHistoryService;
        }

        [HttpGet]
        [Route("{id}")]
        public async Task<IActionResult> Get(Guid id)
        {
            var medicationPrescription = await _medicationPrescriptionService.GetById(id);
            if (medicationPrescription == null)
                return Ok();

            var patientId = medicationPrescription.PatientId;
            if (!await CompanySecurityService.DoesUserHaveAccessToCompanyPatient(patientId))
                return Unauthorized();

            return Ok(medicationPrescription);
        }

        [HttpGet]
        [Route("admission/{admissionId}")]
        public async Task<IActionResult> GetByAdmissionId(Guid admissionId)
        {
            if (!await CompanySecurityService.DoesUserHaveAccessToCompanyAdmission(admissionId))
                return Unauthorized();

            return Ok(await _medicationPrescriptionService.GetByAdmissionId(admissionId));
        }

        [HttpGet]
        [Route("existence/admission/{admissionId}")]
        public async Task<ActionResult> CheckMedicationPrescriptionExistence(Guid admissionId)
        {
            if (!await CompanySecurityService.DoesUserHaveAccessToCompanyAdmission(admissionId))
                return Unauthorized();

            return Ok(await _medicationPrescriptionService.IsPrescriptionExist(admissionId));
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody]MedicationPrescriptionViewModel medicationPrescriptionViewModel)
        {
            if (!ModelState.IsValid)
                return BadRequest();

            var patientId = medicationPrescriptionViewModel.PatientId;
            if (!await CompanySecurityService.DoesUserHaveAccessToCompanyPatient(patientId))
                return Unauthorized();

            var isNewPrescription = medicationPrescriptionViewModel.Id == Guid.Empty;

            var createUpdateTask = isNewPrescription
                ? _medicationPrescriptionService.Create(medicationPrescriptionViewModel)
                : _medicationPrescriptionService.Update(medicationPrescriptionViewModel);

            await createUpdateTask;

            if (isNewPrescription)
                await _medicationHistoryService.Create(medicationPrescriptionViewModel);

            return Ok();
        }

        [HttpGet]
        [Route("dx/grid")]
        public object DxGridData(PatientAdmissionDxOptionsViewModel patientAdmissionDxOptions)
        {
            patientAdmissionDxOptions.PrimaryKey = new[] { "Id" };
            patientAdmissionDxOptions.PaginateViaPrimaryKey = true;

            return DataSourceLoader.Load(_medicationPrescriptionService.GetAll(patientAdmissionDxOptions).Result,
                patientAdmissionDxOptions);
        }

        [HttpDelete]
        [Route("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var medicationPrescription = await _medicationPrescriptionService.GetById(id);
            if (medicationPrescription == null)
                return Ok();

            var patientId = medicationPrescription.PatientId;
            if (!await CompanySecurityService.DoesUserHaveAccessToCompanyPatient(patientId))
                return Unauthorized();

            await _medicationPrescriptionService.DeleteById(id);
            return Ok();
        }
    }
}
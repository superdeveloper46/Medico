using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Medico.Application.ViewModels;
using Microsoft.AspNetCore.Http;

namespace Medico.Application.Interfaces
{
    public interface IMedicalRecordService
    {
        Task<IEnumerable<MedicalRecordViewModel>> GetByPatientId(Guid patientId);

        Task<MedicalRecordViewModel> GetById(Guid id);

        Task<bool> IsHistoryExist(Guid patientId);

        Task<MedicalRecordViewModel> CreateWithDocs(List<IFormFile> files, MedicalRecordViewModel medicalRecordViewModel);
        Task<MedicalRecordViewModel> Create(MedicalRecordViewModel medicalRecordViewModel);

        Task<MedicalRecordViewModel> Update(MedicalRecordViewModel medicalRecordViewModel);

        Task Delete(Guid id);

        IQueryable<MedicalRecordViewModel> GetAll(HistoryDxOptionsViewModel historyDxOptionsViewModel);

        Task<IEnumerable<MedicalRecordViewModel>> GetAllByPatientId(Guid patientId);
    }
}
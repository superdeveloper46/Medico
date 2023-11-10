using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Medico.Domain.Interfaces;
using Medico.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Medico.Application.Services
{
    public class MedicationHistoryService : BaseDeletableByIdService<MedicationHistory, MedicationHistoryViewModel>,
        IMedicationHistoryService
    {
        private readonly IMapper _mapper;
        private readonly IUserService _userService;

        public MedicationHistoryService(IMedicationHistoryRepository repository, IMapper mapper, IUserService userService)
            : base(repository, mapper)
        {
            _mapper = mapper;
            _userService = userService;
        }

        public async Task<IEnumerable<MedicationHistoryViewModel>> GetByPatientId(Guid patientId)
        {
            var medicationHistory = await Repository.GetAll()
                .Where(h => h.PatientId == patientId)
                .ProjectTo<MedicationHistoryViewModel>(_mapper.ConfigurationProvider)
                .ToListAsync();

            return medicationHistory;
        }

        public async Task<bool> IsHistoryExist(Guid patientId)
        {
            var medicationHistory = await Repository.GetAll()
                .FirstOrDefaultAsync(h => h.PatientId == patientId);

            return medicationHistory != null;
        }

        public Task<MedicationHistoryViewModel> Create(MedicationPrescriptionViewModel medicationPrescriptionViewModel)
        {
            var medicationHistoryViewModel = Mapper.Map<MedicationHistoryViewModel>(medicationPrescriptionViewModel);
            return Create(medicationHistoryViewModel);
        }

        public Task Delete(Guid id)
        {
            return DeleteById(id);
        }

        public async Task<IEnumerable<MedicationHistoryTempViewModel>> GetAll(HistoryDxOptionsViewModel historyDxOptionsViewModel)
        {
            var histories = await Repository.GetAll()
                .Where(th => th.PatientId == historyDxOptionsViewModel.PatientId)
                .ProjectTo<MedicationHistoryViewModel>(_mapper.ConfigurationProvider)
                .ToListAsync();

            var users = _userService.GetAll().Where(c => c.RoleName == "Physician");

            var historyData = from h in histories
                             join u in users on h.Provider equals u.Id into gj
                             from subpet in gj.DefaultIfEmpty()
                             select new MedicationHistoryTempViewModel
                             {
                                 Id = h.Id,
                                 Medication = h.Medication,
                                 PatientId = h.PatientId,
                                 MedicationNameId = h.MedicationNameId,
                                 Dose = h.Dose,
                                 Units = h.Units,
                                 DosageForm = h.DosageForm,
                                 Route = h.Route,
                                 Sig = h.Sig,
                                 Prn = h.Prn,
                                 MedicationStatus = h.MedicationStatus,
                                 Notes = h.Notes,
                                 IncludeNotesInReport = h.IncludeNotesInReport,
                                 Provider = h.Provider,
                                 ProviderName = $"{subpet?.FirstName} {subpet?.LastName}" ?? string.Empty,
                             };

            return historyData;
        }

        public async Task<IEnumerable<MedicationHistoryViewModel>> GetAllByPatientId(Guid patientId)
        {
            var patientMedications = await Repository.GetAll()
                .Where(th => th.PatientId == patientId)
                .ProjectTo<MedicationHistoryViewModel>(_mapper.ConfigurationProvider)
                .ToListAsync();

            return patientMedications;
        }
    }
}
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
    public class MedicationPrescriptionService
        : BaseDeletableByIdService<MedicationPrescription, MedicationPrescriptionViewModel>,
            IMedicationPrescriptionService
    {
        private readonly IMapper _mapper;
        private readonly IUserService _userService;

        public MedicationPrescriptionService(IMedicationPrescriptionRepository repository, IMapper mapper, IUserService userService)
            : base(repository, mapper)
        {
            _mapper = mapper;
            _userService = userService;
        }

        public async Task<bool> IsPrescriptionExist(Guid admissionId)
        {
            var prescription = await Repository.GetAll()
                .FirstOrDefaultAsync(p => p.AdmissionId == admissionId);

            return prescription != null;
        }

        public async Task<IEnumerable<MedicationPrescriptionTempViewModel>> GetAll(PatientAdmissionDxOptionsViewModel patientAdmissionDxOptions)
        {
            var admissionId = patientAdmissionDxOptions.AdmissionId;
            var prescriptions = await Repository.GetAll()
                    .Where(p => p.AdmissionId == admissionId)
                    .ProjectTo<MedicationPrescriptionViewModel>(_mapper.ConfigurationProvider)
                    .ToListAsync();

            var users = _userService.GetAll().Where(c => c.RoleName == "Physician");

            var historyData = from p in prescriptions
                            join u in users on p.Provider equals u.Id into gj
                            from subpet in gj.DefaultIfEmpty()
                            select new MedicationPrescriptionTempViewModel
                            {
                                Id = p.Id,
                                PatientId = p.PatientId,
                                Medication = p.Medication,
                                Dose = p.Dose,
                                DosageForm = p.DosageForm,
                                Route = p.Route,
                                Units = p.Units,
                                StartDate = p.StartDate,
                                EndDate = p.EndDate,
                                Assessment = p.Assessment,
                                Provider = p.Provider,
                                IncludeNotesInReport = p.IncludeNotesInReport,
                                Notes = p.Notes,
                                Prn = p.Prn,
                                Dispense = p.Dispense,
                                Refills = p.Refills,
                                Sig = p.Sig,
                                
                                ProviderName = $"{subpet?.FirstName} {subpet?.LastName}" ?? string.Empty,
                            };

            return historyData;     
        }

        public async Task<IEnumerable<MedicationPrescriptionViewModel>> GetByAdmissionId(Guid admissionId)
        {
            var prescriptions = await Repository.GetAll().Where(mp => mp.AdmissionId == admissionId)
                .ProjectTo<MedicationPrescriptionViewModel>(_mapper.ConfigurationProvider)
                .ToListAsync();

            return prescriptions;
        }
    }
}

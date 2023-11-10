﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Medico.Application.Interfaces;
using Medico.Application.PatientIdentificationCodes.ViewModels;
using Medico.Application.ViewModels;
using Medico.Application.ViewModels.Patient;
using Medico.Data.Repository;
using Medico.Domain.Constants;
using Medico.Domain.Interfaces;
using Medico.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Medico.Application.Services
{
    public class PatientService : BaseDeletableByIdService<Patient, PatientVm>, IPatientService
    {
        private readonly PatientWithVitalSignsVm _expressionExecutionTestPatient =
            new PatientWithVitalSignsVm
            {
                BaseVitalSigns = new BaseVitalSignsViewModel
                {
                    Weight = 150,
                    Height = 70,
                    DominantHand = "Right",
                    RightBicep = 18,
                    LeftBicep = 18,
                    RightCalf = 25,
                    LeftCalf = 25,
                    RightForearm = 20,
                    LeftForearm = 20,
                    RightThigh = 50,
                    LeftThigh = 50
                },
                Patient = new PatientVm
                {
                    FirstName = "Expression Test",
                    LastName = "Patient",
                    DateOfBirth = new DateTime(1986, 10, 23).ToUniversalTime(),
                    Gender = 1
                }
            };

        private readonly IAppointmentGridItemRepository _appointmentGridItemRepository;
        private readonly IDataSourceLoadOptionsHelper _dataSourceLoadOptionsHelper;
        private readonly IPatientInsuranceRepository _patientInsuranceRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IAdmissionRepository _admissionRepository;
        private readonly ITobaccoHistoryRepository _tobaccoHistoryRepository;
        private readonly IDrugHistoryRepository _drugHistoryRepository;
        private readonly IAlcoholHistoryRepository _alcoholHistoryRepository;
        private readonly IMedicalHistoryRepository _medicalHistoryRepository;
        private readonly ISurgicalHistoryRepository _surgicalHistoryRepository;
        private readonly IFamilyHistoryRepository _familyHistoryRepository;
        private readonly IEducationHistoryRepository _educationHistoryRepository;
        private readonly IOccupationalHistoryRepository _occupationalHistoryRepository;
        private readonly IAllergyRepository _allergyRepository;
        private readonly IMedicationHistoryRepository _medicationHistoryRepository;
        private readonly IMedicalRecordRepository _medicalRecordRepository;
        private readonly IBaseVitalSignsRepository _baseVitalSignsRepository;
        private readonly IVitalSignsRepository _vitalSignsRepository;
        private readonly IMedicationPrescriptionRepository _medicationPrescriptionRepository;
        private readonly IVisionVitalSignsRepository _visionVitalSignsRepository;
        private readonly ISignatureInfoRepository _signatureInfoRepository;
        private readonly IPatientIdentificationCodeService _patientIdentificationCodeService;
        private readonly IMapper _mapper;

        public PatientService(IPatientRepository patientRepository,
            IAppointmentGridItemRepository appointmentGridItemRepository,
            IMapper mapper,
            IDataSourceLoadOptionsHelper dataSourceLoadOptionsHelper,
            IPatientInsuranceRepository patientInsuranceRepository,
            IUnitOfWork unitOfWork,
            IAppointmentRepository appointmentRepository,
            IAdmissionRepository admissionRepository,
            ITobaccoHistoryRepository tobaccoHistoryRepository,
            IDrugHistoryRepository drugHistoryRepository,
            IAlcoholHistoryRepository alcoholHistoryRepository,
            IMedicalHistoryRepository medicalHistoryRepository,
            ISurgicalHistoryRepository surgicalHistoryRepository,
            IFamilyHistoryRepository familyHistoryRepository,
            IEducationHistoryRepository educationHistoryRepository,
            IOccupationalHistoryRepository occupationalHistoryRepository,
            IAllergyRepository allergyRepository,
            IMedicationHistoryRepository medicationHistoryRepository,
            IMedicalRecordRepository medicalRecordRepository,
            IBaseVitalSignsRepository baseVitalSignsRepository,
            IVitalSignsRepository vitalSignsRepository,
            IMedicationPrescriptionRepository medicationPrescriptionRepository,
            IVisionVitalSignsRepository visionVitalSignsRepository,
            ISignatureInfoRepository signatureInfoRepository,
            IPatientIdentificationCodeService patientIdentificationCodeService) : base(patientRepository, mapper)
        {
            _appointmentGridItemRepository = appointmentGridItemRepository;
            _dataSourceLoadOptionsHelper = dataSourceLoadOptionsHelper;
            _patientInsuranceRepository = patientInsuranceRepository;
            _unitOfWork = unitOfWork;
            _appointmentRepository = appointmentRepository;
            _admissionRepository = admissionRepository;
            _tobaccoHistoryRepository = tobaccoHistoryRepository;
            _drugHistoryRepository = drugHistoryRepository;
            _alcoholHistoryRepository = alcoholHistoryRepository;
            _medicalHistoryRepository = medicalHistoryRepository;
            _surgicalHistoryRepository = surgicalHistoryRepository;
            _familyHistoryRepository = familyHistoryRepository;
            _educationHistoryRepository = educationHistoryRepository;
            _occupationalHistoryRepository = occupationalHistoryRepository;
            _allergyRepository = allergyRepository;
            _medicationHistoryRepository = medicationHistoryRepository;
            _medicalRecordRepository = medicalRecordRepository;
            _baseVitalSignsRepository = baseVitalSignsRepository;
            _vitalSignsRepository = vitalSignsRepository;
            _medicationPrescriptionRepository = medicationPrescriptionRepository;
            _visionVitalSignsRepository = visionVitalSignsRepository;
            _signatureInfoRepository = signatureInfoRepository;
            _patientIdentificationCodeService = patientIdentificationCodeService;
            _mapper = mapper;
        }

        public override async Task<PatientVm> Create(PatientVm viewModel)
         {
            var filter = new IdentificationCodeSearchFilterVm() { IdentificationCodeType = 1, CompanyId = viewModel.CompanyId };
            var finConfig = await _patientIdentificationCodeService.Get(filter);
            
            if(finConfig == null)
            {
                return await base.Create(viewModel);
            }
            string monthChars = "MM";
            string yearChars = "";
           
            for (int i = 0; i < finConfig.Year.ToString().Length; i++)
            {
                yearChars  = yearChars+"y";
            }
            int nextVal = (int)await _patientIdentificationCodeService.GetNextValidNumericCodeValue(filter);
            viewModel.FIN = $"{finConfig.Prefix}{finConfig.LetterCode}{nextVal}{DateTime.Now.ToString(monthChars)}{DateTime.Now.ToString(yearChars)}";
            finConfig.NumericCode = nextVal;
            await _patientIdentificationCodeService.Save(finConfig);
            return await base.Create(viewModel);
        }

        public async Task<IList<PatientVm>> GetNotRegisteredAsync()
        {
            return await Repository.GetAll()
                .Where(p => string.IsNullOrEmpty(p.SecurityHash))
                .ProjectTo<PatientVm>(_mapper.ConfigurationProvider)
                .ToListAsync();
        }

        public IQueryable<PatientProjectionViewModel> GetAll()
        {
            return Repository.GetAll()
                .ProjectTo<PatientProjectionViewModel>(_mapper.ConfigurationProvider);
        }

        public IQueryable<PatientProjectionViewModel> GetPatientsByAppointmentStatus(
            PatientDxOptionsViewModel loadOptions)
        {
            var companyId = loadOptions.CompanyId;

            var patientsQuery = Repository.GetAll()
                .Where(p => p.CompanyId == companyId);

            var appointmentStatus = loadOptions.AppointmentStatus;
            if (!string.IsNullOrEmpty(appointmentStatus))
            {
                patientsQuery = patientsQuery
                    .Include(p => p.Appointments)
                    .Where(p => p.Appointments != null &&
                                p.Appointments.Select(a => a.AppointmentStatus).Contains(appointmentStatus))
                    .Distinct();
            }

            return patientsQuery.ProjectTo<PatientProjectionViewModel>(_mapper.ConfigurationProvider);
        }

        public IQueryable<PatientProjectionViewModel> GetPatientsByKeyword(
            PatientDxOptionsViewModel loadOptions)
        {
            var companyId = loadOptions.CompanyId;
            var keyword = loadOptions.SearchKeyword;
            IQueryable<Patient> patientsQuery;

            if (!string.IsNullOrEmpty(keyword))
            {
                patientsQuery = Repository.GetAll()
                .Where(p => p.CompanyId == companyId && (p.FirstName.Contains(keyword) || p.LastName.Contains(keyword) || p.MiddleName.Contains(keyword) || p.Email.Contains(keyword) || p.FIN.Contains(keyword) || p.PrimaryPhone.Contains(keyword)));

            }
            else
            {
                patientsQuery = Repository.GetAll();
            }


            return patientsQuery.ProjectTo<PatientProjectionViewModel>(_mapper.ConfigurationProvider);
        }

        public async Task<string> GetPatientEmail(Guid id)
        {
            return (await Repository.GetAll().AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == id)).Email;
        }

        public async Task<PatientWithVitalSignsVm> GetByIdWithVitalSigns(Guid id)
        {
            var isExpressionExecutionTestPatient =
                Guid.Parse(ExpressionTestConstants.Ids.PatientId) == id;

            if (isExpressionExecutionTestPatient)
                return _expressionExecutionTestPatient;

            var patient = await Repository.GetAll()
                .Include(p => p.BaseVitalSigns)
                .FirstOrDefaultAsync(p => p.Id == id);

            return new PatientWithVitalSignsVm
            {
                Patient = Mapper.Map<PatientVm>(patient),
                BaseVitalSigns = Mapper.Map<BaseVitalSignsViewModel>(patient.BaseVitalSigns)
            };
        }

        public async Task Delete(Guid id)
        {
            var patient = await Repository
                .GetAll()
                .Include(p => p.PatientInsurance)
                .Include(p => p.Appointments)
                .Include(p => p.Admissions)
                .Include(p => p.TobaccoHistory)
                .Include(p => p.DrugHistory)
                .Include(p => p.AlcoholHistory)
                .Include(p => p.MedicalHistory)
                .Include(p => p.SurgicalHistory)
                .Include(p => p.FamilyHistory)
                .Include(p => p.EducationHistory)
                .Include(p => p.OccupationalHistory)
                .Include(p => p.Allergies)
                .Include(p => p.MedicationHistory)
                .Include(p => p.MedicalRecords)
                .Include(p => p.VitalSigns)
                .Include(p => p.BaseVitalSigns)
                .Include(p => p.MedicationPrescriptions)
                .Include(p => p.VisualVitalSigns)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (patient == null)
                return;

            var patientInsurance = patient.PatientInsurance;
            if (patientInsurance != null)
                ((Repository<PatientInsurance>)_patientInsuranceRepository)
                    .Remove(patientInsurance);

            var baseVitalSigns = patient.BaseVitalSigns;
            if (baseVitalSigns != null)
                ((Repository<BaseVitalSigns>)_baseVitalSignsRepository)
                    .Remove(baseVitalSigns);

            //todo: consider to use cascade deletion
            RemoveRelatedToPatientEntities((Repository<Appointment>)_appointmentRepository, patient.Appointments);

            if (patient.Admissions.Any())
            {
                var admissionIdsToDelete =
                    patient.Admissions.Select(a => a.Id);

                var signatureInfoToDelete = await _signatureInfoRepository
                    .GetAll()
                    .Where(s => admissionIdsToDelete.Contains(s.AdmissionId))
                    .ToListAsync();

                if (signatureInfoToDelete.Any())
                    RemoveRelatedToPatientEntities((Repository<SignatureInfo>)_signatureInfoRepository,
                        signatureInfoToDelete);
            }

            RemoveRelatedToPatientEntities((Repository<Admission>)_admissionRepository, patient.Admissions);

            RemoveRelatedToPatientEntities((Repository<TobaccoHistory>)_tobaccoHistoryRepository,
                patient.TobaccoHistory);

            RemoveRelatedToPatientEntities((Repository<DrugHistory>)_drugHistoryRepository, patient.DrugHistory);

            RemoveRelatedToPatientEntities((Repository<AlcoholHistory>)_alcoholHistoryRepository,
                patient.AlcoholHistory);

            RemoveRelatedToPatientEntities((Repository<MedicalHistory>)_medicalHistoryRepository,
                patient.MedicalHistory);

            RemoveRelatedToPatientEntities((Repository<SurgicalHistory>)_surgicalHistoryRepository,
                patient.SurgicalHistory);

            RemoveRelatedToPatientEntities((Repository<FamilyHistory>)_familyHistoryRepository, patient.FamilyHistory);

            RemoveRelatedToPatientEntities((Repository<EducationHistory>)_educationHistoryRepository,
                patient.EducationHistory);

            RemoveRelatedToPatientEntities((Repository<OccupationalHistory>)_occupationalHistoryRepository,
                patient.OccupationalHistory);

            RemoveRelatedToPatientEntities((Repository<Allergy>)_allergyRepository, patient.Allergies);

            RemoveRelatedToPatientEntities((Repository<MedicationHistory>)_medicationHistoryRepository,
                patient.MedicationHistory);

            RemoveRelatedToPatientEntities((Repository<MedicalRecord>)_medicalRecordRepository,
                patient.MedicalRecords);

            RemoveRelatedToPatientEntities((Repository<VitalSigns>)_vitalSignsRepository, patient.VitalSigns);

            RemoveRelatedToPatientEntities((Repository<MedicationPrescription>)_medicationPrescriptionRepository,
                patient.MedicationPrescriptions);

            RemoveRelatedToPatientEntities((Repository<VisionVitalSigns>)_visionVitalSignsRepository,
                patient.VisualVitalSigns);

            ((Repository<Patient>)Repository).Remove(patient);

            await _unitOfWork.Commit();
        }

        public IQueryable<PatientLookupVm> Lookup(DateRangeDxOptionsViewModel loadOptions)
        {
            var companyId = loadOptions.CompanyId;
            if (companyId == Guid.Empty)
                return Enumerable.Empty<PatientLookupVm>().AsQueryable();

            var searchString = _dataSourceLoadOptionsHelper.GetSearchString(loadOptions);
            var isSearchStringExist = !string.IsNullOrEmpty(searchString);

            //we have to remove native devextreme filter
            if (isSearchStringExist)
                loadOptions.Filter = null;

            var startDate = loadOptions.StartDate;
            var endDate = loadOptions.EndDate;

            var query = _appointmentGridItemRepository.GetAll()
                .Where(a => a.CompanyId == companyId);

            query = ApplyIntervalFilter(startDate, endDate, query, out var isIntervalFilterApplied);

            if (isIntervalFilterApplied)
            {
                if (isSearchStringExist)
                    query = query
                        .Where(a => (a.PatientFirstName + " " + a.PatientLastName).Contains(searchString));

                return query.Select(a => new { a.PatientId, a.PatientFirstName, a.PatientLastName, a.PatientDateOfBirth })
                    .Distinct()
                    .Select(a => new PatientLookupVm
                    {
                        Id = a.PatientId,
                        Name = $"{a.PatientFirstName} {a.PatientLastName}",
                        DateOfBirth = a.PatientDateOfBirth
                    });
            }

            var patientQuery = Repository.GetAll().Where(p => p.CompanyId == companyId);

            if (isSearchStringExist)
                patientQuery = patientQuery
                    .Where(p => (p.FirstName + " " + p.LastName).Contains(searchString));

            return patientQuery.ProjectTo<PatientLookupVm>(_mapper.ConfigurationProvider);
        }

        public Task<List<PatientVm>> GetByFilter(PatientFilterVm patientSearchFilter)
        {
            var query = Repository.GetAll();

            var firstName = patientSearchFilter.FirstName;
            if (!string.IsNullOrEmpty(firstName))
                query = query.Where(t => t.FirstName == firstName);

            var lastName = patientSearchFilter.LastName;
            if (!string.IsNullOrEmpty(lastName))
                query = query.Where(t => t.LastName == lastName);

            var ssn = patientSearchFilter.Ssn;
            if (!string.IsNullOrEmpty(ssn))
                query = query.Where(t => t.Ssn == ssn);

            var dateOfBirth = patientSearchFilter.DateOfBirth;
            if (dateOfBirth.HasValue)
                query = query.Where(t => t.DateOfBirth == dateOfBirth);

            query = query.Where(t => t.CompanyId == patientSearchFilter.CompanyId);

            var takeCount = patientSearchFilter.Take;
            if (takeCount != 0)
                query = query.Take(takeCount);

            return query.ProjectTo<PatientVm>(_mapper.ConfigurationProvider)
                .ToListAsync();
        }

        public async Task UpdatePatientNotes(PatientPatchVm patientNotesPatch)
        {
            var patient = await Repository.GetAll()
                .FirstOrDefaultAsync(p => p.Id == patientNotesPatch.Id);

            if (patient == null)
                return;

            patient.Notes = patientNotesPatch.Notes;

            await Repository.SaveChangesAsync();
        }

        private static void RemoveRelatedToPatientEntities<TEntity>(Repository<TEntity> repository,
            IList<TEntity> entities)
            where TEntity : Entity
        {
            if (!entities.Any())
                return;

            foreach (var entity in entities)
            {
                repository.Remove(entity);
            }
        }

        public int GetMaxId()
        {
            return Repository.GetAll().Count();
        }

        public async Task UpdatePatientAccessedAt(Guid patientId, DateTime accssedAt)
        {
            var patient = await Repository.GetAll()
                .FirstOrDefaultAsync(p => p.Id == patientId);

            if (patient == null)
                return;

            patient.AccessedAt = accssedAt;

            await Repository.SaveChangesAsync();
        }
    }
}
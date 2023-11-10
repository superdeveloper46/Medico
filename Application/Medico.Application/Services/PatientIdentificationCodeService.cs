using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Medico.Application.Interfaces;
using Medico.Application.PatientIdentificationCodes.ViewModels;
using Medico.Application.ViewModels;
using Medico.Domain.Enums;
using Medico.Domain.Interfaces;
using Medico.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Medico.Application.Services
{
    public class PatientIdentificationCodeService : IPatientIdentificationCodeService
    {
        private readonly IPatientIdentificationCodeRepository _identificationRepository;
        private readonly IMapper _mapper;

        public PatientIdentificationCodeService(IPatientIdentificationCodeRepository identificationRepository,
            IMapper mapper)
        {
            _identificationRepository = identificationRepository;
            _mapper = mapper;
        }

        public async Task<PatientIdentificationCodeVm> Get(IdentificationCodeSearchFilterVm searchFilter)
        {
            var companyId = searchFilter.CompanyId;
            var patientIdentificationCodes = await _identificationRepository
                .GetAll()
                .FirstOrDefaultAsync(p => p.CompanyId == companyId && p.Type == (PatientIdentificationCodeType)searchFilter.IdentificationCodeType);

            var identificationCodeVm = _mapper.Map<PatientIdentificationCodeVm>(patientIdentificationCodes);

            return identificationCodeVm;
        }

        public async Task<CreateUpdateResponseVm<PatientIdentificationCodeVm>> Save(PatientIdentificationCodeVm code)
        {
            var companyId = code.CompanyId;

            var identificationCode = await _identificationRepository
                .GetAll()
                .FirstOrDefaultAsync(p => p.Company.Id == companyId && p.Type == (PatientIdentificationCodeType)code.Type);

            if (identificationCode == null)
            {
                var newIdentificationCode = _mapper.Map<PatientIdentificationCode>(code);
                await _identificationRepository.AddAsync(newIdentificationCode);
                await _identificationRepository.SaveChangesAsync();
                code.Id = newIdentificationCode.Id;
            }
            else
                _mapper.Map(code, identificationCode);
            await _identificationRepository.SaveChangesAsync();

            return CreateUpdateResponseVm<PatientIdentificationCodeVm>
                .CreateSuccessResponse(code);
        }

        public async Task<int?> GetNextValidNumericCodeValue(IdentificationCodeSearchFilterVm searchFilter)
        {
            var companyId = searchFilter.CompanyId;
            var type = searchFilter.IdentificationCodeType;
            var patient = await _identificationRepository
                .GetAll()
                .FirstOrDefaultAsync(p => p.CompanyId == companyId && p.Type == (PatientIdentificationCodeType)type);
            int nextVal = patient.NumericCode+1;
            return patient == null ? 0 : nextVal;
        }
    }
}
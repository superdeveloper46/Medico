using System;
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
    public class PatientInsuranceService : BaseService<PatientInsurance, PatientInsuranceViewModel>, IPatientInsuranceService
    {
        private readonly IMapper _mapper;

        public PatientInsuranceService(
            IPatientInsuranceRepository patientInsuranceRepository,
            IMapper mapper) : base(patientInsuranceRepository, mapper)
        {
            _mapper = mapper;
        }

        public IQueryable<PatientInsuranceViewModel> GetAll()
        {
            return Repository.GetAll()
                .ProjectTo<PatientInsuranceViewModel>(_mapper.ConfigurationProvider);
        }

        public int GetMaxId()
        {
            return Repository.GetAll().Count();
        }

        public async Task<PatientInsuranceViewModel> GetByPatientId(Guid patientId)
        {
            var patientInsurance = await Repository.GetAll()
                .FirstOrDefaultAsync(p => p.PatientId == patientId);

            return patientInsurance == null 
                ? null 
                : Mapper.Map<PatientInsuranceViewModel>(patientInsurance);
        }
    }
}
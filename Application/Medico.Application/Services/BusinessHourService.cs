using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Medico.Data.Repository;
using Medico.Domain.Interfaces;
using Medico.Domain.Models;
using Microsoft.EntityFrameworkCore;
using static Dapper.SqlMapper;

namespace Medico.Application.Services
{
    public class BusinessHourService : BaseDeletableByIdService<BusinessHour, BusinessHourViewModel>, IBusinessHourService
    {
        private IBusinessHourRepository _businessHourRepository;
        private readonly IMapper _mapper;

        public BusinessHourService(IBusinessHourRepository businssHourRepository,
            IMapper mapper)
            : base(businssHourRepository, mapper)
        {
            _businessHourRepository = businssHourRepository;
            _mapper = mapper;
        }

        public IQueryable<BusinessHourViewModel> GetAll()
        {
            return Repository.GetAll()
                .ProjectTo<BusinessHourViewModel>(_mapper.ConfigurationProvider);
        }

        public Task DeleteAll()
        {
            var businessHourIds = Repository.GetAll().Select(businessHour => businessHour.Id).ToArray();

            foreach (Guid businessHourId in businessHourIds)
            {
                _businessHourRepository.Remove(businessHourId);
            }

            return _businessHourRepository.SaveChangesAsync();
        }

    }
}

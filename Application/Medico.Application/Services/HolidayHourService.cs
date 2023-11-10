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
    public class HolidayHourService : BaseDeletableByIdService<HolidayHour, HolidayHourViewModel>, IHolidayHourService
    {
        private IHolidayHourRepository _holidayHourRepository;
        private IMapper _mapper;

        public HolidayHourService(IHolidayHourRepository holidayHourRepository,
            IMapper mapper)
            : base(holidayHourRepository, mapper)
        {
            _holidayHourRepository = holidayHourRepository;
            _mapper = mapper;
        }

        public IQueryable<HolidayHourViewModel> GetAll()
        {
            return Repository.GetAll()
                .ProjectTo<HolidayHourViewModel>(_mapper.ConfigurationProvider);
        }

        public Task DeleteAll()
        {
            var holidayHourIds = Repository.GetAll().Select(holidayHour => holidayHour.Id).ToArray();

            foreach (Guid holidayHourId in holidayHourIds)
            {
                _holidayHourRepository.Remove(holidayHourId);
            }

            return _holidayHourRepository.SaveChangesAsync();
        }

    }
}

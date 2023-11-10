﻿using System;
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
    public class LocationService : BaseDeletableByIdService<Location, LocationViewModel>, ILocationService
    {
        private readonly IAppointmentGridItemRepository _appointmentGridItemRepository;
        private readonly IMapper _mapper;
        public LocationService(ILocationRepository locationRepository,
            IMapper mapper, IAppointmentGridItemRepository appointmentGridItemRepository)
            : base(locationRepository, mapper)
        {
            _appointmentGridItemRepository = appointmentGridItemRepository;
            _mapper = mapper;
        }

        public IQueryable<LocationViewModel> GetAll()
        {
            return Repository.GetAll()
                .ProjectTo<LocationViewModel>(_mapper.ConfigurationProvider);
        }

        public Task Delete(Guid id)
        {
            return DeleteById(id);
        }

        public IQueryable<LookupViewModel> Lookup(DateRangeDxOptionsViewModel loadOptions)
        {
            var companyId = loadOptions.CompanyId;
            if (companyId == Guid.Empty)
                return Enumerable.Empty<LookupViewModel>()
                    .AsQueryable();

            var startDate = loadOptions.StartDate;
            var endDate = loadOptions.EndDate;

            var query = _appointmentGridItemRepository.GetAll()
                .Where(a => a.CompanyId == companyId);

            query = ApplyIntervalFilter(startDate, endDate, query, out var isIntervalFilterApplied);

            if (isIntervalFilterApplied)
            {
                return query.Select(a => new LookupViewModel
                {
                    Id = a.LocationId,
                    Name = a.LocationName
                }).Distinct();
            }

            return Repository.GetAll().Where(l => l.IsActive && l.CompanyId == companyId)
                .Select(l => new LookupViewModel
                {
                    Id = l.Id,
                    Name = l.Name
                });
        }

        public IQueryable<LocationViewModel> Grid(CompanyDxOptionsViewModel loadOptions)
        {
            var companyId = loadOptions.CompanyId;
            if (companyId == Guid.Empty)
                return Enumerable.Empty<LocationViewModel>()
                    .AsQueryable();

            return Repository.GetAll().Where(l => l.CompanyId == companyId)
                .ProjectTo<LocationViewModel>(_mapper.ConfigurationProvider);
        }

        public async Task<LocationViewModel> GetByName(string examLocation)
        {
            try
            {
                var location = await Repository.GetAll()
                  .FirstOrDefaultAsync(u => u.Name == examLocation);

                if (location != null)
                {
                    return Mapper.Map<LocationViewModel>(location);
                }
                return null;
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }
    }
}

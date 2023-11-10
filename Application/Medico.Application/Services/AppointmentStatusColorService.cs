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
    public class AppointmentStatusColorService : BaseDeletableByIdService<AppointmentStatusColor, AppointmentStatusColorViewModel>, IAppointmentStatusColorService
    {
        private IAppointmentStatusColorRepository _appointmentStatusColorRepository;
        private readonly IMapper _mapper;

        public AppointmentStatusColorService(IAppointmentStatusColorRepository appointmentStatusColorRepository,
            IMapper mapper)
            : base(appointmentStatusColorRepository, mapper)
        {
            _appointmentStatusColorRepository = appointmentStatusColorRepository;
            _mapper = mapper;
        }

        public IQueryable<AppointmentStatusColorViewModel> GetAll()
        {
            return Repository.GetAll()
                .ProjectTo<AppointmentStatusColorViewModel>(_mapper.ConfigurationProvider);
        }

        public Task DeleteAll()
        {
            var appointmentStatusColorIds = Repository.GetAll().Select(appointmentStatusColor => appointmentStatusColor.Id).ToArray();

            foreach (Guid appointmentStatusColorId in appointmentStatusColorIds)
            {
                _appointmentStatusColorRepository.Remove(appointmentStatusColorId);
            }

            return _appointmentStatusColorRepository.SaveChangesAsync();
        }

    }
}

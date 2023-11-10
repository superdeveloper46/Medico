using System.Linq;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Medico.Domain.Interfaces;

namespace Medico.Application.Services
{
    public class LocationRoomService : ILocationRoomService
    {
        private readonly ILocationRoomViewRepository _locationRoomViewRepository;
        private readonly IMapper _mapper;

        public LocationRoomService(ILocationRoomViewRepository locationRoomViewRepository, IMapper mapper)
        {
            _locationRoomViewRepository = locationRoomViewRepository;
            _mapper = mapper;
        }

        public IQueryable<LocationRoomViewModel> GetAll()
        {
            return _locationRoomViewRepository
                .GetAll()
                .ProjectTo<LocationRoomViewModel>(_mapper.ConfigurationProvider);
        }
    }
}

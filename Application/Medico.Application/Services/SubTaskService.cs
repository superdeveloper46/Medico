using AutoMapper;
using AutoMapper.QueryableExtensions;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Medico.Domain.Interfaces;
using Medico.Domain.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Medico.Application.Services
{
    public class SubTaskService :  BaseDeletableByIdService<SubTask, SubTaskViewModel>,
        ISubTaskService
    {
        private readonly IMapper _mapper;

        public SubTaskService(ISubTaskRepository repository, IMapper mapper)
          : base(repository, mapper)
        {
            _mapper = mapper;
        }

        public async Task<IEnumerable<SubTaskViewModel>> GetByNotification(int notificationId)
        {
            var subTaskViews = await Repository.GetAll()
               .Where(th => th.NotificationId == notificationId)
               .ProjectTo<SubTaskViewModel>(_mapper.ConfigurationProvider)
               .ToListAsync();

            return subTaskViews;
        }
    }
}

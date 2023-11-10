using AutoMapper;
using AutoMapper.QueryableExtensions;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Medico.Domain.Interfaces;
using Medico.Domain.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Medico.Application.Services
{
    public class SubTaskUserService :  BaseDeletableByIdService<SubTaskUser, SubTaskUserViewModel>,
        ISubTaskUserService
    {
        private readonly ISubTaskUserRepository _repository;
        private readonly IMapper _mapper;
        public SubTaskUserService(ISubTaskUserRepository repository, IMapper mapper)
        : base(repository, mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task<IEnumerable<SubTaskUserViewModel>> GetByTaskId(Guid id)
        {
            var subTaskViews = await _repository.GetAll()
                .Where(th => th.SubTaskId == id)
                .ProjectTo<SubTaskUserViewModel>(_mapper.ConfigurationProvider)
                .ToListAsync();

            return subTaskViews;
        }

        public Task DeleteBySubTaskId(Guid subTaskId)
        {
            var ids = _repository.GetAll().Where(th => th.SubTaskId == subTaskId).Select(data => data.Id).ToArray();

            foreach (Guid id in ids)
            {
                _repository.Remove(id);
            }
            return _repository.SaveChangesAsync();
        }
    }
}

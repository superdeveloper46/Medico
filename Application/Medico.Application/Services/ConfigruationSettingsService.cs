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
    public class ConfigurationSettingsService : BaseDeletableByIdService<ConfigurationSettings, ConfigurationSettingsViewModel>, IConfigurationSettingsService
    {
        private IConfigurationSettingsRepository _configurationSettingsRepository;
        private readonly IMapper _mapper;

        public ConfigurationSettingsService(IConfigurationSettingsRepository configurationSettingsRepository,
            IMapper mapper)
            : base(configurationSettingsRepository, mapper)
        {
            _configurationSettingsRepository = configurationSettingsRepository;
            _mapper = mapper;
        }

        public IQueryable<ConfigurationSettingsViewModel> GetAll(string itemId)
        {
            return Repository.GetAll()
                .Where(th => th.ItemId == itemId)
                .ProjectTo<ConfigurationSettingsViewModel>(_mapper.ConfigurationProvider);
        }

        public Task DeleteAll(string itemId)
        {
            var configurationSettingsIds = Repository.GetAll().Where(th => th.ItemId == itemId).Select(data => data.Id).ToArray();

            foreach (Guid configurationSettingsId in configurationSettingsIds)
            {
                _configurationSettingsRepository.Remove(configurationSettingsId);
            }

            return _configurationSettingsRepository.SaveChangesAsync();
        }

        public Task DeleteById(Guid id)
        {
            var configurationSettingsIds = Repository.GetAll().Where(th => th.Id == id).Select(data => data.Id).ToArray();

            foreach (Guid configurationSettingsId in configurationSettingsIds)
            {
                _configurationSettingsRepository.Remove(configurationSettingsId);
            }

            return _configurationSettingsRepository.SaveChangesAsync();
        }

    }
}

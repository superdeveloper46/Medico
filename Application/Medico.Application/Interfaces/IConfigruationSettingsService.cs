using System;
using System.Linq;
using System.Threading.Tasks;
using Medico.Application.ViewModels;

namespace Medico.Application.Interfaces
{
    public interface IConfigurationSettingsService
    {
        IQueryable<ConfigurationSettingsViewModel> GetAll(string itemid);
        Task<ConfigurationSettingsViewModel> Create(ConfigurationSettingsViewModel configurationSettingsViewModel);
        Task DeleteAll(string itemId);
        Task DeleteById(Guid id);
    }
}
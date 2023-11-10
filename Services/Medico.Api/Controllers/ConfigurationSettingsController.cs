using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using DevExtreme.AspNet.Data;
using Medico.Api.Constants;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Medico.Application.Services;
using System.Linq;
using Dapper;
using System.Collections.Generic;

namespace Medico.Api.Controllers
{
    [Authorize]
    [Route("api/configurationSettings")]
    public class ConfigurationSettingsController : ApiController
    {
        private readonly IConfigurationSettingsService _configurationSettingsService;

        public ConfigurationSettingsController(IConfigurationSettingsService configurationSettingsService,
            ICompanySecurityService companySecurityService) : base(companySecurityService)
        {
            _configurationSettingsService = configurationSettingsService;
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] ConfigurationSettingsViewModel[] configurationSettingsViewModels)
        {
            if (!ModelState.IsValid)
                return BadRequest();

            if (configurationSettingsViewModels[0].ItemId != "Include List" && configurationSettingsViewModels[0].ItemId != "Exclude List")
                await _configurationSettingsService.DeleteAll(configurationSettingsViewModels[0].ItemId);

            foreach (ConfigurationSettingsViewModel configurationSettingsViewModel in configurationSettingsViewModels)
            {
                configurationSettingsViewModel.Id = Guid.NewGuid();
                await _configurationSettingsService.Create(configurationSettingsViewModel);
            }

            return Ok(new
            {
                Success = true,
            });
        }

        [HttpDelete]
        [Route("{id}")]
        public async Task<IActionResult> DeleteById(Guid id)
        {
            await _configurationSettingsService.DeleteById(id);

            return Ok();
        }

        [HttpGet]
        [Route("{itemId}")]
        public async Task<IActionResult> Get(string itemId)
        {
            IQueryable<ConfigurationSettingsViewModel> configurationSettingsViewModel = _configurationSettingsService.GetAll(itemId);
            if (configurationSettingsViewModel == null)
                return Ok(null);

            return Ok(configurationSettingsViewModel.AsList());
        }
    }
}
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace Medico.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SettingsController : ApiController
    {
        #region
        private readonly ISettingService _settingService;

        public SettingsController(ISettingService settingService, ICompanySecurityService companySecurityService)
            : base(companySecurityService)
        {
            _settingService = settingService;
        }
        #endregion

        [HttpPut]
        [Route("editor-config/{id}")]
        public async Task<IActionResult> PutEditorConfif(string id, EditorConfigVM editorConfig)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest();

                var result = await _settingService.UpdateEditorConfig(id, editorConfig);

                return Ok(new
                {
                    success = result != null,
                    message = result != null ? $"Editor configuration updated." : "Editor configuration could not be updated.",
                    data = result
                });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, message = $"Editor configuration could not be updated. {ex.Message}" });
            }
        }

        [HttpGet]
        [Route("editor-config")]
        public async Task<IActionResult> GetEditorConfig()
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest();

                EditorConfigVM result = await _settingService.GetEditorConfig();

                return Ok(new
                {
                    success = result != null,
                    data = result
                });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, message = $"Editor configuration could not be loaded. {ex.Message}" });
            }
        }
    }
}

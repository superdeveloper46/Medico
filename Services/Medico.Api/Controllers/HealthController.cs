using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;

namespace Medico.Api.Controllers
{
    [Route("api/health")]
    public class HealthController : ControllerBase
    {
        [HttpGet]
        [Route("status")]
        public string GetHealthStatus(IWebHostEnvironment env)
        {
            return $"Environment: {env.EnvironmentName} is ready";
        }
    }
}
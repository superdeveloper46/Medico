using System;
using System.Threading.Tasks;
using DevExtreme.AspNet.Data;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Medico.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.JsonPatch;

namespace Medico.Api.Controllers
{
  [Authorize]
  [Route("api/chart-colors")]
  public class ChartColorController : ApiController 
  {

    private readonly IChartColorService _chartColorService;

    public ChartColorController( IChartColorService chartColorService,
      ICompanySecurityService companySecurityService) : base(companySecurityService)
    {
      _chartColorService = chartColorService;
    }

    // gets the current colors
    [HttpGet]
    [Route("getColors")]
    public async Task<IActionResult> GetColors()
    {
      return Ok(await _chartColorService.GetColors());
    }

    // updates colors
    [HttpPost]
    [Route("updateColors")]
    public async Task<IActionResult> PostColors([FromBody]ChartColorViewModel newColors)
    {
      if(newColors == null) {
        return BadRequest();
      }

      //bool success = await _chartColorService.UpdateColor(newColors)
      //if (success) {}
      return Ok(await _chartColorService.UpdateColor(newColors));
      //return Ok(false);
    }

    // resets colors back to default
    [HttpPost]
    [Route("setDefault")]
    public async Task<IActionResult> SetDefaultColors() 
    {
      return Ok(await _chartColorService.SetDefaultColors());
    }
  }
}

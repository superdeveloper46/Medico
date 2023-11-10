using System;
using System.Threading.Tasks;
using DevExtreme.AspNet.Data;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Medico.Application.ViewModels.ErrorLog;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Medico.Api.Controllers
{
    [Authorize]
    [Route("api/error-log-records")]
    public class ApiErrorLogRecordsController : ApiController
    {
        private readonly IApiErrorLogRecordService _apiErrorLogRecordService;

        public ApiErrorLogRecordsController(IApiErrorLogRecordService apiErrorLogRecordService,
            ICompanySecurityService companySecurityService) : base(companySecurityService)
        {
            _apiErrorLogRecordService = apiErrorLogRecordService;
        }

        [HttpGet]
        [Authorize(Roles = "SuperAdmin")]
        [Route("{id}")]
        public async Task<IActionResult> Get(Guid id)
        {
            var apiErrorLogRecord =
                await _apiErrorLogRecordService.GetById(id);

            if (apiErrorLogRecord == null)
                return Ok();

            return Ok(apiErrorLogRecord);
        }

        [HttpDelete]
        [Authorize(Roles = "SuperAdmin")]
        [Route("{idData}")]
        public async Task<IActionResult> Delete(String idData)
        {
            string[] ids = idData.Split(',');
            foreach (var id in ids)
            {
                var apiErrorLogRecord = await _apiErrorLogRecordService
                    .GetById(Guid.Parse(id));

                if (apiErrorLogRecord == null)
                    return Ok();

                await _apiErrorLogRecordService.Delete(Guid.Parse(id));
            }
            return Ok();
        }

        [HttpPut]
        [Route("changeStatus/{id}/{value}")]
        public async Task<IActionResult> ChangeStatus(string id, string value)
        {
            bool result = await _apiErrorLogRecordService.ChangeStatus(id, value);

            return Ok(new
            {
                Data = result,
                success = true,
                Message = "done"
            });
        }
        
        [HttpGet]
        [Authorize(Roles = "SuperAdmin")]
        [Route("dx/grid")]
        public object DxGridData(CompanyDxOptionsViewModel loadOptions)
        { 
            var query = _apiErrorLogRecordService.Grid(loadOptions);

            loadOptions.PrimaryKey = new[] { "Id" };
            loadOptions.PaginateViaPrimaryKey = true;

            loadOptions.StringToLower = true;
            
            return DataSourceLoader.Load(query, loadOptions);
        }
    }
}
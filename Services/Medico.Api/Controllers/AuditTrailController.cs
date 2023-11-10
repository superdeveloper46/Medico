using Medico.Application.Interfaces;
using Medico.Application.ViewModels.Audit;
using Medico.Application.ViewModels.Enums;
using Medico.Domain.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Xml.Serialization;

namespace Medico.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuditTrailController : ApiController
    {
        readonly IAuditTrailService _auditTableService;

        #region Ctor
        public AuditTrailController(
            IAuditTrailService auditTableService,
            ICompanySecurityService companySecurityService) : base(companySecurityService)
        {
            _auditTableService = auditTableService;
        }
        #endregion

        #region Methods
        [HttpGet]
        [Route("{id}/dataModel/{dataModel}")]
        public async Task<IActionResult> Get(string id, string dataModel)
        {
            try
            {
                List<AuditChange> rslt = new List<AuditChange>();

                IOrderedEnumerable<AuditTable> AuditTrail;

                AuditTrail = await _auditTableService.GetAll(id, dataModel);

                var serializer = new XmlSerializer(typeof(AuditDelta));

                foreach (var record in AuditTrail)
                {
                    AuditChange Change = new AuditChange
                    {
                        DateTimeStamp = record.DateTimeStamp.ToString(),
                        AuditActionType = (AuditActionType)record.AuditActionTypeENUM,
                        AuditActionTypeName = Enum.GetName(typeof(AuditActionType), record.AuditActionTypeENUM)
                    };
                    List<AuditDelta> delta = new List<AuditDelta>();
                    delta = JsonConvert.DeserializeObject<List<AuditDelta>>(record.Changes);
                    Change.Changes.AddRange(delta);
                    rslt.Add(Change);
                }

                return Ok(new 
                {
                    Success = true,
                    Message = "success",
                    Data = rslt
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = "error" });
            }

        }
        #endregion
    }
}

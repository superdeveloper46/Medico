using System;
using System.Threading.Tasks;
using Medico.Application.ExpressionItemsManagement;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels.ExpressionExecution;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Medico.Api.Controllers
{
    [Authorize]
    [Route("api/expression-items")]
    public class ExpressionItemController : ControllerBase
    {
        private readonly IExpressionItemsService _expressionItemsService;
        private readonly IExpressionExecutionService _expressionExecutionService;

        public ExpressionItemController(IExpressionItemsService expressionItemsService,
            IExpressionExecutionService expressionExecutionService)
        {
            _expressionItemsService = expressionItemsService;
            _expressionExecutionService = expressionExecutionService;
        }

        [HttpGet]
        [Route("{id}/{admissionId}")]
        public async Task<IActionResult> Get(Guid id, Guid admissionId)
        {
            var expressionItemHtmlString = await _expressionItemsService
                .GetExpressionItemHtmlElement(id);

            var expressionResult = await _expressionExecutionService
                .CalculateExpressionItem(id, admissionId);

            return Ok(new {expressionItemHtmlString, expressionResult });
        }
    }
}
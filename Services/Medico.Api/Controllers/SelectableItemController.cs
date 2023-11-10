using System.Threading.Tasks;
using Medico.Application.SelectableItemsManagement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Medico.Api.Controllers
{
    [Authorize]
    [Route("api/selectable-items")]
    public class SelectableItemController : ControllerBase
    {
        private readonly ISelectableItemsService _selectableItemsService;

        public SelectableItemController(ISelectableItemsService selectableItemsService)
        {
            _selectableItemsService = selectableItemsService;
        }

        [HttpPost]
        [Route("variables-uniqueness")]
        public IActionResult CreateVariablesUniquenessCheckResult(
            [FromBody]VariablesUniquenessRequestVm variablesUniquenessRequest)
        {
            var selectableItemHtmlString = _selectableItemsService
                .CheckNonUniqueSelectableVariablesInHtmlContent(variablesUniquenessRequest.TemplateContent);
            return Ok(selectableItemHtmlString);
        }

        [HttpGet]
        public async Task<IActionResult> Get(SelectableItemRequest selectableItemRequest)
        {
            var selectableItemHtmlString = await _selectableItemsService
                .GetSelectableItemHtmlElement(selectableItemRequest);
            return Ok(new {selectableItemHtmlString});
        }
    }
}
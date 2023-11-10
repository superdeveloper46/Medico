using System;
using System.Threading.Tasks;
using Medico.Application.ViewModels.ExpressionExecution;
using Newtonsoft.Json.Linq;

namespace Medico.Application.Interfaces
{
    public interface IExpressionExecutionService
    {
        Task<string> CalculateExpressionsInTemplate(ExpressionExecutionRequestVm expressionExecutionRequest);
        
        Task<string> CalculateExpression(ExpressionExecutionRequestVm expressionExecutionRequest);

        Task<string> CalculateExpressionItem(Guid expressionId, Guid admissionId);

        Task<JObject> CalculateExpressionByTitle(string title, Guid patientId, Guid admissionId);
    }
}
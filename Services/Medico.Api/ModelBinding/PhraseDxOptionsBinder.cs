using DevExtreme.AspNet.Data;
using Medico.Application.ViewModels;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace Medico.Api.ModelBinding
{
    public class PhraseDxOptionsBinder : BaseDxOptionsBinder
    {
        protected override DataSourceLoadOptionsBase GetLoadOptions(ModelBindingContext bindingContext)
        {
            var phraseLoadOptions = new PhraseDxOptionsViewModel();

            phraseLoadOptions.CompanyId =
                ExtractGuid(bindingContext, nameof(phraseLoadOptions.CompanyId));
            
            phraseLoadOptions.PatientChartNodeId =
                ExtractNullableGuid(bindingContext, nameof(phraseLoadOptions.PatientChartNodeId));
            
            phraseLoadOptions.TemplateId =
                ExtractNullableGuid(bindingContext, nameof(phraseLoadOptions.TemplateId));
            
            return phraseLoadOptions;
        }
    }
}
using DevExtreme.AspNet.Data;
using Medico.Application.ViewModels;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace Medico.Api.ModelBinding
{
    public class CompanyDxOptionsBinder : BaseDxOptionsBinder
    {
        protected override DataSourceLoadOptionsBase GetLoadOptions(ModelBindingContext bindingContext)
        {
            var companyLoadOptions = new CompanyDxOptionsViewModel();

            companyLoadOptions.CompanyId =
                ExtractGuid(bindingContext, nameof(companyLoadOptions.CompanyId));

            return companyLoadOptions;
        }
    }
}
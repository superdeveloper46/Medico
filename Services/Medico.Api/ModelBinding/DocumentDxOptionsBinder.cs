using DevExtreme.AspNet.Data;
using Medico.Application.ViewModels.Document;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace Medico.Api.ModelBinding
{
    public class DocumentDxOptionsBinder: BaseDxOptionsBinder
    {
        protected override DataSourceLoadOptionsBase GetLoadOptions(ModelBindingContext bindingContext)
        {
            var docLoadOptions = new DocumentDxOptionsViewModel();

            docLoadOptions.CompanyId =
                ExtractGuid(bindingContext, nameof(docLoadOptions.CompanyId));

            //patientLoadOptions.AppointmentStatus =
            //    GetUrlParameterValue(bindingContext, nameof(patientLoadOptions.AppointmentStatus),
            //        s => s);

            return docLoadOptions;
        }
    }
}

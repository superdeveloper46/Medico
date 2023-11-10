using DevExtreme.AspNet.Data;
using Medico.Application.ViewModels;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace Medico.Api.ModelBinding
{
    public class PatientDxOptionsBinder : BaseDxOptionsBinder
    {
        protected override DataSourceLoadOptionsBase GetLoadOptions(ModelBindingContext bindingContext)
        {
            var patientLoadOptions = new PatientDxOptionsViewModel();

            patientLoadOptions.CompanyId =
                ExtractGuid(bindingContext, nameof(patientLoadOptions.CompanyId));

            patientLoadOptions.AppointmentStatus =
                GetUrlParameterValue(bindingContext, nameof(patientLoadOptions.AppointmentStatus),
                    s => s);

            patientLoadOptions.SearchKeyword =
                GetUrlParameterValue(bindingContext, nameof(patientLoadOptions.SearchKeyword),
                    s => s);

            return patientLoadOptions;
        }
    }
}
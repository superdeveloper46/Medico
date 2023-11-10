using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Medico.Application.Services.PatientChart;
using Medico.Application.ViewModels;
using Medico.Application.ViewModels.PatientChart;
using Medico.Application.ViewModels.PatientChartDocument;

namespace Medico.Application.Interfaces
{
    public interface  IPatientChartService
    {
        Task<PatientChartNode> GetByFilter(PatientChartDocumentFilterVm searchFilterVm);

        Task<PatientChartNode> Update(PatientChartVm patientChartVm);

        Task<List<PatientChartListNode>> GetAsList(PatientChartDocumentFilterVm searchFilterVm);

        Task<string> Expression(Guid patientChartId, Guid companyId, Guid admissionId);

        Task<string> calculateInTemplate(IAdmissionService admissionService, string templateContent, Guid admissionId, Guid patientId, Guid companyId);
    }
}

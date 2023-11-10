using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Medico.Application.ViewModels;
using Medico.Application.ViewModels.Patient;

namespace Medico.Application.Interfaces
{
    public interface IVariableService
    {
        string calculateInTemplate(IAdmissionService admissionService, string template, Guid admissionId, Guid patientId, Guid companyId);
    }
}
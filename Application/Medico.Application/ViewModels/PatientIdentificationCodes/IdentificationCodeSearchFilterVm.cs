using System;

namespace Medico.Application.PatientIdentificationCodes.ViewModels
{
    public class IdentificationCodeSearchFilterVm
    {
        public Guid CompanyId { get; set; }
        
        public int IdentificationCodeType { get; set; }
    }
}
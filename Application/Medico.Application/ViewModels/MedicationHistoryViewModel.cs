using System;
using System.ComponentModel.DataAnnotations;

namespace Medico.Application.ViewModels
{
    public class MedicationHistoryViewModel : BaseViewModel
    {
        public DateTime? CreateDate { get; set; }

        public string? Medication { get; set; }
        
        public Guid PatientId { get; set; }

        public Guid? MedicationNameId { get; set; }

        public string? Dose { get; set; }

        public string? Units { get; set; }

        public string? DosageForm { get; set; }

        public string? Route { get; set; }
        
        public string? Sig { get; set; }
        
        public bool? Prn { get; set; }
        
        public string? MedicationStatus { get; set; }

        public string? Notes { get; set; }
        
        public bool? IncludeNotesInReport { get; set; }

        public Guid? Provider { get; set; }

        
    }

    public class MedicationHistoryTempViewModel: MedicationHistoryViewModel
    {
        public string? ProviderName { get; set; }
    }
}
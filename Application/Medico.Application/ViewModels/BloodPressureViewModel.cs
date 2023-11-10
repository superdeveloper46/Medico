using System;
using System.ComponentModel.DataAnnotations;

namespace Medico.Application.ViewModels
{
    public class BloodPressureViewModel : BaseViewModel
    {
        [Required]
        public Guid PatientId { get; set; }

        public string Title { get; set; }

        public string VarName { get; set; }

        public string VarModifier { get; set; }

        public int MinVar { get; set; }

        public int MaxVar { get; set; }

        public string Gender { get; set; }

        public double MinValue { get; set; }

        public double MaxValue { get; set; }

        public string ValUnits { get; set; }

        public string Message { get; set; }

        public string TemplateId { get; set; }

        public string AVID { get; set; }
    }
}
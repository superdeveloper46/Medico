﻿using System;
using System.ComponentModel.DataAnnotations;

namespace Medico.Application.ViewModels.Admission
{
    public class AdmissionVm : BaseViewModel
    {
        [Required] public Guid PatientId { get; set; }
        [Required] public Guid AppointmentId { get; set; }
        public Guid? VitalSignsNotesId { get; set; }
        public Guid? SignatureInfoId { get; set; }
        public string AdmissionData { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        public string CreatedBy { get; set; }
        public DateTime ModifiedDate { get; set; }
        public string ModifiedBy { get; set; }
        public bool SatementofExamModified { get; set; }
    }
}
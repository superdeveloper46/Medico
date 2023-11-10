﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Medico.Application.ViewModels
{
    public class AppointmentViewModel : BaseViewModel
    {
        [Required]
        public Guid PatientId { get; set; }

        [Required]
        public Guid CompanyId { get; set; }

        [Required]
        public Guid LocationId { get; set; }

        public Guid PhysicianId { get; set; }
        public string[] ProviderIds { get; set; }

        public Guid NurseId { get; set; }

        public string[] MaIds { get; set; }

        [Required]
        public Guid RoomId { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        public Guid? AdmissionId { get; set; }

        public string Allegations { get; set; }

        public string AllegationsNotes { get; set; }

        public string AppointmentStatus { get; set; }

        public  string MRN { get; set; }

        public IEnumerable<Guid> PatientChartDocumentNodes { get; set; }

        public IEnumerable<Guid> Assessments { get; set; }
        public string Notes { get; set; }
        public string ModifiedBy { get; set; }
        public DateTime ModifiedDate { get; set; }

        public string AppointmentType { get; set; }
        public string[] NewDiagnosises { get; set; }
        public string ChiefComplaints { get; set; }
        public string[] CurrentDiagnosises { get; set; }

        public string[] CurrentChiefComplaints { get; set; }

        public string[] CareTeamIds { get; set; }

    }

    public class AppointmentStatusVM
    {
        public Guid Id { get; set; }
        public string Status { get; set; }
        public string CreatedBy { get; set; }
        public DateTime? CreatedOn { get; set; }
        public string Notes { get; set; }
        public bool SendEmail { get; set; }
        public string EmailContent { get; set; }
    }

    public class AppointmentStatusSearch: AppointmentStatusVM
    {
        
        public string CreatedByName { get; set; }
        public string TimeElapsed { get; set; }
    }

    public class AppointmentStatusPatient: AppointmentStatusSearch
    {
        public Guid PatientId { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string PatientName { get; set; }
    }

    public class AppointmentStatusPieChart
    {
        public string Status { get; set; }
        public int StatusCount { get; set; }
    }
}
﻿using System;
using System.Collections.Generic;

namespace Medico.Application.ViewModels
{
    public class AppointmentGridItemViewModel : BaseViewModel
    {
        public Guid CompanyId { get; set; }

        public string Allegations { get; set; }

        public string AllegationsNotes { get; set; }

        public DateTime StartDate { get; set; }

        public string AppointmentTime => StartDate.ToLocalTime().ToString("hh:mm tt");

        public DateTime Date { get; set; }

        public DateTime EndDate { get; set; }

        public string AppointmentStatus { get; set; }

        public string LocationName { get; set; }

        public Guid LocationId { get; set; }

        public Guid RoomId { get; set; }

        public string RoomName { get; set; }

        public Guid PatientId { get; set; }

        public string PatientFirstName { get; set; }

        public string PatientLastName { get; set; }

        public string PatientNameSuffix { get; set; }

        public DateTime PatientDateOfBirth { get; set; }

        public Guid PhysicianId { get; set; }

        public string PhysicianFirstName { get; set; }

        public string PhysicianLastName { get; set; }

        public Guid NurseId { get; set; }
        
        public Guid? AdmissionId { get; set; }

        public string NurseFirstName { get; set; }

        public string NurseLastName { get; set; }

        public string MRN { get; set; }
        
        public int TotalNumberOfPatientAppointments { get; set; }
        
        public DateTime? SigningDate { get; set; }
        
        public DateTime? PreviousAppointmentDate { get; set; }
        
        public IEnumerable<Guid> PatientChartDocumentNodes { get; set; }

        public IEnumerable<AppointmentPatientChartDocumentModel> AppointmentPatientChartDocuments { get; set; }

        public string[]? ProviderIds { get; set; }
        public string[]? MaIds { get; set; }
        public string? AppointmentType { get; set; }
        public string[]? NewDiagnosises { get; set; }
        public string? ChiefComplaints { get; set; }
        public string[]? CurrentDiagnosises { get; set; }

        public string[]? CurrentChiefComplaints { get; set; }

        public string[]? CareTeamIds { get; set; }

        public string? Notes { get; set; }
    }

    public class AppointmentPatientChartDocumentModel
    {
        public string Name { get; set; }
        public string Title { get; set; }
    }
}
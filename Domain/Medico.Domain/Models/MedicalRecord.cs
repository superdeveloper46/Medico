using System;
using System.Collections.Generic;

namespace Medico.Domain.Models
{
    public class MedicalRecord : Entity
    {
        public string Notes { get; set; }

        public Patient Patient { get; set; }

        public Guid PatientId { get; set; }

        public DateTime CreateDate { get; set; }

        public Guid PhysicianId { get; set; }

        public string DocumentType { get; set; }

        public bool IncludeNotesInReport { get; set; }

        public string Diagnosis { get; set; }

        public Guid? Assessment { get; set; }

        public string FileName { get; set; }

        public string FileType { get; set; }

        public string Subject { get; set; }

        public IEnumerable<DocumentMedicalRecord> Docs { get; set; }
    }
}
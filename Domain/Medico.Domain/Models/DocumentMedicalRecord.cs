using System;
using System.ComponentModel.DataAnnotations;

namespace Medico.Domain.Models
{
    public class DocumentMedicalRecord
    {
        [Key]
        public string Id { get; set; }

        public string FileName { get; set; }

        public Guid MedicalRecordId { get; set; }

        public MedicalRecord MedicalRecord { get; set; }
    }
}
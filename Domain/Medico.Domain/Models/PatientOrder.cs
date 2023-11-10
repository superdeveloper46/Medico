using System;
using System.Collections.Generic;

namespace Medico.Domain.Models
{
    public class PatientOrder: Entity
    {
        public Guid PatientId { get; set; }
        public string OrderNumber { get; set; }
        public string Notes { get; set; }
        public int? AttachmentId { get; set; }
        public string OrderStatus { get; set; }
        public Guid CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public Guid? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public string ReferenceNo { get; set; }
        public Guid PhysicianId { get; set; }
        public Guid InsuranceId { get; set; }
        public DateTime DateOrdered { get; set; }
        public int VendorId { get; set; }
        public string UserIds {get; set;}
        public IEnumerable<PatientOrderItem> PatientOrderItems { get; set; }
    }
}

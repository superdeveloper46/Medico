using System;

namespace Medico.Domain.Models
{
    public class CareTeam : Entity
    {
        public int NPI { get; set; }
        public string ProviderLastName { get; set; }
        public string ProviderMiddleName { get; set; }
        public string ProviderFirstName { get; set; }
        public string PhoneNumber { get; set; }
        public string FaxNumber { get; set; }
        public string PracticeLocationAddress { get; set; }
        public string PracticeLocationCity { get; set; }
        public string PracticeLocationAddressState { get; set; }
        public Guid PatientId { get; set; }
    }
}

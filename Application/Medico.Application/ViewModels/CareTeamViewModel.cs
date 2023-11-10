using System;
using System.Collections.Generic;
using System.Text;

namespace Medico.Application.ViewModels
{
    public class CareTeamViewModel

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
        public string Name { get; set; }
    }

    public class CareTeamAdditionalInformationViewModel
    {
        public int NPI { get; set; }  
        public string ProviderLastName { get; set; }
        public string ProviderMiddleName { get; set; }
        public string ProviderFirstName { get; set; }
        public string PhoneNumber { get; set; }
        public string FaxNumber { get; set; }
        public string Email { get; set; }
        public string UrlForWebsite { get; set; }

        
        public string TaxonomyCode1 { get; set; }
        public string Taxonomy1 { get; set; }
        public string LicenseNumber1 { get; set; }
        public string TaxonomyCode2 { get; set; }
        public string Taxonomy2 { get; set; }
        public string LicenseNumber2 { get; set; }
        public string TaxonomyCode3 { get; set; }
        public string Taxonomy3 { get; set; }
        public string LicenseNumber3 { get; set; }
        public string TaxonomyCode4 { get; set; }
        public string Taxonomy4 { get; set; }
        public string LicenseNumber4 { get; set; }

        public string EnumerationDate { get; set; }
        public string EntityType { get; set; }
        public string PracticeLocationAddress { get; set; }
        public string PracticeLocationAddressCityName { get; set; }
        public string PracticeLocationAddressStateName { get; set; }
        public string PracticeLocationAddressPostalCode { get; set; }

        public string Note { get; set; }
    }

    public class CareTeamProviderModel
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public int Type { get; set; }
    }   
}

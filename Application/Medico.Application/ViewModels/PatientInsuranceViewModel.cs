using System;
using System.ComponentModel.DataAnnotations;
using Medico.Application.ViewModels.Patient;

namespace Medico.Application.ViewModels
{
    public class PatientInsuranceViewModel : PatientVm
    {
        [Required] public Guid PatientId { get; set; }
       
        public string MRN { get; set; }
        public string FIN { get; set; }
        public Guid PrimaryInsuranceCompany { get; set; }
        public Guid SecondaryInsuranceCompany { get; set; }
        public string PrimaryInsuranceGroupNumber { get; set; }
        public string SecondaryInsuranceGroupNumber { get; set; }
        public string PrimaryInsuranceNumber { get; set; }
        public string SecondaryInsuranceNumber { get; set; }

        public Guid? ProviderId { get; set; }
        public Guid? maId { get; set; }

        public string GetByKey(string part, string key)
        {
            if(part == "primary")
            {
                if (key == "insuranceCompany")
                {
                    return (this.PrimaryInsuranceCompany != null ? this.PrimaryInsuranceCompany.ToString() : "");
                }

                if (key == "insuranceGroupNumber")
                {
                    return (this.PrimaryInsuranceGroupNumber != null ? this.PrimaryInsuranceGroupNumber : "");
                }

                if (key == "insuranceNumber")
                {
                    return (this.PrimaryInsuranceNumber != null ? this.PrimaryInsuranceNumber : "") ;
                }
            }

            if (part == "secondary")
            {
                if (key == "insuranceCompany")
                {
                    return (this.SecondaryInsuranceCompany != null ? this.SecondaryInsuranceCompany.ToString() : "");
                }

                if (key == "insuranceGroupNumber")
                {
                    return (this.SecondaryInsuranceGroupNumber != null ? this.SecondaryInsuranceGroupNumber : "");
                }

                if (key == "insuranceNumber")
                {
                    return (this.SecondaryInsuranceNumber != null ? this.SecondaryInsuranceNumber : "");
                }
            }

            return "";
        }
    }
}
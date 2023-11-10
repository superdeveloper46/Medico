using System;
using System.ComponentModel.DataAnnotations;
using Medico.Application.DataAnnotation;
using Medico.Domain.Enums;

namespace Medico.Application.ViewModels.Patient
{
    public class PatientVmExtra : PatientVm
    {
        public string Physician { get; set; }
        public string ApptDate { get; set; }
        public string ApptTime { get; set; }
        public string StateName { get; set; }
        public string Allegations { get; set; }
        public string ExamLocation { get; set; }
        public string DocumentId { get; set; }
    }

    public class PatientVm : BaseViewModel
    {
        [Required] public Guid CompanyId { get; set; }
        
        [Required] public string FirstName { get; set; }
        
        [Required] public string LastName { get; set; }

        public string NameSuffix { get; set; }
        
        public string MiddleName { get; set; }
        
        [Required] public int Gender { get; set; }
        
        [Required] public DateTime DateOfBirth { get; set; }

        [Required] public int MaritalStatus { get; set; }
        
        [Required] public string Ssn { get; set; }
        
        [Required] public string PrimaryAddress { get; set; }
        
        public string SecondaryAddress { get; set; }
        
        [Required] public string City { get; set; }
        
        [Required] public string PrimaryPhone { get; set; }
        
        public string SecondaryPhone { get; set; }
        
        [NonRequiredEmailAddress] public string Email { get; set; }
        
        [Required] public string Zip { get; set; }
        
        [Required] public ZipCodeType ZipCodeType { get; set; }
        
        [Required] public int State { get; set; }

        public Guid? PatientInsuranceId { get; set; }
        
        public string Notes { get; set; }
        
        public string Password { get; set; }
        public string Rqid { get; set; }
        public string CaseNumber { get; set; }
        public string Mrn { get; set; }
        public string FIN { get; set; }
        public string PatientCommunicationMethod { get; set; }
        public DateTime AdmissionDate { get; set; }

        public DateTime? AccessedAt { get; set; }
        public string GetByKey(string key)
        {
            if (key == "firstName")
            {
                return (this.FirstName != null ? this.FirstName : "");
            }

            if (key == "lastName")
            {
                return (this.LastName != null ? this.LastName : "");
            }

            if (key == "middleName")
            {
                return (this.MiddleName != null ? this.MiddleName : "");
            }

            if (key == "nameSuffix")
            {
                return (this.NameSuffix != null ? this.NameSuffix : "");
            }

            if (key == "dateOfBirth")
            {
                return (this.DateOfBirth != null ? this.DateOfBirth.ToString() : "");
            }

            if (key == "gender")
            {
                return (this.Gender != null ? this.Gender.ToString() : "");
            }

            if (key == "maritalStatus")
            {
                return (this.MaritalStatus != null ? this.MaritalStatus.ToString() : "");
            }

            if (key == "sSN")
            {
                return (this.Ssn != null ? this.Ssn : "");
            }

            if (key == "patientCommunicationMethodArray")
            {
                return "";
            }

            if (key == "primaryAddress")
            {
                return (this.PrimaryAddress != null ? this.PrimaryAddress : "");
            }

            if (key == "email")
            {
                return (this.Email != null ? this.Email : "");
            }

            if (key == "secondaryAddress")
            {
                return (this.SecondaryAddress != null ? this.SecondaryAddress : "");
            }

            if (key == "primaryPhone")
            {
                return (this.PrimaryPhone != null ? this.PrimaryPhone : "");
            }

            if (key == "secondaryPhone")
            {
                return (this.SecondaryPhone != null ? this.SecondaryPhone : "");
            }

            if (key == "city")
            {
                return (this.City != null ? this.City : "");
            }

            if (key == "zipCodeType")
            {
                return (this.ZipCodeType != null ? this.ZipCodeType.ToString() : "");
            }

            if (key == "pharmacyInformation")
            {
                return "";
            }

            if (key == "primaryInsuranceInformation")
            {
                return "";
            }

            if (key == "zip")
            {
                return (this.Zip != null ? this.Zip : "");
            }

            if (key == "state")
            {
                return (this.State != null ? this.State.ToString() : "");
            }

            if (key == "secondaryInsuranceInformation")
            {
                return "";
            }

            if (key == "caseNumber")
            {
                return (this.CaseNumber != null ? this.CaseNumber : "");
            }

            if (key == "mRN")
            {
                return (this.Mrn != null ? this.Mrn : "");
            }

            if (key == "fIN")
            {
                return (this.FIN != null ? this.FIN : "");
            }
            
            return "";
        }

        public int Age()
        {
            var today = DateTime.Today;
            var age = today.Year - this.DateOfBirth.Year;
            var monthDiff = today.Month - this.DateOfBirth.Month;
            var dayDiff = today.Day - this.DateOfBirth.Day;

            if (dayDiff < 0)
            {
                monthDiff--;
            }
            if (monthDiff < 0)
            {
                age--;
            }

            return age;
        }
    }
}
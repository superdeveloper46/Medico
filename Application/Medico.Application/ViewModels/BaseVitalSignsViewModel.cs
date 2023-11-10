using System;
using System.ComponentModel.DataAnnotations;

namespace Medico.Application.ViewModels
{
    public class BaseVitalSignsViewModel : BaseViewModel
    {
        [Required]
        public Guid PatientId { get; set; }

        public string DominantHand { get; set; }

        public double? Weight { get; set; }

        public double? Height { get; set; }

        public double? LeftBicep { get; set; }

        public double? RightBicep { get; set; }

        public double? LeftForearm { get; set; }

        public double? RightForearm { get; set; }

        public double? LeftThigh { get; set; }

        public double? RightThigh { get; set; }

        public double? LeftCalf { get; set; }

        public double? RightCalf { get; set; }

        public string OxygenUse { get; set; }

        public double? OxygenAmount { get; set; }

        public double? HeadCircumference { get; set; }
        public string CreatedBy { get; set; }
        public DateTime? CreatedOn { get; set; }

        public string GetByKey(string key, string subkey)
        {
            if (key == "weight,Lbs")
            {
                return (this.Weight != null ? this.Weight.ToString() : "");
            }

            if (key == "height,Inches")
            {
                return (this.Height != null ? this.Height.ToString() : "");
            }

            if (key == "dominantHand")
            {
                return (this.DominantHand != null ? this.DominantHand : "");
            }

            if (key == "right")
            {
                if(subkey == "bicep,Cm")
                {
                    return (this.RightBicep != null ? this.RightBicep.ToString() : "");
                }

                if (subkey == "forearm,Cm")
                {
                    return (this.RightForearm != null ? this.RightForearm.ToString() : "");
                }

                if (subkey == "thigh,Cm")
                {
                    return (this.RightThigh != null ? this.RightThigh.ToString() : "");
                }

                if (subkey == "calf,Cm")
                {
                    return (this.RightCalf != null ? this.RightCalf.ToString() : "");
                }

            }

            if (key == "left")
            {
                if (subkey == "bicep,Cm")
                {
                    return (this.LeftBicep != null ? this.LeftBicep.ToString() : "");
                }

                if (subkey == "forearm,Cm")
                {
                    return (this.LeftForearm != null ? this.LeftForearm.ToString() : "");
                }

                if (subkey == "thigh,Cm")
                {
                    return (this.LeftThigh != null ? this.LeftThigh.ToString() : "");
                }

                if (subkey == "calf,Cm")
                {
                    return (this.LeftCalf != null ? this.LeftCalf.ToString() : "");
                }

            }

            if (key == "isOxygenUse")
            {
                return (this.OxygenUse!= null ? this.OxygenUse : "");
            }

            return "";
        }
    }
}
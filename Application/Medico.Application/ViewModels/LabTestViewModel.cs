using System;

namespace Medico.Application.ViewModels
{
    public class LabTestViewModel : BaseViewModel
    {
        public string Section { get; set; }
        public string CodeType { get; set; }
        public string Code { get; set; }
        public string Code_Desc { get; set; }
        public string Category { get; set; }
        public decimal TestFee { get; set; }
        public bool InHouse { get; set; }
        public string Notes { get; set; }
        public DateTime? LasteditDateTime { get; set; }
        public Guid? LasteditEmpId { get; set; }
        public bool Active { get; set; }
        public string AVID { get; set; }
        public int? VendorId { get; set; }
    }

    public class LabTestGrouped
    {
        public string Code_Desc { get; set; }
        public int Count { get; set; }
    }

    public class LabTestFee
    {
        public decimal TestFee { get; set; }
    }

    public class LabTest1 : LabTestViewModel
    {
        public string VendorName { get; set; }
    }

}

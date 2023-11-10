using System;
namespace Medico.Domain.Models
{
    public class Medico_Orders : Entity
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
}

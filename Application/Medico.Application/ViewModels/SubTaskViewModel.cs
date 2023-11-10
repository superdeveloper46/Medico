using System;
using System.Collections.Generic;

namespace Medico.Application.ViewModels
{
    public class SubTaskInputModel
    {
        public String Id {get; set;}
        public string TaskTypeId { get; set; }
        public string Title { get; set; }
        public DateTime CreateDate { get; set; }
        public string Description { get; set; }
        public DateTime DueDate { get; set; }
        public string Priority { get; set; }
        public int NotificationId { get; set; }
        public string NotificationStatus { get; set; }
        public string PatientOrderId { get; set; }
        public string[] UserIds { get; set; }
    }

    public class SubTaskViewModel: BaseViewModel
    {
        public string TaskTypeId { get; set; }
        public string Title { get; set; }
        public DateTime CreateDate { get; set; }
        public string Description { get; set; }
        public string ReporterId { get; set; }
        public DateTime DueDate { get; set; }
        public int NotificationId { get; set; }
        public string CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public string Status { get; set; }
        public string NotificationStatus { get; set; }
        public string PatientOrderId { get; set; }
        public string Priority { get; set; }
        public IEnumerable<SubTaskUserViewModel> SubTaskUsers { get; set; }
    }
}

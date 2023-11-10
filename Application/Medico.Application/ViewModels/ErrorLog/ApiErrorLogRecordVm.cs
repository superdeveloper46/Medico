using System;

namespace Medico.Application.ViewModels.ErrorLog
{
    public class ApiErrorLogRecordVm : BaseViewModel
    {
        public DateTime Date { get; set; }
        
        public string RequestedUrl { get; set; }
        
        public string ErrorType { get; set; }

        public string UserName { get; set; }

        public string UserFriendlyErrorText { get; set; }

        public string ErrorAppType { get; set; }

        public string ErrorAppForm { get; set; }
        
        public string AdminErrorText { get; set; }
        
        public string ErrorDetails { get; set; }

        public string Status { get; set; }
    }
}
using System.ComponentModel.DataAnnotations;
using Medico.Domain.Enums;

namespace Medico.Application.ViewModels
{
    public class HolidayHourViewModel : BaseActiveCompanyRelatedViewModel
    {
        [Required]
        public string Date { get; set; }

        [Required]
        public string Status { get; set; }

        [Required]
        public string Type { get; set; }

        [Required]
        public string StartAt { get; set; }

        [Required]
        public string EndAt { get; set; }
    }
}

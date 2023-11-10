using System.ComponentModel.DataAnnotations;
using Medico.Domain.Enums;

namespace Medico.Application.ViewModels
{
    public class AppointmentStatusColorViewModel : BaseActiveCompanyRelatedViewModel
    {
        [Required]
        public string Status { get; set; }

        [Required]
        public string Color { get; set; }
    }
}

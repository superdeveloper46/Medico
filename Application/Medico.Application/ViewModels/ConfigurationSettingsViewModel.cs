using System.ComponentModel.DataAnnotations;
using Medico.Domain.Enums;
using System;

namespace Medico.Application.ViewModels
{
    public class ConfigurationSettingsViewModel : BaseActiveCompanyRelatedViewModel
    {
        [Required]
        public Guid Id { get; set; }

        [Required]
        public string ItemId { get; set; }

        [Required]
        public string FieldName { get; set; }

        [Required]
        public string Value { get; set; }
    }
}

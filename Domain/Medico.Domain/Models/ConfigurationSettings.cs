using System;
using System.Collections.Generic;
using Medico.Domain.Enums;

namespace Medico.Domain.Models
{
    public class ConfigurationSettings : Entity
    {
        public string ItemId { get; set; }
        public string FieldName { get; set; }
        public string Value { get; set; }
    }
}

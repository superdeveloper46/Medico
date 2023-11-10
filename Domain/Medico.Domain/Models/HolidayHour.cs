using System;
using System.Collections.Generic;
using Medico.Domain.Enums;

namespace Medico.Domain.Models
{
    public class HolidayHour : Entity
    {
        public string Date { get; set; }

        public string Status { get; set; }

        public string Type { get; set; }

        public string StartAt { get; set; }

        public string EndAt { get; set; }
    }
}

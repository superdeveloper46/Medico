using System;
using System.Collections.Generic;
using Medico.Domain.Enums;

namespace Medico.Domain.Models
{
    public class AppointmentStatusColor : Entity
    {
        public string Status { get; set; }

        public string Color { get; set; }
    }
}

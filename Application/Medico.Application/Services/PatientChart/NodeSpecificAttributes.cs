using System;

namespace Medico.Application.Services.PatientChart
{
    public class NodeSpecificAttributes
    {
        public Guid? TemplateId { get; set; }

        public Guid? TemplateTypeId { get; set; }

        public string editStatus { get; set; } = "NC";
    }
}
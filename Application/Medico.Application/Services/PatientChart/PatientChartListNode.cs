using System;
using System.Collections.Generic;
using Medico.Application.ViewModels.Template;

namespace Medico.Application.Services.PatientChart
{
    public class PatientChartListNode
    {
        public Guid Id { get; set; }

        public string Name { get; set; }

        public string Title { get; set; }

        public static PatientChartListNode CreatePatientChartListNodeFromNode(PatientChartNode node)
        {
            
            return new PatientChartListNode
            {
                Id = node.Id,
                Name = node.Name,
                Title = node.Title
            };
        }
    }
}
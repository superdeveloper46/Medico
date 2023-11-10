using Medico.Domain.Models;

namespace Medico.Application.Services.PatientChart
{
    public class PatientChartNodeAttributes
    {
        public int? Order { get; set; }

        public bool IsActive { get; set; }

        public bool IsPredefined { get; set; }

        public bool IsNotShownInReport { get; set; }

        public bool SignedOffOnly { get; set; }

        public string AuditRequired { get; set; }

        public string[] ResponsibleEmployeeTypes { get; set; }

        public ChartColor ChartColors { get; set; }

        public bool CanSelectMV { get; set; }

        public string ModelViewDataType { get; set; }

        public bool CanSearch { get; set; }

        public string DataRegex { get; set; }

        public string DataLength { get; set; }

        public string DataType { get; set; }

        public NodeSpecificAttributes NodeSpecificAttributes { get; set; } = new NodeSpecificAttributes();

        public static PatientChartNodeAttributes CreatePatientChartNodeAttributes(int? order,
            bool isActive, bool isNotShownInReport,
            bool signedOffOnly, bool isPredefined, string[] responsibleEmployee , ChartColor colors, string auditRequired, dynamic nodeSpecificAttributes = null)
        {
            var patientChartNodeAttributes = new PatientChartNodeAttributes
            {
                Order = order,
                IsPredefined = isPredefined,
                IsActive = isActive,
                IsNotShownInReport = isNotShownInReport,
                SignedOffOnly = signedOffOnly,
                NodeSpecificAttributes = nodeSpecificAttributes == null ? new { } : nodeSpecificAttributes,
                ChartColors = colors,
                AuditRequired = auditRequired,
                ResponsibleEmployeeTypes = responsibleEmployee
            };

            return patientChartNodeAttributes;
        }
    }
}
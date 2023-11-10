using System.Collections.Generic;
using System.Linq;
using Medico.Application.SelectableItemsManagement;
using Medico.Application.ViewModels.Admission;
using Medico.Application.ViewModels.Patient;
using Newtonsoft.Json.Linq;

namespace Medico.Application.ViewModels.ExpressionExecution
{
    public class ExpressionExecutionContextVm
    {
        public FullAdmissionInfoVm Admission { get; set; }
        public List<VitalSignsViewModel> VitalSigns { get; set; }
        public IQueryable<MedicationPrescriptionViewModel> MedicationPrescriptions { get; set; }

        public PatientVm Patient { get; set; }
        
        public BaseVitalSignsViewModel BaseVitalSigns { get; set; }
        
        public SelectableVariables SelectableVariables { get; set; }

        public IDictionary<string, JObject[]> ReferenceTables { get; set; }

        public BloodPressureViewModel? BloodPressure { get; set; }

        public TmvPatientHistory PatientHistory { get; set; }

        public IQueryable<MedicationPrescriptionViewModel> Prescriptions { get; set; }

        public PatientInsuranceViewModel PatientInsurance { get; set; }

        public IQueryable<TmvAssessment> AssessmentsAll { get; set; }
        public IQueryable<TmvAssessment> AssessmentsCurrent { get; set; }

        public IQueryable<MedicoApplicationUserViewModel> Providers { get; set; }

        public IQueryable<CareTeamViewModel> CareTeams { get; set; }

        public IQueryable<TmvChiefComplaint> ChiefComplaints { get; set; }

        public Dictionary<string, JObject> Expressions { get; set; }

        public IQueryable<PatientAppointmentVm> Appointments { get; set; }

    }
}
using System;
using System.Collections.Generic;
using System.Linq;
using Medico.Application.SelectableItemsManagement;
using Medico.Application.ViewModels.Patient;
using Newtonsoft.Json.Linq;

namespace Medico.Application.ViewModels.ExpressionExecution
{

    public class TmvPatientHistory
    {
        //public IQueryable<TmvMedicalRecordReview> PatientMedicalRecords { get; set; }
        public IQueryable<MedicalRecordViewModel> PatientMedicalRecords { get; set; }
        

        public IQueryable<TobaccoHistoryViewModel> TobaccoHistory { get; set; }

        public IQueryable<DrugHistoryViewModel> DrugHistory { get; set; }

        public IQueryable<AlcoholHistoryViewModel> AlcoholHistory { get; set; }

        public IQueryable<MedicalHistoryViewModel> PreviousMedicalHistory { get; set; }

        public IQueryable<SurgicalHistoryViewModel> PreviousSurgicalHistory { get; set; }

        public IQueryable<FamilyHistoryViewModel> FamilyHistory { get; set; }

        public IQueryable<EducationHistoryViewModel> EducationHistory { get; set; }

        public IQueryable<OccupationalHistoryViewModel> OccupationalHistory { get; set; }

        public IQueryable<AllergyViewModel> Allergies { get; set; }

        public IQueryable<MedicationHistoryViewModel> Medications { get; set; }
    }

    public class TmvAssessment
    {
        public Guid Id { get; set; }
        public int Order { get; set; }
        public Guid IcdCode { get; set; }
        public string Diagnosis { get; set; }
        public string Points { get; set; }
        public string Status { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Notes { get; set; }
        public string Employee { get; set; }

        public static TmvAssessment Create(JToken assessmentData)
        {
            TmvAssessment retTmvAssessment = new TmvAssessment();

            if (assessmentData["id"] != null && !String.IsNullOrEmpty(assessmentData["id"].ToString()))
            {
                retTmvAssessment.Id = Guid.Parse(assessmentData["id"].ToString());
            }

            if (assessmentData["order"] != null && !String.IsNullOrEmpty(assessmentData["order"].ToString()))
            {
                retTmvAssessment.Order = (int)assessmentData["order"];
            }

            if (assessmentData["icdCode"] != null && !String.IsNullOrEmpty(assessmentData["icdCode"].ToString()))
            {
                retTmvAssessment.IcdCode = Guid.Parse(assessmentData["icdCode"].ToString());
            }

            if (assessmentData["diagnosis"] != null && !String.IsNullOrEmpty(assessmentData["diagnosis"].ToString()))
            {
                retTmvAssessment.Diagnosis = assessmentData["diagnosis"].ToString();
            }

            if (assessmentData["points"] != null && !String.IsNullOrEmpty(assessmentData["points"].ToString()))
            {
                retTmvAssessment.Points = assessmentData["points"].ToString();
            }

            if (assessmentData["status"] != null && !String.IsNullOrEmpty(assessmentData["status"].ToString()))
            {
                retTmvAssessment.Status = assessmentData["status"].ToString();
            }

            if (assessmentData["startDate"] != null && !String.IsNullOrEmpty(assessmentData["startDate"].ToString()))
            {
                retTmvAssessment.StartDate = DateTime.Parse(assessmentData["startDate"].ToString());
            }

            if (assessmentData["endDate"] != null && !String.IsNullOrEmpty(assessmentData["endDate"].ToString()))
            {
                retTmvAssessment.EndDate = DateTime.Parse(assessmentData["endDate"].ToString());
            }

            if (assessmentData["notes"] != null && !String.IsNullOrEmpty(assessmentData["notes"].ToString()))
            {
                retTmvAssessment.Notes = assessmentData["notes"].ToString();
            }

            if (assessmentData["employee"] != null && !String.IsNullOrEmpty(assessmentData["employee"].ToString()))
            {
                retTmvAssessment.Employee = assessmentData["employee"].ToString();
            }

            return retTmvAssessment;
        }
    }

    public class TmvChiefComplaint
    {
        public Guid Id { get; set; }
        public string Allegations { get; set; }
        
        public string Points { get; set; }

        public string Status { get; set; }
        public static TmvChiefComplaint Create(JToken chiefComplaintData)
        {
            TmvChiefComplaint retTmvChiefComplaint = new TmvChiefComplaint();

            if (chiefComplaintData["id"] != null && !String.IsNullOrEmpty(chiefComplaintData["id"].ToString()))
            {
                retTmvChiefComplaint.Id = Guid.Parse(chiefComplaintData["id"].ToString());
            }

            if (chiefComplaintData["allegations"] != null && !String.IsNullOrEmpty(chiefComplaintData["allegations"].ToString()))
            {
                retTmvChiefComplaint.Allegations = chiefComplaintData["allegations"].ToString();
            }

            if (chiefComplaintData["points"] != null && !String.IsNullOrEmpty(chiefComplaintData["points"].ToString()))
            {
                retTmvChiefComplaint.Points = chiefComplaintData["points"].ToString();
            }

            if (chiefComplaintData["status"] != null && !String.IsNullOrEmpty(chiefComplaintData["status"].ToString()))
            {
                retTmvChiefComplaint.Status = chiefComplaintData["status"].ToString();
            }

            return retTmvChiefComplaint;
        }
    }
}
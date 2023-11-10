﻿using AutoMapper;
using Medico.Application.Extensions;
using Medico.Application.PatientIdentificationCodes.ViewModels;
using Medico.Application.ViewModels;
using Medico.Application.ViewModels.Admission;
using Medico.Application.ViewModels.Company;
using Medico.Application.ViewModels.ErrorLog;
using Medico.Application.ViewModels.Expression;
using Medico.Application.ViewModels.Patient;
using Medico.Application.ViewModels.PatientChartDocument;
using Medico.Application.ViewModels.Phrase;
using Medico.Application.ViewModels.ReferenceTable;
using Medico.Application.ViewModels.SelectableList;
using Medico.Application.ViewModels.SelectableListCategory;
using Medico.Application.ViewModels.Template;
using Medico.Application.ViewModels.TemplateType;
using Medico.Domain.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace Medico.Application.AutoMapper
{
    public class ViewModelToDomainMappingProfile : Profile
    {
        private readonly JsonSerializerSettings _jsonSerializerSettings = new JsonSerializerSettings
        {
            ContractResolver = new CamelCasePropertyNamesContractResolver()
        };

        public ViewModelToDomainMappingProfile()
        {
            CreateMap<CompanyVm, Company>();
            CreateMap<LocationViewModel, Location>();
            CreateMap<RoomViewModel, Room>();
            CreateMap<LocationRoomViewModel, LocationRoom>();
            CreateMap<MedicoApplicationUserViewModel, MedicoApplicationUser>();
            CreateMap<SelectableListCategoryVm, SelectableListCategory>();
            CreateMap<SelectableListVm, SelectableList>()
                .ForMember(d => d.JsonValues,
                    opt =>
                        opt.MapFrom(s => JsonConvert.SerializeObject(s.SelectableListValues, _jsonSerializerSettings)));

            CreateMap<CategorySelectableListVm, CategorySelectableList>();
            CreateMap<TemplateTypeVm, TemplateType>();

            CreateMap<TemplateVm, Template>()
                .ForMember(d => d.TargetTemplates,
                    opt => opt.Ignore());

            CreateMap<ChiefComplaintViewModel, ChiefComplaint>();
            CreateMap<ChiefComplaintKeywordViewModel, ChiefComplaintKeyword>();

            CreateMap<PatientVm, Patient>()
                .ForMember(d => d.SecurityHash,
                    opt => opt.MapFrom(s => s.Password.Encrypt()));

            CreateMap<PatientInsuranceViewModel, PatientInsurance>();

            CreateMap<AppointmentViewModel, Appointment>()
                .ForMember(d => d.PatientChartDocumentNodes,
                    opt => opt.Ignore());

            CreateMap<AdmissionVm, Admission>()
                .ForMember(d =>d.ModifiedDate, opt => opt.MapFrom(s => s.ModifiedDate.ToString("yyyy-MM-dd HH:mm:ss")));
            CreateMap<SignatureInfoViewModel, SignatureInfo>();
            CreateMap<TobaccoHistoryViewModel, TobaccoHistory>();
            CreateMap<DrugHistoryViewModel, DrugHistory>();
            CreateMap<AlcoholHistoryViewModel, AlcoholHistory>();
            CreateMap<MedicalHistoryViewModel, MedicalHistory>();
            CreateMap<SurgicalHistoryViewModel, SurgicalHistory>();
            CreateMap<FamilyHistoryViewModel, FamilyHistory>();
            CreateMap<EducationHistoryViewModel, EducationHistory>();
            CreateMap<OccupationalHistoryViewModel, OccupationalHistory>();
            CreateMap<AllergyViewModel, Allergy>();
            CreateMap<MedicationHistoryViewModel, MedicationHistory>();
            CreateMap<MedicalRecordViewModel, MedicalRecord>();
            CreateMap<VitalSignsViewModel, VitalSigns>();
            CreateMap<BaseVitalSignsViewModel, BaseVitalSigns>();
            CreateMap<DocumentViewModel, Document>();
            CreateMap<MedicationPrescriptionViewModel, MedicationPrescription>();
            CreateMap<MedicationsUpdateItemViewModel, MedicationsUpdateItem>();
            CreateMap<VisionVitalSignsViewModel, VisionVitalSigns>();
            CreateMap<AllegationsNotesStatusViewModel, AllegationsNotesStatus>();
            CreateMap<NotificationViewModel, Notification>();
            CreateMap<PatientOrderItemModel, PatientOrderItem>();
            CreateMap<VendorDataViewModel, VendorData>();
            #region phrases

            CreateMap<Phrase, PhraseVm>().ReverseMap();

            #endregion

            CreateMap<VitalSignsNotesViewModel, VitalSignsNotes>();

            CreateMap<PatientChartDocumentNode, PatientChartDocumentVersionVm>()
                .ForMember(d => d.LibraryPatientChartDocumentNodeVersion,
                    opt =>
                        opt.MapFrom(s => s.LibraryPatientChartDocumentNode != null
                            ? s.LibraryPatientChartDocumentNode.Version
                            : null));

            CreateMap<ReferenceTableVm, ReferenceTable>()
                .ForMember(d => d.Data,
                    opt =>
                        opt.MapFrom(s => JsonConvert.SerializeObject(s.Data, _jsonSerializerSettings)));

            CreateMap<ExpressionVm, Expression>();
            CreateMap<CreateUpdateExpressionVm, Expression>();

            CreateMap<PatientIdentificationCodeVm, PatientIdentificationCode>();
            CreateMap<InsuranceCompanyViewModel, InsuranceCompany>();
            CreateMap<LabTestViewModel, Medico_Orders>();
            CreateMap<PatientOrderViewModel, PatientOrder>();

            CreateMap<PhraseCategoryViewModel, PhraseCategory>();

            CreateMap<VitalSignsLookUpViewModel, VitalSignsLookUp>();


            CreateMap<PreAuthDataViewModel, PreAuthData>();

            CreateMap<ProblemListViewModel, ProblemList>();

            CreateMap<BaseVitalSignsViewModel, BaseVitalSignsHistory>();

            CreateMap<SubTaskViewModel, SubTask>();
            CreateMap<SubTaskUserViewModel, SubTaskUser>();

            CreateMap<ChartColorViewModel, ChartColor>();

            CreateMap<BusinessHourViewModel, BusinessHour>();
            CreateMap<HolidayHourViewModel, HolidayHour>();
            CreateMap<AppointmentStatusColorViewModel, AppointmentStatusColor>();
            CreateMap<ConfigurationSettingsViewModel, ConfigurationSettings>();
        }
    }
}

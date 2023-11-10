using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using HtmlAgilityPack;
using Medico.Application.Interfaces;
using Medico.Application.Services.PatientChart;
using Medico.Application.ViewModels;
using Medico.Application.ViewModels.Admission;
using Medico.Application.ViewModels.Patient;
using Medico.Application.ViewModels.PatientChart;
using Medico.Application.ViewModels.PatientChartDocument;
using Medico.Domain.Interfaces;
using Medico.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;

namespace Medico.Application.Services
{
    public class PatientChartService : IPatientChartService
    {
        private const string RootNodeName = "patientChart";
        private const string RootNodeTitle = "Patient Chart";

        private const string PatientChartIdAttrName = "mv-id";
        private const string IdAttrName = "id";
        private const string PatientChartItemTagName = "label";

        private const string DetailedContentContainerId = "detailed-content-container";

        private readonly string _htmlDocumentFormat =
            $@"<!doctype html>
                <html>
                    <body>
                        <div id=""{DetailedContentContainerId}"">{{0}}</div>
                    </body>
                </html>";

        private readonly IPatientChartDocumentNodeRepository _patientChartDocumentNodeRepository;
        private readonly IUnitOfWork _unitOfWork;

        private IAdmissionService _admissionService;
        private readonly IPatientService _patientService;
        private readonly IPatientInsuranceService _patientInsuranceService;
        private readonly IMedicalRecordService _medicalRecordService;
        private readonly ITobaccoHistoryService _tobaccoHistoryService;
        private readonly IDrugHistoryService _drugHistoryService;
        private readonly IAlcoholHistoryService _alcoholHistoryService;
        private readonly IMedicalHistoryService _medicalHistoryService;
        private readonly ISurgicalHistoryService _surgicalHistoryService;
        private readonly IFamilyHistoryService _familyHistoryService;
        private readonly IEducationHistoryService _educationHistoryService;
        private readonly IOccupationalHistoryService _occupationalHistoryService;
        private readonly IAllergyService _allergyService;
        private readonly IMedicationHistoryService _medicationHistoryService;
        private readonly IBaseVitalSignsService _baseVitalSignsService;
        private readonly IVitalSignsService _vitalSignsService;
        private readonly IVisionVitalSignsService _visionVitalSignsService;
        private readonly IMedicationPrescriptionService _medicationPrescriptionService;

        private readonly JsonSerializerSettings _jsonSerializerSettings = new JsonSerializerSettings
        {
            ContractResolver = new CamelCasePropertyNamesContractResolver()
        };

        public PatientChartService(IPatientChartDocumentNodeRepository patientChartDocumentNodeRepository,
            IUnitOfWork unitOfWork,
            IPatientService patientService,
            IPatientInsuranceService patientInsuranceService,
            IMedicalRecordService medicalRecordService,
            ITobaccoHistoryService tobaccoHistoryService,
            IDrugHistoryService drugHistoryService,
            IAlcoholHistoryService alcoholHistoryService,
            IMedicalHistoryService medicalHistoryService,
            ISurgicalHistoryService surgicalHistoryService,
            IFamilyHistoryService familyHistoryService,
            IEducationHistoryService educationHistoryService,
            IOccupationalHistoryService occupationalHistoryService,
            IAllergyService allergyService,
            IMedicationHistoryService medicationHistoryService,
            IBaseVitalSignsService baseVitalSignsService,
            IVitalSignsService vitalSignsService,
            IVisionVitalSignsService visionVitalSignsService,
            IMedicationPrescriptionService medicationPrescriptionService)
        {
            _patientChartDocumentNodeRepository = patientChartDocumentNodeRepository;
            _unitOfWork = unitOfWork;
            _patientService = patientService;
            _patientInsuranceService = patientInsuranceService;
            _medicalRecordService = medicalRecordService;
            _tobaccoHistoryService = tobaccoHistoryService;
            _drugHistoryService = drugHistoryService;
            _alcoholHistoryService = alcoholHistoryService;
            _medicalHistoryService = medicalHistoryService;
            _surgicalHistoryService = surgicalHistoryService;
            _familyHistoryService = familyHistoryService;
            _educationHistoryService = educationHistoryService;
            _occupationalHistoryService = occupationalHistoryService;
            _allergyService = allergyService;
            _medicationHistoryService = medicationHistoryService;
            _baseVitalSignsService = baseVitalSignsService;
            _vitalSignsService = vitalSignsService;
            _visionVitalSignsService = visionVitalSignsService;
            _medicationPrescriptionService = medicationPrescriptionService;
        }

        public async Task<PatientChartNode> GetByFilter(PatientChartDocumentFilterVm searchFilterVm)
        {
            var rootNodeId = Guid.NewGuid();
            var rootNode = new PatientChartNode
            {
                Id = rootNodeId,
                Name = RootNodeName,
                Title = RootNodeTitle,
                Type = PatientChartNodeType.RootNode,
                Attributes = new PatientChartNodeAttributes
                {
                    Order = 1,
                    IsActive = true,
                    IsPredefined = true
                },
                Children = new List<PatientChartNode>()
            };

            var patientChartDocumentsQuery = _patientChartDocumentNodeRepository
                .GetAll();

            var companyId = searchFilterVm.CompanyId;
            if (companyId == null)
                patientChartDocumentsQuery = patientChartDocumentsQuery
                    .Where(d => d.CompanyId == null);
            else
                patientChartDocumentsQuery = patientChartDocumentsQuery
                    .Where(d => d.CompanyId == companyId.Value);

            var restrictByPatientChartDocumentNodes =
                searchFilterVm.RestrictByPatientChartDocumentNodes;

            if (restrictByPatientChartDocumentNodes)
            {
                var patientChartDocumentNodeList =
                    searchFilterVm.PatientChartDocumentNodeList;
                
                if (!patientChartDocumentNodeList.Any())
                    return rootNode;
                
                patientChartDocumentsQuery = patientChartDocumentsQuery
                    .Where(d => patientChartDocumentNodeList.Contains(d.Id));
            }

            var companyDocumentNodes = await patientChartDocumentsQuery
                .ToListAsync();

            if (companyDocumentNodes.Count == 0)
                throw new InvalidOperationException("Company have to have at least one document node");
            try
            {
                companyDocumentNodes.ForEach(n =>
                {
                    var documentNode =
                        JsonConvert.DeserializeObject<PatientChartNode>(n.PatientChartDocumentNodeJsonString);

                    documentNode.ParentId = rootNodeId;

                    rootNode.Children.Add(documentNode);
                });
            }
            catch (Exception e)
            {

                throw e;
            }
           

            rootNode.Children =
                rootNode.Children.OrderBy(n => n.Attributes.Order)
                    .ToList();

            return rootNode;
        }

        public async Task<PatientChartNode> Update(PatientChartVm patientChartVm)
        {
            var patientChart = patientChartVm.PatientChart;
            var companyId = patientChartVm.CompanyId;

            var patientChartDocumentNodes =
                GetPatientChartDocumentNodes(patientChart).ToList();

            var existedPatientChartDocumentNodesQuery =
                _patientChartDocumentNodeRepository.GetAll();

            if (companyId == null)
                existedPatientChartDocumentNodesQuery = existedPatientChartDocumentNodesQuery
                    .Where(d => d.CompanyId == null);
            else
                existedPatientChartDocumentNodesQuery = existedPatientChartDocumentNodesQuery
                    .Where(d => d.CompanyId == companyId.Value);

            var existedPatientChartDocumentNodes =
                await existedPatientChartDocumentNodesQuery
                    .Include(d => d.LibraryPatientChartDocumentNodes)
                    .ToListAsync();

            var deletedDocuments =
                GetDeletedDocuments(patientChartDocumentNodes, existedPatientChartDocumentNodes);

            foreach (var deletedDocumentNode in deletedDocuments)
            {
                _patientChartDocumentNodeRepository.Remove(deletedDocumentNode.Id);

                var libraryRelatedPatientChartDocumentNodes
                    = deletedDocumentNode.LibraryPatientChartDocumentNodes;

                if (!libraryRelatedPatientChartDocumentNodes.Any())
                    continue;

                foreach (var relatedPatientChartDocumentNode in libraryRelatedPatientChartDocumentNodes)
                {
                    relatedPatientChartDocumentNode.LibraryPatientChartDocumentNodeId = null;
                    relatedPatientChartDocumentNode.Version = null;
                }
            }

            foreach (var patientChartDocumentNode in patientChartDocumentNodes)
            {
                var patientChartDocumentNodeId = patientChartDocumentNode.Id;

                var existedPatientChartDocumentNode = existedPatientChartDocumentNodes
                    .FirstOrDefault(node => node.Id == patientChartDocumentNodeId);

                if (existedPatientChartDocumentNode == null)
                    await AddNewPatientChartDocumentNode(patientChartDocumentNode, companyId);
                else
                    UpdatePatientChartDocumentNode(patientChartDocumentNode,
                        existedPatientChartDocumentNode, companyId, patientChartVm.PatientChartDocumentId);
            }

            await _unitOfWork.Commit();

            return patientChart;
        }

        private static IEnumerable<PatientChartNode> GetPatientChartDocumentNodes(PatientChartNode patientChart)
        {
            var patientChartChildrenNodes = patientChart.Children;
            var isAllPatientChartChildrenNodesOfDocumentNodeType =
                patientChartChildrenNodes.All(node => node.Type == PatientChartNodeType.DocumentNode);

            if (!isAllPatientChartChildrenNodesOfDocumentNodeType)
                throw new InvalidOperationException("Patient chart has to contain only document nodes");

            return patientChartChildrenNodes;
        }

        private static IEnumerable<PatientChartDocumentNode> GetDeletedDocuments(
            IList<PatientChartNode> newDocumentNodes,
            IEnumerable<PatientChartDocumentNode> existedDocumentNodes)
        {
            foreach (var existedDocumentNode in existedDocumentNodes)
            {
                var isDocumentDeleted =
                    newDocumentNodes.FirstOrDefault(newDocumentNode => newDocumentNode.Id == existedDocumentNode.Id) ==
                    null;

                if (isDocumentDeleted)
                    yield return existedDocumentNode;
            }
        }

        private async Task AddNewPatientChartDocumentNode(PatientChartNode patientChartDocumentNode, Guid? companyId)
        {
            var newPatientChartDocumentNode = new PatientChartDocumentNode
            {
                Id = patientChartDocumentNode.Id,
                Title = patientChartDocumentNode.Title,
                Name = patientChartDocumentNode.Name,
                Version = companyId == null ? (int?) 1 : null,
                CompanyId = companyId,
                PatientChartDocumentNodeJsonString =
                    JsonConvert.SerializeObject(patientChartDocumentNode, _jsonSerializerSettings)
            };

            await _patientChartDocumentNodeRepository.AddAsync(newPatientChartDocumentNode);
        }

        private void UpdatePatientChartDocumentNode(PatientChartNode patientChartNode,
            PatientChartDocumentNode patientChartDocumentNode,
            Guid? companyId,
            Guid? patientChartDocumentId = null)
        {
            patientChartDocumentNode.Name = patientChartNode.Name;
            patientChartDocumentNode.Title = patientChartNode.Title;
            patientChartDocumentNode.PatientChartDocumentNodeJsonString =
                JsonConvert.SerializeObject(patientChartNode, _jsonSerializerSettings);

            var isVersionUpdateNeeded = !companyId.HasValue && patientChartDocumentId.HasValue;
            if (isVersionUpdateNeeded)
                patientChartDocumentNode.Version += 1;
        }

        public async Task<List<PatientChartListNode>> GetAsList(PatientChartDocumentFilterVm searchFilterVm)
        {
            var nodeList = new List<PatientChartListNode>();

            var rootNodeId = Guid.NewGuid();
            var rootNode = new PatientChartNode
            {
                Id = rootNodeId,
                Name = RootNodeName,
                Title = RootNodeTitle,
                Type = PatientChartNodeType.RootNode,
                Attributes = new PatientChartNodeAttributes
                {
                    Order = 1,
                    IsActive = true,
                    IsPredefined = true
                },
                Children = new List<PatientChartNode>()
            };

            var patientChartDocumentsQuery = _patientChartDocumentNodeRepository
                .GetAll();

            var companyId = searchFilterVm.CompanyId;
            if (companyId == null)
                patientChartDocumentsQuery = patientChartDocumentsQuery
                    .Where(d => d.CompanyId == null);
            else
                patientChartDocumentsQuery = patientChartDocumentsQuery
                    .Where(d => d.CompanyId == companyId.Value);

            var restrictByPatientChartDocumentNodes =
                searchFilterVm.RestrictByPatientChartDocumentNodes;

            if (restrictByPatientChartDocumentNodes)
            {
                var patientChartDocumentNodeList =
                    searchFilterVm.PatientChartDocumentNodeList;

                if (!patientChartDocumentNodeList.Any())
                    return nodeList;

                patientChartDocumentsQuery = patientChartDocumentsQuery
                    .Where(d => patientChartDocumentNodeList.Contains(d.Id));
            }

            var companyDocumentNodes = await patientChartDocumentsQuery
                .ToListAsync();

            if (companyDocumentNodes.Count == 0)
                throw new InvalidOperationException("Company have to have at least one document node");

            companyDocumentNodes.ForEach(n =>
            {
                var documentNode =
                    JsonConvert.DeserializeObject<PatientChartNode>(n.PatientChartDocumentNodeJsonString);

                documentNode.ParentId = rootNodeId;

                rootNode.Children.Add(documentNode);
            });

            rootNode.Children =
                rootNode.Children.OrderBy(n => n.Attributes.Order)
                    .ToList();

            rootNode.Children.ForEach(n =>
            {
                nodeList = nodeList.Concat(LoopPatientChartNode("", n)).ToList();
            });

            return nodeList;
        }

        public List<PatientChartListNode> LoopPatientChartNode(string parentTitle, PatientChartNode currentPatientChartNode)
        {
            string newTitle = parentTitle + (parentTitle != "" ? "/" : "") + currentPatientChartNode.Title;
            List<PatientChartListNode> retPatientChartListNode = new List<PatientChartListNode>();

            if (currentPatientChartNode.Children == null || currentPatientChartNode.Children.Count == 0)
            {
                if (currentPatientChartNode.Attributes.IsActive == true)
                {
                    PatientChartListNode patientChartListNode = PatientChartListNode.CreatePatientChartListNodeFromNode(currentPatientChartNode);
                    patientChartListNode.Title = newTitle;
                    retPatientChartListNode.Add(patientChartListNode);
                }

            }
            else
            {
                currentPatientChartNode.Children.ForEach(n =>
                {
                    retPatientChartListNode = retPatientChartListNode.Concat(LoopPatientChartNode(newTitle, n)).ToList();
                });
            }

            return retPatientChartListNode;
        }

        public async Task<string> Expression(Guid patientChartId, Guid companyId, Guid admissionId)
        {
            var nodeList = new List<PatientChartListNode>();

            var rootNodeId = Guid.NewGuid();
            var rootNode = new PatientChartNode
            {
                Id = rootNodeId,
                Name = RootNodeName,
                Title = RootNodeTitle,
                Type = PatientChartNodeType.RootNode,
                Attributes = new PatientChartNodeAttributes
                {
                    Order = 1,
                    IsActive = true,
                    IsPredefined = true
                },
                Children = new List<PatientChartNode>()
            };

            var patientChartDocumentsQuery = _patientChartDocumentNodeRepository
                .GetAll();

            if (companyId == null)
                patientChartDocumentsQuery = patientChartDocumentsQuery
                    .Where(d => d.CompanyId == null);
            else
                patientChartDocumentsQuery = patientChartDocumentsQuery
                    .Where(d => d.CompanyId == companyId);

            var companyDocumentNodes = await patientChartDocumentsQuery
                .ToListAsync();

            if (companyDocumentNodes.Count == 0)
                throw new InvalidOperationException("Company have to have at least one document node");

            companyDocumentNodes.ForEach(n =>
            {
                var documentNode =
                    JsonConvert.DeserializeObject<PatientChartNode>(n.PatientChartDocumentNodeJsonString);

                documentNode.ParentId = rootNodeId;

                rootNode.Children.Add(documentNode);
            });

            rootNode.Children =
                rootNode.Children.OrderBy(n => n.Attributes.Order)
                    .ToList();

            string mvTitle = "";
            foreach(var n in rootNode.Children)
            {
                mvTitle = FindPatientChartNode("", patientChartId, n);
                if(mvTitle != null)
                {
                    break;
                }
            }

            return
                $"<{PatientChartItemTagName} {PatientChartIdAttrName}='{patientChartId}' {IdAttrName}='{Guid.NewGuid()}' contenteditable='false'>mv: {mvTitle}</{PatientChartItemTagName}>";

        }

        public string FindPatientChartNode(string parentTitle, Guid findChartId, PatientChartNode currentPatientChartNode)
        {
            string newTitle = parentTitle + (parentTitle != "" ? "/" : "") + currentPatientChartNode.Title;
            if ((currentPatientChartNode.Children == null || currentPatientChartNode.Children.Count == 0) && currentPatientChartNode.Id == findChartId)
            {
                return newTitle;
            }
            else if(currentPatientChartNode.Children != null)
            {
                foreach(var n in currentPatientChartNode.Children)
                {
                    string ret = FindPatientChartNode(newTitle, findChartId, n);
                    if(ret != null)
                    {
                        return ret;
                    }
                }
            }

            return null;
        }

        public async Task<string> calculateInTemplate(IAdmissionService admissionService, string templateContent, Guid admissionId, Guid patientId, Guid companyId)
        {
            _admissionService = admissionService;

            var htmlDocumentString = string.Format(_htmlDocumentFormat, templateContent);

            var rootDocument = new HtmlDocument();
            rootDocument.LoadHtml(htmlDocumentString);

            var selectableHtmlElementQuerySelector =
                $@"//{PatientChartItemTagName}[@{PatientChartIdAttrName}]";

            var patientChartNodes = rootDocument.DocumentNode.SelectNodes(selectableHtmlElementQuerySelector);
            if (patientChartNodes == null || !patientChartNodes.Any())
                return templateContent;

            string id = "";
            foreach(HtmlNode patientChartNode in patientChartNodes)
            {
                //patientChartNode.InnerHtml = await evaluateValueFromID(patientChartNode.Attributes[PatientChartIdAttrName].Value, admissionId, patientId, companyId);
                patientChartNode.InnerHtml = await evaluateValueFromID(patientChartNode.Attributes[PatientChartIdAttrName].Value, admissionId, Guid.Parse("65b750a9-954c-ec11-9820-00155dfa7393"), companyId);
            }

            return rootDocument.DocumentNode.SelectNodes($"//div[@id='{DetailedContentContainerId}']")[0].InnerHtml;

        }

        private async Task<string> evaluateValueFromID(string patientChartNodeId, Guid admissionId, Guid patientId, Guid companyId)
        {
            var rootNodeId = Guid.NewGuid();
            var rootNode = new PatientChartNode
            {
                Id = rootNodeId,
                Name = RootNodeName,
                Title = RootNodeTitle,
                Type = PatientChartNodeType.RootNode,
                Attributes = new PatientChartNodeAttributes
                {
                    Order = 1,
                    IsActive = true,
                    IsPredefined = true
                },
                Children = new List<PatientChartNode>()
            };

            var patientChartDocumentsQuery = _patientChartDocumentNodeRepository
                .GetAll();

            if (companyId == null)
                patientChartDocumentsQuery = patientChartDocumentsQuery
                    .Where(d => d.CompanyId == null);
            else
                patientChartDocumentsQuery = patientChartDocumentsQuery
                    .Where(d => d.CompanyId == companyId);

            var companyDocumentNodes = await patientChartDocumentsQuery
                .ToListAsync();

            if (companyDocumentNodes.Count == 0)
                throw new InvalidOperationException("Company have to have at least one document node");

            companyDocumentNodes.ForEach(n =>
            {
                var documentNode =
                    JsonConvert.DeserializeObject<PatientChartNode>(n.PatientChartDocumentNodeJsonString);

                documentNode.ParentId = rootNodeId;

                rootNode.Children.Add(documentNode);
            });

            rootNode.Children =
                rootNode.Children.OrderBy(n => n.Attributes.Order)
                    .ToList();

            string mvTreePathString = "";
            foreach (var n in rootNode.Children)
            {
                mvTreePathString = GetPatientChartTree("", Guid.Parse(patientChartNodeId), n);
                if (mvTreePathString != null)
                {
                    break;
                }
            }

            if(mvTreePathString == "" || mvTreePathString == null)
            {
                return "";
            }

            var mvTreePath = mvTreePathString.Split('/').ToArray();

            if(mvTreePath[0] == "demographics")
            {
                //get patient data
                var patientVm = await _patientService.GetById(patientId);

                return patientVm.GetByKey(mvTreePath[1]);

            }

            if(mvTreePath[0] == "insurance")
            {                
                if(mvTreePath[1] == "patientInformation")
                {
                    var patientVm = await _patientService.GetById(patientId);

                    return patientVm.GetByKey(mvTreePath[2]);
                }

                var patientInsuranceVm = await _patientInsuranceService.GetByPatientId(patientId);

                if (mvTreePath[1] == "primaryInsurance")
                {
                    return patientInsuranceVm.GetByKey("primary", mvTreePath[2]);
                }

                if (mvTreePath[1] == "secondaryInsurance")
                {
                    return patientInsuranceVm.GetByKey("secondary", mvTreePath[2]);
                }
            }

            if (mvTreePath[0] == "patientHistory")
            {
                if(mvTreePath[1] == "patientMedicalRecordsReviewed")
                {
                    IEnumerable<MedicalRecordViewModel> medicalRecordVmEnum = await _medicalRecordService.GetByPatientId(patientId);
                    string medicalRecordHtml = "";
                    foreach(MedicalRecordViewModel medicalRecordVm in medicalRecordVmEnum)
                    {
                        medicalRecordHtml += $@"<tr><td>{medicalRecordVm.DocumentType}</td><td>{medicalRecordVm.CreateDate}</td><td>{medicalRecordVm.Diagnosis}</td></tr>";
                    }
                    return $@"<table class='preview-template-table'><tr><th>Document Type</th><th>Create Date</th><th>Diagnosis</th></tr>{medicalRecordHtml}</table>";
                }

                if (mvTreePath[1] == "tobaccoHistory")
                {
                    IEnumerable<TobaccoHistoryViewModel> tobaccoHistoryVmEnum = await _tobaccoHistoryService.GetByPatientId(patientId);
                    string tobaccoHistoryHtml = "";
                    foreach (TobaccoHistoryViewModel tobaccoHistoryVm in tobaccoHistoryVmEnum)
                    {
                        tobaccoHistoryHtml += $@"<tr><td>{tobaccoHistoryVm.Status}</td><td>{tobaccoHistoryVm.Frequency}</td><td>{tobaccoHistoryVm.Duration}</td><td>{tobaccoHistoryVm.Quit}</td><td>{tobaccoHistoryVm.CreateDate}</td></tr>";
                    }
                    return $@"<table class='preview-template-table'><tr><th>Status</th><th>Frequency</th><th>Duration</th><th>Quit</th><th>Create Date</th></tr>{tobaccoHistoryHtml}</table>";
                }

                if (mvTreePath[1] == "drugHistory")
                {
                    IEnumerable<DrugHistoryViewModel> drugHistoryVmEnum = await _drugHistoryService.GetByPatientId(patientId);
                    string drugHistoryHtml = "";
                    foreach (DrugHistoryViewModel drugHistoryVm in drugHistoryVmEnum)
                    {
                        drugHistoryHtml += $@"<tr><td>{drugHistoryVm.Status}</td><td>{drugHistoryVm.Type}</td><td>{drugHistoryVm.Quit}</td><td>{drugHistoryVm.CreateDate}</td></tr>";
                    }
                    return $@"<table class='preview-template-table'><tr><th>Status</th><th>Type</th><th>Quit</th><th>Create Date</th></tr>{drugHistoryHtml}</table>";
                }

                if (mvTreePath[1] == "alcoholHistory")
                {
                    IEnumerable<AlcoholHistoryViewModel> alcoholHistoryVmEnum = await _alcoholHistoryService.GetByPatientId(patientId);
                    string alcoholHistoryHtml = "";
                    foreach (AlcoholHistoryViewModel alcoholHistoryVm in alcoholHistoryVmEnum)
                    {
                        alcoholHistoryHtml += $@"<tr><td>{alcoholHistoryVm.Status}</td><td>{alcoholHistoryVm.Frequency}</td><td>{alcoholHistoryVm.Quit}</td><td>{alcoholHistoryVm.CreateDate}</td></tr>";
                    }
                    return $@"<table class='preview-template-table'><tr><th>Status</th><th>Frequency</th><th>Quit</th><th>Create Date</th></tr>{alcoholHistoryHtml}</table>";
                }

                if (mvTreePath[1] == "previousMedicalHistory")
                {
                    IEnumerable<MedicalHistoryViewModel> medicalHistoryVmEnum = await _medicalHistoryService.GetByPatientId(patientId);
                    string medicalHistoryHtml = "";
                    foreach (MedicalHistoryViewModel medicalHistoryVm in medicalHistoryVmEnum)
                    {
                        medicalHistoryHtml += $@"<tr><td>{medicalHistoryVm.Diagnosis}</td><td>{medicalHistoryVm.CreateDate}</td></tr>";
                    }
                    return $@"<table class='preview-template-table'><tr><th>Diagnosis</th><th>Create Date</th></tr>{medicalHistoryHtml}</table>";
                }

                if (mvTreePath[1] == "previousSurgicalHistory")
                {
                    IEnumerable<SurgicalHistoryViewModel> surgicalHistoryVmEnum = await _surgicalHistoryService.GetByPatientId(patientId);
                    string surgicalHistoryHtml = "";
                    foreach (SurgicalHistoryViewModel surgicalHistoryVm in surgicalHistoryVmEnum)
                    {
                        surgicalHistoryHtml += $@"<tr><td>{surgicalHistoryVm.Diagnosis}</td><td>{surgicalHistoryVm.CreateDate}</td></tr>";
                    }
                    return $@"<table class='preview-template-table'><tr><th>Diagnosis</th><th>Create Date</th></tr>{surgicalHistoryHtml}</table>";
                }

                if (mvTreePath[1] == "familyHistory")
                {
                    IEnumerable<FamilyHistoryViewModel> familyHistoryVmEnum = await _familyHistoryService.GetByPatientId(patientId);
                    string familyHistoryHtml = "";
                    foreach (FamilyHistoryViewModel familyHistoryVm in familyHistoryVmEnum)
                    {
                        familyHistoryHtml += $@"<tr><td>{familyHistoryVm.FamilyMember}</td><td>{familyHistoryVm.FamilyStatus}</td><td>{familyHistoryVm.Diagnosis}</td><td>{familyHistoryVm.CreateDate}</td></tr>";
                    }
                    return $@"<table class='preview-template-table'><tr><th>Family Member</th><th>Family Status</th><th>Diagnosis</th><th>Create Date</th></tr>{familyHistoryHtml}</table>";
                    
                }

                if (mvTreePath[1] == "education")
                {
                    IEnumerable<EducationHistoryViewModel> educationHistoryVmEnum = await _educationHistoryService.GetByPatientId(patientId);
                    string educationHistoryHtml = "";
                    foreach (EducationHistoryViewModel educationHistoryVm in educationHistoryVmEnum)
                    {
                        educationHistoryHtml += $@"<tr><td>{educationHistoryVm.Degree}</td><td>{educationHistoryVm.YearCompleted}</td><td>{educationHistoryVm.CreateDate}</td></tr>";
                    }
                    return $@"<table class='preview-template-table'><tr><th>Degree</th><th>Year Completed</th><th>Create Date</th></tr>{educationHistoryHtml}</table>";
                }

                if (mvTreePath[1] == "occupationalHistory")
                {
                    IEnumerable<OccupationalHistoryViewModel> occupationHistoryVmEnum = await _occupationalHistoryService.GetByPatientId(patientId);
                    string occupationHistoryHtml = "";
                    foreach (OccupationalHistoryViewModel ocupationHistoryVm in occupationHistoryVmEnum)
                    {
                        occupationHistoryHtml += $@"<tr><td>{ocupationHistoryVm.OccupationalType}</td><td>{ocupationHistoryVm.EmploymentStatus}</td><td>{ocupationHistoryVm.CreateDate}</td></tr>";
                    }
                    return $@"<table class='preview-template-table'><tr><th>Occupational Type</th><th>Employment Status</th><th>Create Date</th></tr>{occupationHistoryHtml}</table>";
                    
                }

                if (mvTreePath[1] == "allergies")
                {
                    IEnumerable<AllergyViewModel> allergyVmEnum = await _allergyService.GetByPatientId(patientId);
                    string allergyHtml = "";
                    foreach (AllergyViewModel allergyVm in allergyVmEnum)
                    {
                        allergyHtml += $@"<tr><td>{allergyVm.Medication}</td><td>{allergyVm.Reaction}</td><td>{allergyVm.CreateDate}</td></tr>";
                    }
                    return $@"<table class='preview-template-table'><tr><th>Medication / Class</th><th>Reaction</th><th>Create Date</th></tr>{allergyHtml}</table>";
                }

                if (mvTreePath[1] == "medications")
                {
                    IEnumerable<MedicationHistoryViewModel> medicationHistoryVmEnum = await _medicationHistoryService.GetByPatientId(patientId);
                    string medicationHistoryHtml = "";
                    foreach (MedicationHistoryViewModel medicationHistoryVm in medicationHistoryVmEnum)
                    {
                        medicationHistoryHtml += $@"<tr><td>{medicationHistoryVm.Medication}</td><td>{medicationHistoryVm.Route}</td><td>{medicationHistoryVm.Dose}</td><td>{medicationHistoryVm.Units}</td><td>{medicationHistoryVm.DosageForm}</td><td>{medicationHistoryVm.MedicationStatus}</td><td>{medicationHistoryVm.CreateDate}</td></tr>";
                    }
                    return $@"<table class='preview-template-table'><tr><th>Medication</th><th>Route</th><th>Dose</th><th>Units</th><th>Dosage Form</th><th>Medication Status</th><th>Create Date</th></tr>{medicationHistoryHtml}</table>";
                    
                }
            }

            if (mvTreePath[0] == "vitalSigns")
            {
                if (mvTreePath[1] == "baseVitalSigns")
                {
                    BaseVitalSignsViewModel baseVitalSignsVm = await _baseVitalSignsService.GetByPatientId(patientId);

                    return baseVitalSignsVm.GetByKey(mvTreePath[2], (mvTreePath.Count() > 3 ? mvTreePath[3] : ""));
                }

                if (mvTreePath[1] == "vitalSigns")
                {
                    IEnumerable<VitalSignsViewVM> vitalSignsVmEnum = await _vitalSignsService.GetByPatientAndAdmissionIds(patientId, admissionId);
                    string vitalSignsHtml = "";
                    foreach (VitalSignsViewVM vitalSignsVm in vitalSignsVmEnum)
                    {
                        vitalSignsHtml += $@"<tr><td>{vitalSignsVm.CreatedDate}</td><td>{vitalSignsVm.Pulse}</td><td>{vitalSignsVm.RespirationRate}</td><td>{vitalSignsVm.DiastolicBloodPressure}</td><td>{vitalSignsVm.OxygenSaturationAtRestValue}</td><td>{vitalSignsVm.OxygenSaturationAtRest}</td><td>{vitalSignsVm.Temperature}</td></tr>";
                    }
                    return $@"<table class='preview-template-table'><tr><th>Date/Time</th><th>Pulse</th><th>Respiration</th><th>Blood pressure</th><th>O2 Sat, %</th><th>O2 Sat Type</th><th>Temperature</th></tr>{vitalSignsHtml}</table>";
                }

                if (mvTreePath[1] == "visionVitalSigns")
                {
                    List<VisionVitalSignsViewModel> visionVitalSignsVmEnum = await _visionVitalSignsService.GetByPatientId(patientId);
                    string visionVitalSignsHtml = "";
                    foreach (VisionVitalSignsViewModel visionVitalSignsVm in visionVitalSignsVmEnum)
                    {
                        visionVitalSignsHtml += $@"<tr><td>{visionVitalSignsVm.CreateDate}</td><td>{visionVitalSignsVm.Os}</td><td>{visionVitalSignsVm.Od}</td><td>{visionVitalSignsVm.Ou}</td><td>{visionVitalSignsVm.WithGlasses}</td></tr>";
                    }
                    return $@"<table class='preview-template-table'><tr><th>Date</th><th>OS</th><th>OD</th><th>OU</th><th>With Glasses</th></tr>{visionVitalSignsHtml}</table>";
                }
            }

            if (mvTreePath[0] == "prescription")
            {
                //PatientAdmissionDxOptionsViewModel patientAdmissionDxOptionVm = new PatientAdmissionDxOptionsViewModel();
                //patientAdmissionDxOptionVm.AdmissionId = admissionId;
                //patientAdmissionDxOptionVm.PatientId = patientId;

                IEnumerable<MedicationPrescriptionViewModel> medicationPrescriptionVmEnum = await _medicationPrescriptionService.GetByAdmissionId(admissionId);
                string medicationPrescriptionHtml = "";
                foreach (MedicationPrescriptionViewModel medicationPrescriptionVm in medicationPrescriptionVmEnum)
                {
                    medicationPrescriptionHtml += $@"<tr><td>{medicationPrescriptionVm.Medication}</td><td>{medicationPrescriptionVm.Route}</td><td>{medicationPrescriptionVm.Dose}</td><td>{medicationPrescriptionVm.Units}</td><td>{medicationPrescriptionVm.DosageForm}</td><td>{medicationPrescriptionVm.StartDate}</td><td>{medicationPrescriptionVm.EndDate}</td></tr>";
                }
                return $@"<table class='preview-template-table'><tr><th>Medication</th><th>Route</th><th>Dose</th><th>Units</th><th>Dosage Form</th><th>Start Date</th><th>End Date</th></tr>{medicationPrescriptionHtml}</table>";

            }

            if (mvTreePath[0] == "assessment")
            {
                AdmissionVm admissionVm = await _admissionService.GetById(admissionId);

                if(admissionVm != null) 
                {
                    var admissionData = JObject.Parse(admissionVm.AdmissionData);
                    foreach(var node in admissionData["children"])
                    {
                        if(node["children"] != null)
                        {
                            foreach (var childNode in node["children"])
                            {
                                if(childNode["children"] != null)
                                {
                                    if(childNode["name"].ToString() == "assessment" && childNode["value"] != null)
                                    {
                                        string assessmentHtml = "";
                                        foreach (var childChildNode in childNode["value"])
                                        {
                                            if (childChildNode["status"] != null && childChildNode["status"].ToString() == "Current")
                                            {
                                                assessmentHtml += $@"<tr><td>{childChildNode["diagnosis"]}</td><td>{childChildNode["startDate"]}</td></tr>";
                                            }

                                        }

                                        return $@"<table class='preview-template-table'><tr><th>Diagnosis</th><th>Start Date</th></tr>{assessmentHtml}</table>";
                                    }
                                    
                                }
                                
                            }
                        }
                        
                    }
                }
                
                return "";
            }

            return "";
        }

        private string GetPatientChartTree(string parentName, Guid findChartId, PatientChartNode currentPatientChartNode)
        {
            string newName = parentName + (parentName != "" ? "/" : "") + currentPatientChartNode.Name;
            if ((currentPatientChartNode.Children == null || currentPatientChartNode.Children.Count == 0) && currentPatientChartNode.Id == findChartId)
            {
                return newName;
            }
            else if (currentPatientChartNode.Children != null)
            {
                foreach (var n in currentPatientChartNode.Children)
                {
                    string ret = GetPatientChartTree(newName, findChartId, n);
                    if (ret != null)
                    {
                        return ret;
                    }
                }
            }

            return null;
        }
    }
}
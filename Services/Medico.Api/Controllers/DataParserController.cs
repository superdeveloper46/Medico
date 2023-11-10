using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Medico.Application.ViewModels.Document;
using Medico.Application.ViewModels.Patient;
using Medico.Domain.Enums;
using Medico.Domain.Models;
using Medico.Identity.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Medico.Api.Extensions;
using System.Net.Http.Headers;
using System.Text;
using System.Security.Cryptography;


namespace Medico.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DataParserController : ApiController
    {
        #region DI
        private readonly IDataParserService _dataParserService;
        private readonly IUserValidPasswordGenerator _userPasswordGenerator;
        private readonly IPatientService _patientService;
        private readonly IUniqueUsernameService _uniqueUsernameService;
        private readonly IPatientUserEmailService _uniquePatientEmailService;
        private readonly IUserService _userService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IPatientInsuranceService _patientInsuranceService;
        private readonly IAppointmentService _appointmentService;
        private readonly ILocationService _locationService;
        private readonly IRoomService _roomService;
        private readonly IMedicalRecordService _medicalRecordService;
        private readonly IOptions<MedicoSettingsViewModel> _medicoSettings;
        private readonly IWebHostEnvironment _hostingEnvironment;


        public DataParserController(
            ILocationService locationService,
            IRoomService roomService,
            IAppointmentService appointmentService,
            IPatientInsuranceService patientInsuranceService,
            IUserService userService,
            IPatientService patientService,
            IDataParserService dataParserService,
            IUniqueUsernameService uniqueUsernameService,
            IUserValidPasswordGenerator userPasswordGenerator,
            IPatientUserEmailService uniquePatientEmailService,
            ICompanySecurityService companySecurityService,
            UserManager<ApplicationUser> userManager,
            IMedicalRecordService medicalRecordService,
            IOptions<MedicoSettingsViewModel> medicoSettings,
            IWebHostEnvironment hostingEnvironment)
        : base(companySecurityService)
        {
            _appointmentService = appointmentService;
            _patientInsuranceService = patientInsuranceService;
            _dataParserService = dataParserService;
            _userPasswordGenerator = userPasswordGenerator;
            _patientService = patientService;
            _uniqueUsernameService = uniqueUsernameService;
            _uniquePatientEmailService = uniquePatientEmailService;
            _userService = userService;
            _locationService = locationService;
            _roomService = roomService;
            _userManager = userManager;
            _medicalRecordService = medicalRecordService;
            _medicoSettings = medicoSettings;
            _hostingEnvironment = hostingEnvironment;
        }
        #endregion

        #region Methods
        [HttpPost]
        [Route("company/{companyId}")]
        public async Task<IActionResult> Post(PatientVmExtra patient, string companyId)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest();

                var patientId = await SavePatient(patient, companyId);

                return Ok(new
                {
                    success = patientId != null,
                    message = patientId != null ? "Patient info saved. Now you may save Appointment info" : "There was an error saving patient info",
                    data = patientId
                });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, message = $"Patient info could not be saved. {ex.Message}" });
            }
        }

        [HttpPost]
        [Route("documents/company/{companyId}/{parserId}")]
        public IActionResult PostDocuments(IEnumerable<ClaimantModel> documents, string companyId, string parserId)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest();

                documents.ToList().ForEach(c => c.companyId = new Guid(companyId));

                List<DocumentLog> documentLogs = new List<DocumentLog>();
                foreach (var item in documents)
                {
                    var apptDate = string.Empty;
                    var phone = string.Empty;
                    var ext = "pdf";

                    //if (item.appt_date != null)
                    //{
                    //    apptDate = item.appt_date.key_0;
                    //}
                    //if (item.phone_number != null)
                    //{
                    //    phone = item.phone_number.formatted;
                    //}
                    if (item.file_name != null)
                    {
                        ext = Path.GetExtension(item.file_name);
                    }

                    documentLogs.Add(new DocumentLog
                    {
                        ApptDate = item.examdate,
                        ApptTime = item.appointment_time,
                        ClaimantName = string.IsNullOrEmpty(item.claimant_name) ? "-NA-" : item.claimant_name.CapitalizeFirst(),
                        ClaimantSsn = item.claimant_ssn,
                        CompanyId = item.companyId,
                        CreateDate = DateTime.UtcNow,
                        DocParserProcessDate = item.processed_at,
                        Id = new Guid(item.document_id),
                        IsProcessed = false,
                        PhoneNumber = phone,
                        Physician = item.physicianbylocation.CapitalizeFirst(),
                        ProcessedBy = new Guid("b819c5f2-48b5-e911-9fb5-a0a4c501a22e"),
                        FileName = item.file_name,
                        FileExt = ext,
                        ParserId = parserId,
                        IsDeleted = false,
                        media_link_original = item.media_link_original
                    });
                }

                int rows = _dataParserService.AddDocuments(documentLogs);

                return Ok(new
                {
                    success = true,
                    message = "Data saved",
                    data = rows
                });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, message = $"Data could not be saved. {ex.Message}" });
            }
        }

        [HttpPost]
        [Route("documentsExt/company/{companyId}/{parserId}")]
        public IActionResult PostDocumentsExt(IEnumerable<Application.Tif.ViewModels.ClaimantModelExt> documents, string companyId, string parserId)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest();

                documents.ToList().ForEach(c => c.companyId = new Guid(companyId));

                List<DocumentLog> documentLogs = new List<DocumentLog>();
                foreach (var item in documents)
                {
                    var apptDate = string.Empty;
                    var phone = string.Empty;
                    var ext = "pdf";

                    if (item.appt_date != null)
                    {
                        apptDate = item.appt_date;
                    }
                    if (item.phone_number != null)
                    {
                        phone = item.phone_number.formatted;
                    }
                    if (item.file_name != null)
                    {
                        ext = Path.GetExtension(item.file_name);
                    }

                    documentLogs.Add(new DocumentLog
                    {
                        ApptDate = apptDate,
                        ApptTime = item.appt_time,
                        ClaimantName = string.IsNullOrEmpty(item.claimant_name) ? "-NA-" : item.claimant_name.CapitalizeFirst(),
                        ClaimantSsn = item.ss,
                        CompanyId = item.companyId,
                        CreateDate = DateTime.UtcNow,
                        DocParserProcessDate = item.processed_at,
                        Id = new Guid(item.document_id),
                        IsProcessed = false,
                        PhoneNumber = phone,
                        Physician = item.provider,
                        ProcessedBy = new Guid("b819c5f2-48b5-e911-9fb5-a0a4c501a22e"),
                        FileName = item.file_name,
                        FileExt = ext,
                        ParserId = parserId,
                        IsDeleted = false,
                        media_link_original = item.media_link_original
                    });
                }

                int rows = _dataParserService.AddDocuments(documentLogs);

                return Ok(new
                {
                    success = true,
                    message = "Data saved",
                    data = rows
                });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, message = $"Data could not be saved. {ex.Message}" });
            }
        }

        [HttpPost]
        [Route("extractInfo/{companyId}")]
        public async Task<IActionResult> PostPatientInfo(ClaimantModel item, string companyId)
        {
            try
            {
                // var createUpdateTask = await _dataParserService.ProcessDocData(item, companyId);
                PatientVmExtra patientVm = ExtractAllInfo(item);

                return Ok(new
                {
                    success = patientVm != null,
                    message = patientVm != null ? "Data extracted" : "Data could not be extracted",
                    data = patientVm
                });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, message = $"Data could not be extracted. {ex.Message}" });
            }

        }

        [HttpPost]
        [Route("extractInfoExt/{companyId}")]
        public async Task<IActionResult> PostPatientInfoExt(Application.Tif.ViewModels.ClaimantModelExt item, string companyId)
        {
            try
            {
                // var createUpdateTask = await _dataParserService.ProcessDocData(item, companyId);
                PatientVmExtra patientVm = ExtractAllInfo(item);

                return Ok(new
                {
                    success = patientVm != null,
                    message = patientVm != null ? "Data extracted" : "Data could not be extracted",
                    data = patientVm
                });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, message = $"Data could not be extracted. {ex.Message}" });
            }

        }

        [HttpGet]
        [Route("dx/grid")]
        public async Task<IActionResult> DxGridData(DocumentDxOptionsViewModel loadOptions)
        {
            // loadOptions.CompanyId = Guid.Parse("0084ADD6-3FDA-E911-B5E9-0003FF1726DD");
            var data = await _dataParserService.DocumentGrid(loadOptions);

            foreach (var item in data)
            {
                item.DocumentId = item.Id.ToString("N");
            }

            //provide ability of case-insensitive search
            //consider to use this configuration value globally
            loadOptions.StringToLower = true;
            return Ok(new { data });
        }



        [HttpDelete]
        [Route("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            int result = _dataParserService.DeleteDocument(new DocumentLog { Id = id });
            return Ok(new
            {
                success = result > 0,
                message = result > 0 ? "The document deleted successfully." : "The document could not be deleted."
            });
        }
        #endregion

        #region Physician Doc
        [HttpPost]
        [Route("physicianDoc/company/{companyId}/{parserId}")]
        public async Task<IActionResult> PostNewDocument(PhysicianDocVm item, string companyId, string parserId)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest();

                item.CompanyId = new Guid(companyId);

                List<PhysicianDocLog> physicianDocs = new List<PhysicianDocLog>();

                var apptDate = string.Empty;
                var phone = string.Empty;
                var ext = "pdf";

                if (item.file_name != null)
                {
                    ext = Path.GetExtension(item.file_name);
                }

                // save physician doc log
                physicianDocs.Add(new PhysicianDocLog
                {
                    DocumentId = item.document_id,
                    CompanyId = item.CompanyId,
                    CreateDate = DateTime.UtcNow,
                    DocParserProcessDate = item.processed_at,
                    IsProcessed = item.IsProcessed,
                    ProcessedBy = new Guid("b819c5f2-48b5-e911-9fb5-a0a4c501a22e"),
                    FileName = item.file_name,
                    FileExt = ext,
                    ParserId = parserId,
                    DocContent = item.DocContent,
                    PatientId = item.PatientId
                    // DocumentField = documentFields
                });

                // Step 1 
                int rows = await _dataParserService.AddDocuments(physicianDocs);

                // Step 2
                var medicalRecordViewModel = new MedicalRecordViewModel
                {
                    CreateDate = item.CreateDate,
                    DocumentType = item.DocumentType,
                    PatientId = item.PatientId,
                    IncludeNotesInReport = false,
                    Notes = item.DocContent
                };
                await _medicalRecordService.Create(medicalRecordViewModel);

                return Ok(new
                {
                    success = true,
                    message = "Data saved",
                    data = rows
                });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, message = $"Data could not be saved. {ex.Message}" });
            }
        }

        [HttpGet]
        [Route("physicianDocs")]
        public IActionResult GetPhysicianDocs(string patientId)
        {
            var pid = new Guid(patientId);
            var data = _dataParserService.GetPhysicianDocs().Where(c => c.IsProcessed == true && c.PatientId == pid).OrderByDescending(c => c.CreateDate);
            foreach (var item in data)
            {
                item.FileExt = $"{BaseUrl}Docs/{item.FileName}";
            }
            return Ok(new { data });
        }

        [HttpGet]
        //[Route("physicianDoc/saveDocument/{appointmentId}/{patientId}")]
        [Route("physicianDoc/saveDocument")]
        public async Task<IActionResult> SaveDocumentForPreview(string patientId, string companyId, string fileUrl)
        {
            try
            {
                string filenames = fileUrl.Remove(fileUrl.Length - 1, 1);
                List<PhysicianDocLog> physicianDocs = new List<PhysicianDocLog>();

                foreach (string f in filenames.Split(","))
                {
                    WebClient webClient = new WebClient();

                    var fs = f.Split("|");
                    var filename = fs[0];
                    var documentId = fs[1];

                    var request = WebRequest.Create(filename);
                    var response = request.GetResponse();
                    var contentDisposition = response.Headers["Content-Disposition"];
                    const string contentFileNamePortion = "filename=";
                    var fileNameStartIndex = contentDisposition.IndexOf(contentFileNamePortion, StringComparison.InvariantCulture) + contentFileNamePortion.Length;
                    var originalFileNameLength = contentDisposition.Length - fileNameStartIndex;
                    var originalFileName = contentDisposition.Substring(fileNameStartIndex, originalFileNameLength).Replace("\"", "");
                    var destinationFilename = Directory.GetCurrentDirectory() + "/Docs/" + originalFileName;
                    // destinationFilename = @"c:\upload\" + originalFileName;

                    //var directoryPath = Path.Combine(appointmentId, patientId);
                    //var fileName = originalFileName;
                    //var dbPath = Path.Combine(directoryPath, fileName);
                    //var pathToSave = Path.Combine(_medicoSettings.Value.ScanDocumentUploadPath, directoryPath);
                    //var fullPath = Path.Combine(pathToSave, fileName);

                    webClient.DownloadFile(filename, destinationFilename);

                    // save physician doc log
                    var ext = "pdf";
                    if (filename != null)
                    {
                        ext = Path.GetExtension(originalFileName);
                    }

                    physicianDocs.Add(new PhysicianDocLog
                    {
                        DocumentId = documentId,
                        CompanyId = new Guid(companyId),
                        CreateDate = DateTime.UtcNow,
                        IsProcessed = true,
                        ProcessedBy = new Guid("b819c5f2-48b5-e911-9fb5-a0a4c501a22e"),
                        FileName = originalFileName,
                        FileExt = ext,
                        ParserId = "lapbzmcdrnuj",
                        DocContent = string.Empty,
                        PatientId = new Guid(patientId),
                    });
                }
                int rows = await _dataParserService.AddDocuments(physicianDocs);

                // Update processed status
                await UpdateDocumentStatus(physicianDocs);

                return Ok(new { success = true, data = rows, message = "Documents(s) saved successfully" });
            }
            catch (Exception ee)
            {
                return Ok(new { success = false, data = ee, message = "Documents(s) could not be saved" });
            }
        }

        [HttpPatch]
        public async Task UpdateDocumentStatus(List<PhysicianDocLog> documentLog)
        {
            foreach (var document in documentLog)
            {
                await _dataParserService.UpdateDocument(new Domain.Models.DocumentLog
                {
                    Id = Guid.Parse(document.DocumentId),
                    IsProcessed = true,
                    ProcessedDate = DateTime.UtcNow
                });
            }

        }

        [HttpPost]
        [Route("physicianDoc/SaveLocalDocument")]
        public async Task<IActionResult> SaveLocalDocument(string patientId, string companyId)
        {
            try
            {
                List<PhysicianDocLog> physicianDocs = new List<PhysicianDocLog>();
                //var file = Request.Form.Files[0];
                int rows = 0;
                foreach (var file in Request.Form.Files)
                {
                    if (file.Length > 0)
                    {
                        string fileName = ContentDispositionHeaderValue.Parse(file.ContentDisposition).FileName.Trim('"');
                        var destinationFilename = Directory.GetCurrentDirectory() + "/Docs/" + fileName;
                        using (var stream = new FileStream(destinationFilename, FileMode.Create))
                        {
                            file.CopyTo(stream);
                        }
                        var ext = "pdf";
                        if (fileName != null)
                        {
                            ext = Path.GetExtension(destinationFilename);
                        }

                        physicianDocs.Add(new PhysicianDocLog
                        {
                            CompanyId = new Guid(companyId),
                            CreateDate = DateTime.UtcNow,
                            IsProcessed = true,
                            ProcessedBy = new Guid("b819c5f2-48b5-e911-9fb5-a0a4c501a22e"),
                            FileName = fileName,
                            FileExt = ext,
                            DocContent = string.Empty,
                            PatientId = new Guid(patientId),
                        });
                    }
                }
                rows += await _dataParserService.AddDocuments(physicianDocs);
                return Ok(new { success = true, data = rows, message = "Documents(s) saved successfully" });

            }
            catch (Exception ee)
            {
                return Ok(new { success = false, data = ee, message = "Documents(s) could not be saved" });
            }
        }

        [HttpDelete]
        [Route("physicianDoc/{id}")]
        public async Task<IActionResult> DeletePhysician(Guid id)
        {
            int result = _dataParserService.DeletePhysicianDocument(id);
            return Ok(new
            {
                success = result > 0,
                message = result > 0 ? "The document deleted successfully." : "The document could not be deleted."
            });
        }

        [HttpGet]
        [Route("downloadFile")]
        public async Task<IActionResult> DownloadFile([FromQuery] Guid documentId, [FromQuery] string filename, [FromQuery] Guid patientId)
        {
            string folderDocs = Path.Combine(_hostingEnvironment.ContentRootPath, "Docs");
            string pathDoc = Path.Combine(folderDocs, filename);
            
            var doc = _dataParserService.GetPhysicianDocs()
                .Where(c => c.IsProcessed == true && c.PatientId == patientId && c.Id == documentId)
                .FirstOrDefault();

            if(doc == null) 
               return NotFound();


            if (System.IO.File.Exists(pathDoc) && doc.FileName == filename)
            {
                var fileBytes = await System.IO.File.ReadAllBytesAsync(pathDoc);
                return File(fileBytes, "application/pdf", filename);
            }

            return NotFound();
        }

        //[HttpPost]
        //[Route("physicianDoc/company/{companyId}/{parserId}")]
        //public async Task<IActionResult> PostNewDocument(IEnumerable<PhysicianDocVm> documents, string companyId, string parserId)
        //{
        //    try
        //    {
        //        if (!ModelState.IsValid)
        //            return BadRequest();

        //        documents.ToList().ForEach(c => c.companyId = new Guid(companyId));

        //        List<PhysicianDocLog> physicianDocs = new List<PhysicianDocLog>();

        //        foreach (var item in documents)
        //        {
        //            var apptDate = string.Empty;
        //            var phone = string.Empty;
        //            var ext = "pdf";

        //            if (item.file_name != null)
        //            {
        //                ext = Path.GetExtension(item.file_name);
        //            }

        //            // save physician doc fields
        //            List<DocumentField> documentFields = new List<DocumentField>();
        //            foreach (var field in item.field_1)
        //            {
        //                documentFields.Add(new DocumentField
        //                {
        //                    DocumentKey = field.key_0
        //                });
        //            }

        //            // save physician doc log
        //            physicianDocs.Add(new PhysicianDocLog
        //            {
        //                DocumentId = item.document_id,
        //                CompanyId = item.companyId,
        //                CreateDate = DateTime.UtcNow,
        //                DocParserProcessDate = item.processed_at,
        //                Id = new Guid(item.document_id),
        //                IsProcessed = false,
        //                ProcessedBy = new Guid("b819c5f2-48b5-e911-9fb5-a0a4c501a22e"),
        //                FileName = item.file_name,
        //                FileExt = ext,
        //                ParserId = parserId,
        //                DocumentField = documentFields
        //            });
        //        }

        //        int rows = await _dataParserService.AddDocuments(physicianDocs);

        //        return Ok(new
        //        {
        //            success = true,
        //            message = "Data saved",
        //            data = rows
        //        });
        //    }
        //    catch (Exception ex)
        //    {
        //        return Ok(new { success = false, message = $"Data could not be saved. {ex.Message}" });
        //    }
        //}
        #endregion

        #region Non Action
        private static PatientVmExtra ExtractAllInfo(ClaimantModel item)
        {
            try
            {
                PatientVmExtra patientVm = new PatientVmExtra();
                if (item.claimant_name != null)
                {
                    string documentId = item.document_id.Trim();
                    string[] info = item.claimant_name.Split(" ");
                    if (info.Length > 0)
                    {

                        string firstName = "";
                        string lastName = "";
                        string middleName = "";

                        if (info.Length == 1)
                        {
                            firstName = info[0].CapitalizeFirst();
                        }
                        else if (info.Length == 2)
                        {
                            firstName = info[0].CapitalizeFirst();
                            lastName = info[1].CapitalizeFirst();
                        }
                        else if (info.Length >= 3)
                        {
                            firstName = info[0].CapitalizeFirst();
                            middleName = info[1].CapitalizeFirst();
                            lastName = info[2].CapitalizeFirst();
                        }

                        string email = $"{firstName.ToLower()}_{lastName.ToLower()}@mail.com";
                        string ssn = "000-00-0000";
                        string city = "";
                        string address = "";
                        string zip = "00000";
                        string state = "";
                        ZipCodeType zipCodeType = ZipCodeType.FiveDigit;
                        DateTime dateOfBirth = DateTime.Now;
                        string phone = "";
                        string caseNumber = "";
                        string appDate = string.Empty;
                        string appTime = string.Empty;

                        // ssn
                        if (!string.IsNullOrEmpty(item.claimant_ssn))
                        {
                            ssn = item.claimant_ssn.Replace("SSN\n", "");
                        }
                        // address
                        if (item.claimant_city_state_zip != null)
                        {
                            //city = item.claimant_city_state_zip;
                            //address = $"{item.claimant_address.street_number} {item.claimant_address.street} {item.claimant_address.extra} {item.claimant_address.state} {item.claimant_address.state_full} {item.claimant_address.zipcode} {item.claimant_address.country}";
                            //zip = item.claimant_address.zipcode;
                            //zipCodeType = item.claimant_address.zipcode.Length == 5 ? ZipCodeType.FiveDigit : ZipCodeType.NineDigit;
                            //state = item.claimant_address.state_full;

                            if (item.claimant_city_state_zip.Count() > 0)
                            {
                                for (int i = 0; i < item.claimant_city_state_zip.Count(); i++)
                                {
                                    address += $@"{item.claimant_city_state_zip[i].key_0} ";
                                    if (i == 4)
                                    {
                                        city = item.claimant_city_state_zip[i].key_0;
                                    }
                                }
                            }
                        }


                        //if (item.home_address != null)
                        //{
                        //    city = item.home_address.key_0;
                        //    //address = $"{item.home_address.street_number} {item.home_address.street} {item.home_address.extra} {item.home_address.state} {item.home_address.state_full} {item.claimant_address.zipcode} {item.claimant_address.country}";
                        //    zip = item.home_address.key_2;
                        //    zipCodeType = item.home_address.key_2.Length == 5 ? ZipCodeType.FiveDigit : ZipCodeType.NineDigit;
                        //    state = item.home_address.key_1;
                        //}

                        // birthday
                        if (item.birthday != null)
                        {
                            dateOfBirth = DateTime.Parse(item.birthday);
                        }
                        // phone
                        if (item.phone_number != null)
                        {
                            phone = item.phone_number.number;
                        }
                        // case number
                        if (!string.IsNullOrEmpty(item.case_number))
                        {
                            caseNumber = item.case_number;
                        }

                        // appt date
                        if (item.appointment_time != null)
                        {
                            appTime = item.appointment_time.Replace("MST", "").Trim();
                        }

                        // appt date
                        if (item.examdate != null)
                        {
                            // March 29th, 2021
                            var d = item.examdate.Split(" ");
                            if (d.Length > 0)
                            {
                                if (d.Length == 3)
                                {
                                    string month = d[0].Trim();
                                    string day = d[1].Replace("th", "")
                                        .Replace("st", "")
                                        .Replace("nd", "")
                                        .Replace("rd", "").Replace(",", "").Trim();

                                    string year = d[2].Trim();

                                    appDate = string.Format("{0}/{1}/{2} {3}", month, day, year, appTime);
                                }

                                //Monday June 21st, 2021 03:30 PM Mountain Standard Time
                                if (d.Length == 9)
                                {
                                    string month = d[1].Trim();
                                    string day = d[2].Replace("th", "")
                                        .Replace("st", "")
                                        .Replace("nd", "")
                                        .Replace("rd", "").Replace(",", "").Trim();

                                    string year = d[3].Trim();

                                    appDate = string.Format("{0}/{1}/{2} {3}", month, day, year, appTime);
                                }
                            }
                        }


                        patientVm = new PatientVmExtra
                        {
                            DocumentId = documentId,
                            FirstName = firstName,
                            MiddleName = middleName,
                            LastName = lastName,
                            Ssn = ssn,
                            Email = email,
                            PatientInsuranceId = null, // new Guid("5D661C6D-A9CA-CD0F-89F1-308BD8FD6B7E")
                            DateOfBirth = dateOfBirth,
                            PrimaryPhone = phone,
                            SecondaryPhone = phone,
                            PrimaryAddress = address,
                            City = city,
                            Zip = zip,
                            ZipCodeType = zipCodeType,
                            Allegations = item.allegationsbytext,
                            StateName = state,

                            // Insurance Information
                            Rqid = item.rqidbytext ?? "",
                            CaseNumber = caseNumber,

                            // Appointment Info
                            Physician = item.physicianbylocation ?? "",
                            ApptDate = appDate,
                            ApptTime = appTime ?? "",
                            ExamLocation = ""
                        };
                    }
                }
                return patientVm;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        private PatientVmExtra ExtractAllInfo(Application.Tif.ViewModels.ClaimantModelExt item)
        {
            try
            {
                PatientVmExtra patientVm = new PatientVmExtra();
                if (item.claimant_name != null)
                {
                    string documentId = item.document_id.Trim();
                    //string[] info = item.claimant_name.Split(" ");
                    string[] info = Array.ConvertAll(item.claimant_name.Split(' '), p => p.Trim());
                    if (info.Length > 0)
                    {
                        string firstName = "";
                        string lastName = "";
                        string middleName = "";

                        if (info.Length == 1)
                        {
                            firstName = info[0].CapitalizeFirst();
                        }
                        else if (info.Length == 2)
                        {
                            firstName = info[0].CapitalizeFirst();
                            lastName = info[1].CapitalizeFirst();
                        }
                        else if (info.Length == 3)
                        {
                            firstName = info[0].CapitalizeFirst();
                            middleName = info[1].CapitalizeFirst();
                            lastName = info[2].CapitalizeFirst();
                        }
                        else if (info.Length > 3)
                        {
                            firstName = info[0].CapitalizeFirst();

                            StringBuilder sb = new StringBuilder();
                            for (int i = 1; i < info.Length; i++)
                            {
                                if (!string.IsNullOrEmpty(info[i]))
                                {
                                    sb.Append(info[i]).Append(" ");
                                }
                            }
                            lastName = Convert.ToString(sb).CapitalizeFirst();
                        }

                        string email = $"{firstName}_{lastName}@mail.com";
                        string ssn = "000-00-0000";
                        string city = "";
                        string address = "";
                        string zip = "00000";
                        string state = "";
                        ZipCodeType zipCodeType = ZipCodeType.FiveDigit;
                        DateTime dateOfBirth = DateTime.Now;
                        string phone = "";
                        string caseNumber = "";
                        string appDate = DateTime.Now.ToString();

                        // ssn
                        if (!string.IsNullOrEmpty(item.ss))
                        {
                            ssn = item.ss.Replace("SSN\n", "");
                        }
                        // address
                        if (item.address != null)
                        {
                            address = item.address;
                            string lastWord = address.Split(' ').Last();
                            if (!string.IsNullOrEmpty(lastWord))
                            {
                                zip = lastWord;
                                if (zip.Length != 5)
                                {
                                    zipCodeType = ZipCodeType.NineDigit;
                                }
                            }

                            // city
                            var words = address.Split(' ');
                            var reqWord = "";
                            if (words.Length > 1)
                            {
                                reqWord = words[words.Length - 3];
                                string toBeSearched = "\n";
                                string code = reqWord.Substring(reqWord.IndexOf(toBeSearched) + toBeSearched.Length);
                                city = code.Trim();
                            }

                        }
                        // birthday
                        if (item.dob != null)
                        {
                            dateOfBirth = DateTime.Parse(item.dob.formatted);
                        }
                        // phone
                        if (item.phone_number != null)
                        {
                            phone = item.phone_number.formatted;
                        }
                        // case number
                        if (!string.IsNullOrEmpty(item.case_))
                        {
                            caseNumber = item.case_;
                        }
                        // appt date
                        if (item.appt_date != null)
                        {
                            appDate = item.appt_date;
                        }

                        string allegations = item.allegations;

                        string rqid = string.Empty;
                        var rq1 = item.rqid.Replace("ROID:", "").Trim();
                        if (!string.IsNullOrEmpty(rq1))
                        {
                            var rq2 = rq1.Trim().Split(" ").FirstOrDefault().Trim();
                            if (!string.IsNullOrEmpty(rq2))
                            {
                                rqid = rq2;
                            }
                        }

                        patientVm = new PatientVmExtra
                        {
                            DocumentId = documentId,
                            FirstName = firstName,
                            MiddleName = middleName,
                            LastName = lastName,
                            Ssn = ssn,
                            Email = email,
                            PatientInsuranceId = null, // new Guid("5D661C6D-A9CA-CD0F-89F1-308BD8FD6B7E")
                            DateOfBirth = dateOfBirth,
                            PrimaryPhone = phone,
                            SecondaryPhone = phone,
                            PrimaryAddress = address,
                            City = city,
                            Zip = zip,
                            ZipCodeType = zipCodeType,
                            Allegations = allegations,
                            StateName = state,

                            // Insurance Information
                            Rqid = rqid,
                            CaseNumber = caseNumber,

                            // Appointment Info
                            Physician = item.provider ?? "",
                            ApptDate = appDate,
                            ApptTime = item.appt_time ?? "",
                            ExamLocation = item.location ?? ""
                        };
                    }
                }
                return patientVm;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        private async Task<Guid> SavePatient(PatientVmExtra patientInfo, string strCompanyId)
        {
            try
            {
                // strCompanyId = "FC4DCBCE-11EB-4719-AD57-24A7C514D5B0";
                var patientUserPassword = _userPasswordGenerator.Generate();
                var companyId = new Guid(strCompanyId);
                if (patientInfo == null)
                {
                    throw new Exception("Invalid patient info");
                }
                else
                {
                    PatientVm patientViewModel = new PatientVm
                    {
                        Password = patientUserPassword,
                        City = patientInfo.City,
                        CompanyId = companyId,
                        DateOfBirth = patientInfo.DateOfBirth.AddHours(12),
                        Email = patientInfo.Email,
                        FirstName = patientInfo.FirstName,
                        Gender = patientInfo.Gender,
                        LastName = patientInfo.LastName,
                        MaritalStatus = patientInfo.MaritalStatus,
                        MiddleName = patientInfo.MiddleName,
                        NameSuffix = string.Empty,
                        Notes = "AUTO GENERATED",
                        PatientInsuranceId = patientInfo.PatientInsuranceId,
                        PrimaryAddress = patientInfo.PrimaryAddress,
                        PrimaryPhone = patientInfo.PrimaryPhone,
                        SecondaryAddress = patientInfo.SecondaryAddress,
                        SecondaryPhone = string.Empty,
                        Ssn = patientInfo.Ssn,
                        State = patientInfo.State,
                        Id = Guid.NewGuid(),
                        Zip = patientInfo.Zip,
                        ZipCodeType = patientInfo.ZipCodeType,
                    };

                    var savedPatient = await _patientService.Create(patientViewModel);

                    var patientUserEmail = _uniquePatientEmailService.GeneratePatientUserEmailBasedOnPatientId(savedPatient.Id);

                    await _userService.Create(new MedicoApplicationUserViewModel
                    {
                        Role = "Patient",
                        RoleName = "Patient",
                        FirstName = savedPatient.FirstName,
                        MiddleName = savedPatient.MiddleName,
                        LastName = savedPatient.LastName,
                        Email = patientUserEmail,
                        Address = savedPatient.PrimaryAddress,
                        SecondaryAddress = savedPatient.SecondaryAddress,
                        City = savedPatient.City,
                        State = savedPatient.State,
                        Zip = savedPatient.Zip,
                        ZipCodeType = savedPatient.ZipCodeType,
                        PrimaryPhone = savedPatient.PrimaryPhone,
                        SecondaryPhone = savedPatient.SecondaryPhone,
                        EmployeeType = 7,
                        Ssn = savedPatient.Ssn,
                        Gender = savedPatient.Gender,
                        DateOfBirth = savedPatient.DateOfBirth,
                        CompanyId = savedPatient.CompanyId,
                        IsActive = true
                    });

                    var patientUserName = _uniqueUsernameService.Get(patientUserEmail, companyId);

                    var newUser = new ApplicationUser
                    {
                        Email = patientUserEmail,
                        UserName = patientUserName,
                        CompanyId = companyId
                    };

                    var userCreationResult =
                        await _userManager.CreateAsync(newUser, patientUserPassword);

                    if (!userCreationResult.Succeeded)
                        throw new InvalidOperationException(userCreationResult.Errors.ToString());

                    var medicoApplicationUser = await _userManager.FindByNameAsync(patientUserName);

                    // Assign Role
                    await _userManager.AddToRoleAsync(medicoApplicationUser, "Patient");

                    // Save Patient Insurance
                    await SavePatientInsurance(patientInfo, strCompanyId);

                    //try
                    //{
                    //    // Save Appointment
                    //    await SaveAppointment(patientInfo, strCompanyId, savedPatient);
                    //}
                    //catch (Exception e)
                    //{

                    //}

                    // Update Document Status
                    await _dataParserService.UpdateDocument(new Domain.Models.DocumentLog
                    {
                        Id = new Guid(patientInfo.DocumentId),
                        IsProcessed = true,
                        ProcessedDate = DateTime.UtcNow
                    });

                    return savedPatient.Id;
                }
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        private async Task SaveAppointment(PatientVmExtra patientInfo, string strCompanyId, PatientVm savedPatient)
        {
            try
            {
                //string dateString = "April 30th, 2021";
                //string format = "MMM% dd%%, yyyy";

                //DateTime apptDate = DateTime.ParseExact(dateString, format, CultureInfo.InvariantCulture);
                var physicianId = Guid.NewGuid();
                var locationId = new Guid("ca77a6cb-8a90-b52e-b76c-18b2880c4cce");
                var roomId = new Guid("E1EF9A74-871C-EA11-828B-281878072C42");

                string[] arrPhy = patientInfo.Physician.Trim().Split(" ");
                if (arrPhy.Length > 0)
                {
                    var physician = await _userService.GetByName(arrPhy[0].Trim());
                    if (physician != null)
                    {
                        physicianId = physician.Id;
                    }
                    else
                    {
                        physician = await _userService.GetFirstOrDefaultAsync(c => c.EmployeeType == 1);
                        if (physician != null)
                            physicianId = physician.Id;
                    }
                }

                var location = await _locationService.GetByName(patientInfo.ExamLocation);
                if (location != null)
                {
                    locationId = location.Id;
                }

                var room = await _roomService.GetByLocationId(locationId);
                if (room != null)
                {
                    roomId = room.FirstOrDefault().Id;
                }

                AppointmentViewModel appointmentViewModel = new AppointmentViewModel
                {
                    Allegations = patientInfo.Allegations,
                    AppointmentStatus = "Scheduled",
                    AllegationsNotes = patientInfo.Allegations,
                    CompanyId = new Guid(strCompanyId),
                    EndDate = DateTime.UtcNow.AddDays(3),
                    PatientId = savedPatient.Id,
                    PhysicianId = physicianId,
                    RoomId = roomId,//new Guid("d2c2b91e-66a8-9f13-55f1-e538b5f3da39"),
                    AdmissionId = new Guid("41DCE5E1-C3A9-3D58-69D1-21CB04D8CD02"),
                    LocationId = locationId,
                    NurseId = new Guid("ECDC876E-442D-EA11-A601-28187804F02C"),//new Guid("b819c5f2-48b5-e911-9fb5-a0a4c501a22e"),
                    StartDate = DateTime.UtcNow.AddDays(2)//Convert.ToDateTime($"{apptDate} {patientInfo.ApptTime}"),
                };

                //            allDay: false
                //appointmentStatus: "Scheduled"
                //companyId: "fc4dcbce-11eb-4719-ad57-24a7c514d5b0"
                //endDate: "2021-04-21T05:00:00.000Z"
                //locationId: "ca77a6cb-8a90-b52e-b76c-18b2880c4cce"
                //nurseId: "b819c5f2-48b5-e911-9fb5-a0a4c501a22e"
                //patientId: "eddbe680-f380-6b78-1eab-3d134ccb5611"
                //physicianId: "003671c2-49b5-e911-9fb5-a0a4c501a22e"
                //roomId: "d2c2b91e-66a8-9f13-55f1-e538b5f3da39"
                //startDate: "2021-04-21T04:30:00.000Z"
                //text: ""

                var createUpdateTask = _appointmentService.Create(appointmentViewModel);

                await createUpdateTask;
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        private async Task SavePatientInsurance(PatientVmExtra patientInfo, string companyId)
        {
            var patient = await _patientService.GetByFilter(new PatientFilterVm { Ssn = patientInfo.Ssn, CompanyId = new Guid(companyId) });

            PatientInsuranceViewModel patientInsuranceViewModel = new PatientInsuranceViewModel
            {
                CaseNumber = patientInfo.CaseNumber,
                City = patientInfo.City,
                CompanyId = patientInfo.CompanyId,
                DateOfBirth = patientInfo.DateOfBirth,
                Email = patientInfo.Email,
                FirstName = patientInfo.FirstName,
                Gender = patientInfo.Gender,
                LastName = patientInfo.LastName,
                MaritalStatus = patientInfo.MaritalStatus,
                MiddleName = patientInfo.MiddleName,
                NameSuffix = patientInfo.NameSuffix,
                Notes = string.IsNullOrEmpty(patientInfo.Allegations) ? "NA" : patientInfo.Allegations.CapitalizeFirst().Trim().Replace(";", ","),
                Password = patientInfo.Password,
                PatientId = patient.FirstOrDefault().Id,
                PrimaryAddress = patientInfo.PrimaryAddress,
                PrimaryPhone = patientInfo.PrimaryPhone,
                Rqid = patientInfo.Rqid,
                SecondaryAddress = patientInfo.SecondaryAddress,
                SecondaryPhone = patientInfo.SecondaryPhone,
                Ssn = patientInfo.Ssn,
                State = patientInfo.State,
                Zip = patientInfo.Zip,
                ZipCodeType = patientInfo.ZipCodeType,
            };


            var createUpdateTask = patientInsuranceViewModel.Id == Guid.Empty
           ? _patientInsuranceService.Create(patientInsuranceViewModel)
           : _patientInsuranceService.Update(patientInsuranceViewModel);

            var savedPatientInsurance = await createUpdateTask;
        }

        [HttpDelete]
        public IActionResult Delete(DocumentLog item)
        {
            try
            {
                int rows = _dataParserService.DeleteDocument(item);

                return Ok(new
                {
                    success = true,
                    message = "Document deleted",
                    data = rows
                });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, message = $"Document could not be deleted. {ex.Message}" });
            }
        }


        #endregion

        //private PatientVm ExtractPatientInfo(ClaimantModel item)
        //{
        //    if (item.ClaimantSSN != null)
        //    {
        //        string[] info = item.ClaimantSSN.Split("\n");
        //        if (info.Length > 0)
        //        {
        //            string[] nameStr = info[1].Split(" ");
        //            int nameLength = nameStr.Length;
        //            if (nameLength > 0)
        //            {
        //                string firstName = nameStr[0];
        //                string middleName = nameLength >= 2 ? nameStr[1] : "";
        //                string lastName = nameLength == 3 ? nameStr[2] : "";
        //                string email = $"{firstName}_{lastName}@mail.com";
        //                // SSN
        //                // string suffix = string.IsNullOrEmpty(info[3]) ? "NA" : info[3].Trim();

        //                return new PatientVm
        //                {
        //                    FirstName = firstName,
        //                    MiddleName = middleName,
        //                    LastName = lastName,
        //                    Ssn = item.ClaimantSSN.Trim(),
        //                    Email = email,
        //                    PatientInsuranceId = null, // new Guid("5D661C6D-A9CA-CD0F-89F1-308BD8FD6B7E")
        //                    DateOfBirth = DateTime.Parse(item.Birthday.formatted.Trim()),
        //                    PrimaryPhone = item.PhoneNumber.formatted.Trim(),
        //                    PrimaryAddress = $"{item.ClaimantAddress.street_number} {item.ClaimantAddress.street} {item.ClaimantAddress.extra} {item.ClaimantAddress.state} {item.ClaimantAddress.state_full} {item.ClaimantAddress.zipcode} {item.ClaimantAddress.country}",
        //                    City = item.ClaimantAddress.city,
        //                    Zip = item.ClaimantAddress.zipcode
        //                };
        //            }
        //        }
        //    }

        //    return null;
        //}
    }
}

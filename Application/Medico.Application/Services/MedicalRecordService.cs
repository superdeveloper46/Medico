using AutoMapper;
using AutoMapper.QueryableExtensions;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Medico.Domain.Interfaces;
using Medico.Domain.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http.Headers;
using System.Threading.Tasks;

namespace Medico.Application.Services
{
    public class MedicalRecordService : BaseDeletableByIdService<MedicalRecord, MedicalRecordViewModel>,
        IMedicalRecordService
    {
        private readonly IMapper _mapper;
        private IDocumentService _documentService;

        public MedicalRecordService(IMedicalRecordRepository repository, IDocumentService _documentService, IMapper mapper)
            : base(repository, mapper)
        {
            _mapper = mapper;
        }

        public async Task<IEnumerable<MedicalRecordViewModel>> GetByPatientId(Guid patientId)
        {
            var medicalRecord = await Repository.GetAll()
                .Where(h => h.PatientId == patientId)
                .ProjectTo<MedicalRecordViewModel>(_mapper.ConfigurationProvider)
                .ToListAsync();

            return medicalRecord;
        }

        public async Task<bool> IsHistoryExist(Guid patientId)
        {
            var medicalRecord = await Repository.GetAll()
                .FirstOrDefaultAsync(h => h.PatientId == patientId);

            return medicalRecord != null;
        }

        public Task Delete(Guid id)
        {
            return DeleteById(id);
        }

        public IQueryable<MedicalRecordViewModel> GetAll(HistoryDxOptionsViewModel historyDxOptionsViewModel)
        {
            return Repository.GetAll()
                .Where(th => th.PatientId == historyDxOptionsViewModel.PatientId)
                .ProjectTo<MedicalRecordViewModel>(_mapper.ConfigurationProvider);
        }

        public async Task<IEnumerable<MedicalRecordViewModel>> GetAllByPatientId(Guid patientId)
        {
            var patientMedicalRecords = await Repository.GetAll()
                .Where(th => th.PatientId == patientId)
                .ProjectTo<MedicalRecordViewModel>(_mapper.ConfigurationProvider)
                .ToListAsync();

            return patientMedicalRecords;
        }

        public async Task<MedicalRecordViewModel> CreateWithDocs(List<IFormFile> files, MedicalRecordViewModel viewModel)
        {
            var docs = new List<DocumentMedicalRecord>();
            foreach (var file in files)
            {
                string extension = file.ContentType.Split("/")[1];
                string fileName = Guid.NewGuid().ToString() + "." + extension;
                var destinationFilename = Directory.GetCurrentDirectory() + "/Docs/" + fileName;
                using (var stream = new FileStream(destinationFilename, FileMode.Create))
                {
                    file.CopyTo(stream);
                }
                var doc = new DocumentMedicalRecord()
                {
                    FileName = fileName
                };
                docs.Add(doc);
            }

            var mr = new MedicalRecord()
            {
                Notes = viewModel.Notes,
                PatientId = viewModel.PatientId,
                CreateDate = viewModel.CreateDate,
                PhysicianId = viewModel.PhysicianId,
                DocumentType = viewModel.DocumentType,
                IncludeNotesInReport = viewModel.IncludeNotesInReport,
                Diagnosis = viewModel.Diagnosis,
                Assessment = viewModel.Assessment,
                FileName = viewModel.FileName,
                FileType = viewModel.FileType,
                Subject = viewModel.Subject,
                Docs = docs
            };

            await Repository.AddAsync(mr);
            await Repository.SaveChangesAsync();
            return await Task.FromResult(viewModel);
        }
    }
}
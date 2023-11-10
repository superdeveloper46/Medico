using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Medico.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;

namespace Medico.Application.Services
{
    public class ProviderService : IProviderService
    {
        private readonly IIcdCodeRepository _icdCodeRepository;
        private readonly ICareTeamRepository _careTeamRepository;
        private readonly IMedicoApplicationUserViewRepository _medicoApplicationUserViewRepository;

        private readonly IIcdCodeChiefComplaintKeywordRepository _icdCodeChiefComplaintKeywordRepository;
        private readonly IMapper _mapper;
        private readonly IDataSourceLoadOptionsHelper _dataSourceLoadOptionsHelper;

        public ProviderService(IIcdCodeRepository icdCodeRepository,
            ICareTeamRepository careTeamRepository,
            IMedicoApplicationUserViewRepository medicoApplicationUserViewRepository,
            IIcdCodeChiefComplaintKeywordRepository icdCodeChiefComplaintKeywordRepository,
            IMapper mapper,
            IDataSourceLoadOptionsHelper dataSourceLoadOptionsHelper)
        {
            _icdCodeRepository = icdCodeRepository;
            _careTeamRepository = careTeamRepository;
            _medicoApplicationUserViewRepository = medicoApplicationUserViewRepository;
            _icdCodeChiefComplaintKeywordRepository = icdCodeChiefComplaintKeywordRepository;
            _mapper = mapper;
            _dataSourceLoadOptionsHelper = dataSourceLoadOptionsHelper;
        }

        public IQueryable<ProviderViewModel> GetAll(CompanyDxOptionsViewModel dxOptions)
        {
            var companyId = dxOptions.CompanyId;
            if (companyId == Guid.Empty)
            {
                IQueryable<ProviderViewModel> careTeams = _careTeamRepository.GetAll()
                .Select(a => new ProviderViewModel
                {
                    Id = ProviderViewModel.npiToGuid(a.NPI),
                    Type = "CareTeam",
                    Name = $"CareTeam - {a.ProviderFirstName} {a.ProviderMiddleName} {a.ProviderLastName}"
                }).Take(10);

                IQueryable<ProviderViewModel> users = _medicoApplicationUserViewRepository.GetAll()
                    .Select(a => new ProviderViewModel
                    {
                        Id = a.Id,
                        Type = "Provider",
                        Name = $"Provider - {a.FirstName} {a.MiddleName} {a.LastName}"
                    }).Take(10);

                return careTeams.Concat(users);
            }
            else
            {
                IQueryable<ProviderViewModel> careTeams = _careTeamRepository.GetAll()
                .Select(a => new ProviderViewModel
                {
                    Id = ProviderViewModel.npiToGuid(a.NPI),
                    Type = "CareTeam",
                    Name = $"CareTeam - {a.ProviderFirstName} {a.ProviderMiddleName} {a.ProviderLastName}"
                }).Take(10);

                IQueryable<ProviderViewModel> users = _medicoApplicationUserViewRepository.GetAll()
                .Where(a => a.CompanyId == companyId)
                .Select(a => new ProviderViewModel
                {
                    Id = a.Id,
                    Type = "Provider",
                    Name = $"Provider - {a.FirstName} {a.MiddleName} {a.LastName}"
                }).Take(10);

                return careTeams.Concat(users);
            }
                
        }

        public IQueryable<ProviderViewModel> GetAllForLookup(CompanyDxOptionsViewModel dxOptions, int lookupItemsCount)
        {
            var filters = dxOptions.Filter;
            var companyId = dxOptions.CompanyId;

            if (filters == null)
                return GetAll(dxOptions);

            if (filters.Count == 2)
            {
                var searchString = filters[1].ToString();

                if(companyId == Guid.Empty)
                {
                    IQueryable<ProviderViewModel> careTeams = _careTeamRepository.GetAll()
                    .Where(a => ProviderViewModel.npiToGuid(a.NPI) == Guid.Parse(searchString))
                    .Select(a => new ProviderViewModel
                    {
                        Id = ProviderViewModel.npiToGuid(a.NPI),
                        Type = "CareTeam",
                        Name = $"CareTeam - {a.ProviderFirstName} {a.ProviderMiddleName} {a.ProviderLastName}"
                    }).Take(10);

                    IQueryable<ProviderViewModel> users = _medicoApplicationUserViewRepository.GetAll()
                    .Where(a => a.Id == Guid.Parse(searchString))
                    .Select(a => new ProviderViewModel
                    {
                        Id = a.Id,
                        Type = "Provider",
                        Name = $"Provider - {a.FirstName} {a.MiddleName} {a.LastName}"
                    }).Take(10);

                    return careTeams.Concat(users);
                }
                else
                {
                    IQueryable<ProviderViewModel> careTeams = _careTeamRepository.GetAll()
                    .Where(a => ProviderViewModel.npiToGuid(a.NPI) == Guid.Parse(searchString))
                    .Select(a => new ProviderViewModel
                    {
                        Id = ProviderViewModel.npiToGuid(a.NPI),
                        Type = "CareTeam",
                        Name = $"CareTeam - {a.ProviderFirstName} {a.ProviderMiddleName} {a.ProviderLastName}"
                    }).Take(10);

                    IQueryable<ProviderViewModel> users = _medicoApplicationUserViewRepository.GetAll()
                    .Where(a => a.Id == Guid.Parse(searchString) && a.CompanyId == companyId)
                    .Select(a => new ProviderViewModel
                    {
                        Id = a.Id,
                        Type = "Provider",
                        Name = $"Provider - {a.FirstName} {a.MiddleName} {a.LastName}"
                    }).Take(10);

                    return careTeams.Concat(users);
                }
                

                
            }
            else if(filters.Count == 3)
            {
                var searchString = filters[2].ToString();

                if (companyId == Guid.Empty)
                {
                    IQueryable<ProviderViewModel> careTeams = _careTeamRepository.GetAll()
                    .Where(a => EF.Functions.Like(a.ProviderFirstName, $"%{searchString}%") ||
                                EF.Functions.Like(a.ProviderMiddleName, $"%{searchString}%") ||
                                EF.Functions.Like(a.ProviderLastName, $"%{searchString}%"))
                    .Select(a => new ProviderViewModel
                    {
                        Id = ProviderViewModel.npiToGuid(a.NPI),
                        Type = "CareTeam",
                        Name = $"CareTeam - {a.ProviderFirstName} {a.ProviderMiddleName} {a.ProviderLastName}"
                    }).Take(10);

                    IQueryable<ProviderViewModel> users = _medicoApplicationUserViewRepository.GetAll()
                    .Where(a => EF.Functions.Like(a.FirstName, $"%{searchString}%") ||
                                EF.Functions.Like(a.MiddleName, $"%{searchString}%") ||
                                EF.Functions.Like(a.LastName, $"%{searchString}%"))
                    .Select(a => new ProviderViewModel
                    {
                        Id = a.Id,
                        Type = "Provider",
                        Name = $"Provider - {a.FirstName} {a.MiddleName} {a.LastName}"
                    }).Take(10);

                    return careTeams.Concat(users);
                }
                else
                {
                    IQueryable<ProviderViewModel> careTeams = _careTeamRepository.GetAll()
                    .Where(a => EF.Functions.Like(a.ProviderFirstName, $"%{searchString}%") ||
                                EF.Functions.Like(a.ProviderMiddleName, $"%{searchString}%") ||
                                EF.Functions.Like(a.ProviderLastName, $"%{searchString}%"))
                    .Select(a => new ProviderViewModel
                    {
                        Id = ProviderViewModel.npiToGuid(a.NPI),
                        Type = "CareTeam",
                        Name = $"CareTeam - {a.ProviderFirstName} {a.ProviderMiddleName} {a.ProviderLastName}"
                    }).Take(10);

                    IQueryable<ProviderViewModel> users = _medicoApplicationUserViewRepository.GetAll()
                    .Where(a => (EF.Functions.Like(a.FirstName, $"%{searchString}%") ||
                                EF.Functions.Like(a.MiddleName, $"%{searchString}%") ||
                                EF.Functions.Like(a.LastName, $"%{searchString}%")) && a.CompanyId == companyId)
                    .Select(a => new ProviderViewModel
                    {
                        Id = a.Id,
                        Type = "Provider",
                        Name = $"Provider - {a.FirstName} {a.MiddleName} {a.LastName}"
                    }).Take(10);

                    return careTeams.Concat(users);
                }
                    

            }
            else
            {
                return GetAll(dxOptions);
            }
        }

    }
}

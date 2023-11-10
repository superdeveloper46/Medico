﻿using AutoMapper;
using AutoMapper.QueryableExtensions;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Medico.Domain.Interfaces;
using Medico.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Medico.Application.Services
{
    public class InsuranceService :  BaseDeletableByIdService<InsuranceCompany, InsuranceCompanyViewModel>,
        IInsuranceService
    {
        #region DI
        private readonly IMapper _mapper;
        public InsuranceService(IInsuranceCompanyRepository repository, IMapper mapper)
            : base(repository, mapper)
        {
            _mapper = mapper;
        }
        #endregion

        #region Methods
        public IQueryable<InsuranceCompanyProjectionViewModel> GetAllCompanies()
        {
            return Repository.GetAll()
                .ProjectTo<InsuranceCompanyProjectionViewModel>(_mapper.ConfigurationProvider);
        }

        public IQueryable<LookupViewModel> GetAllCompaniesForLookup(DxOptionsViewModel dxOptions, int lookupItemsCount)
        {
            dxOptions.PrimaryKey = new[] { "Id" };
            dxOptions.PaginateViaPrimaryKey = true;

            var takeItemsCount = dxOptions.Take;
            dxOptions.Take = takeItemsCount != 0 ? takeItemsCount : lookupItemsCount;

            var query = Repository.GetAll();

            var filters = dxOptions.Filter;

            if (filters == null)
                return query.ProjectTo<LookupViewModel>(_mapper.ConfigurationProvider);

            var filter = filters[0] as JArray;

            if (filter == null)
            {
                var id = filters[0] as string;
                if (string.IsNullOrEmpty(id) || id.ToUpperInvariant() != "ID" || filters.Count != 2)
                    return query.ProjectTo<LookupViewModel>(_mapper.ConfigurationProvider);

                var idValue = filters[1] as string;
                if (string.IsNullOrEmpty(idValue))
                    return query.ProjectTo<LookupViewModel>(_mapper.ConfigurationProvider);

                var idGuid = Guid.Parse(idValue);
                return query.Where(mn => mn.Id == idGuid).ProjectTo<LookupViewModel>(_mapper.ConfigurationProvider);
            }

            var searchInsCompString = filter[2] == null
                ? string.Empty
                : ((JValue)filter[2]).Value.ToString();

            var isSearchMedicationStringExist = dxOptions.Filter != null && !string.IsNullOrEmpty(searchInsCompString);
            if (!isSearchMedicationStringExist)
                return query.ProjectTo<LookupViewModel>(_mapper.ConfigurationProvider);

            dxOptions.Filter = null;

            return query.Where(c => EF.Functions.Contains(c.Name, $"\"{searchInsCompString}\""))
                .ProjectTo<LookupViewModel>(_mapper.ConfigurationProvider);
        }

        public Task DeleteCompany(Guid id)
        {
            return DeleteById(id);
        }
        #endregion
    }
}

using Medico.Application.Interfaces;
using AutoMapper;
using Dapper;
using Dapper.Contrib.Extensions;
using Medico.Application.ViewModels;
using Medico.Domain.Models;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Threading.Tasks;
using System.Linq;
using Medico.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;

namespace Medico.Application.Services
{
    public class VendorDataService : IVendorDataService
    {
        #region DI
        private readonly IMapper _mapper;
        private readonly IConfiguration _configuration;
        private readonly ICareTeamRepository _careTeamRepository;
        public IDbConnection Connection => new SqlConnection(_configuration.GetConnectionString("DefaultConnection"));
        public VendorDataService(ICareTeamRepository careTeamRepository, IMapper mapper, IConfiguration configuration)
        {
            _mapper = mapper;
            _configuration = configuration;
            _careTeamRepository = careTeamRepository;
        }
        #endregion

        #region Methods

        public async Task<int> Create(VendorDataViewModel vendorDataViewModel)
        {
            using (IDbConnection con = Connection)
            {
                con.Open();
                VendorData vendorData = _mapper.Map<VendorData>(vendorDataViewModel);
                if (vendorData != null)
                {
                    int id = await con.InsertAsync(vendorData);
                    return id;
                }
                return 0;
            }
        }

        public async Task<bool> Update(int id,VendorDataViewModel vendorDataViewModel)
        {
            using (IDbConnection con = Connection)
            {
                con.Open();

                VendorData vendorData = await con.GetAsync<VendorData>(id);
                vendorData = _mapper.Map<VendorData>(vendorDataViewModel);
                if (vendorData != null)
                {
                    bool result = await con.UpdateAsync(vendorData);
                    return result;
                }
                return false;
            }
        }

        public async  Task<IEnumerable<VendorDataViewModel>> GetVendorDdl()
        {
            using (IDbConnection con = Connection)
            {
                string query = @"SELECT * FROM VendorDatas order by VendorName ASC";
                IEnumerable<VendorDataViewModel> vendor = await con.QueryAsync<VendorDataViewModel>(query, new {});

                return vendor;
            }
        }

        
        public async  Task<IEnumerable<CareTeamViewModel>> GetCareTeamDdl()
        {
            using (IDbConnection con = Connection)
            {
                string query = @"SELECT * FROM CareTeam ORDER BY ProviderLastName ASC";
                IEnumerable<CareTeamViewModel> vendor = await con.QueryAsync<CareTeamViewModel>(query, new {});

                return vendor;
            }
        }

        public async  Task<IEnumerable<CareTeamViewModel>> GetCareTeamDdl(string patientId)
        {
            using (IDbConnection con = Connection)
            {
                string query = @"SELECT * FROM CareTeam WHERE PatientId=@patientId ORDER BY ProviderLastName ASC";
                IEnumerable<CareTeamViewModel> vendor = await con.QueryAsync<CareTeamViewModel>(query, new { patientId });

                return vendor;
            }
        }


        public async  Task<IEnumerable<CareTeamAdditionalInformationViewModel>> GetCareTeamAdditionalInformationDdl()
        {
            using (IDbConnection con = Connection)
            {
                string query = @"SELECT * FROM [dbo].[CareTeamAdditionalInformation] order by NPI ASC";
                IEnumerable<CareTeamAdditionalInformationViewModel> vendor = await con.QueryAsync<CareTeamAdditionalInformationViewModel>(query, new {});

                return vendor;
            }
        }

        public async Task<bool> Delete(int id)
        {
            using (IDbConnection con = Connection)
            {
                //Entity for Delete
                VendorData vendorData = await con.GetAsync<VendorData>(id);
                if (vendorData == null)
                {
                    throw new Exception("invalid record");
                }
                bool result = await con.DeleteAsync(vendorData);
                return result;
            }
        }

        public IQueryable<CareTeamViewModel> GetCareTeamAll(CompanyDxOptionsViewModel dxOptions)
        {
            
            return _careTeamRepository.GetAll()
                .Select(a => new CareTeamViewModel
                {
                    NPI = a.NPI,
                    ProviderLastName = a.ProviderLastName,
                    ProviderMiddleName = a.ProviderMiddleName,
                    ProviderFirstName = a.ProviderFirstName,
                    PhoneNumber = a.PhoneNumber,
                    FaxNumber = a.FaxNumber,
                    PracticeLocationAddress = a.PracticeLocationAddress,
                    PracticeLocationCity = a.PracticeLocationCity,
                    PracticeLocationAddressState = a.PracticeLocationAddressState,
                    Name = $"{a.ProviderLastName} {a.ProviderFirstName}, {a.ProviderMiddleName}"
                })
                .Take(20);

        }

        public IQueryable<CareTeamViewModel> GetCareTeamAllForLookup(CompanyDxOptionsViewModel dxOptions, int lookupItemsCount)
        {
            var filters = dxOptions.Filter;

            if (filters == null)
                return GetCareTeamAll(dxOptions);

            if (filters.Count == 1)
            {
                JArray subFilter = (JArray)filters[0];
                var searchString = subFilter.Last().ToString();

                IQueryable<CareTeamViewModel> careTeams = _careTeamRepository.GetAll()
                .Where(a => (a.ProviderLastName + " " + a.ProviderMiddleName + " " + a.ProviderFirstName).Contains(searchString))
                .Select(a => new CareTeamViewModel
                {
                    NPI = a.NPI,
                    ProviderLastName = a.ProviderLastName,
                    ProviderMiddleName = a.ProviderMiddleName,
                    ProviderFirstName = a.ProviderFirstName,
                    PhoneNumber = a.PhoneNumber,
                    FaxNumber = a.FaxNumber,
                    PracticeLocationAddress = a.PracticeLocationAddress,
                    PracticeLocationCity = a.PracticeLocationCity,
                    PracticeLocationAddressState = a.PracticeLocationAddressState,
                    Name = $"{a.ProviderLastName} {a.ProviderFirstName}, {a.ProviderMiddleName}"
                })
                .Take(20);

                dxOptions.Filter = null;
                return careTeams;
                
            }
            else
            {
                return GetCareTeamAll(dxOptions);
            }
        }
        #endregion
    }
}

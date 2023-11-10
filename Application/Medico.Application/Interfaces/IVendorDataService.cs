using Medico.Application.ViewModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Medico.Application.Interfaces
{
    public interface IVendorDataService
    {
        Task<int> Create(VendorDataViewModel vendorDataViewModel);
        Task<IEnumerable<VendorDataViewModel>> GetVendorDdl();
        Task<IEnumerable<CareTeamViewModel>> GetCareTeamDdl();
        Task<IEnumerable<CareTeamViewModel>> GetCareTeamDdl(string patientId);
        Task<IEnumerable<CareTeamAdditionalInformationViewModel>> GetCareTeamAdditionalInformationDdl();

        IQueryable<CareTeamViewModel> GetCareTeamAll(CompanyDxOptionsViewModel dxOptions);
        IQueryable<CareTeamViewModel> GetCareTeamAllForLookup(CompanyDxOptionsViewModel dxOptions, int lookupItemsCount);
        Task<bool> Update(int id, VendorDataViewModel vendorDataViewModel);

        Task<bool> Delete(int id);
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Medico.Application.ViewModels;

namespace Medico.Application.Interfaces
{
    public interface IProviderService
    {
        IQueryable<ProviderViewModel> GetAll(CompanyDxOptionsViewModel dxOptions);
        IQueryable<ProviderViewModel> GetAllForLookup(CompanyDxOptionsViewModel dxOptions, int lookupItemsCount);

    }
}

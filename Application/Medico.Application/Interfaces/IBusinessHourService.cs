using System;
using System.Linq;
using System.Threading.Tasks;
using Medico.Application.ViewModels;

namespace Medico.Application.Interfaces
{
    public interface IBusinessHourService
    {
        IQueryable<BusinessHourViewModel> GetAll();
        Task<BusinessHourViewModel> Create(BusinessHourViewModel businessHourViewModel);

        Task DeleteAll();
    }
}
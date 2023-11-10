using System;
using System.Linq;
using System.Threading.Tasks;
using Medico.Application.ViewModels;

namespace Medico.Application.Interfaces
{
    public interface IHolidayHourService
    {
        IQueryable<HolidayHourViewModel> GetAll();
        Task<HolidayHourViewModel> Create(HolidayHourViewModel holidayHourViewModel);

        Task DeleteAll();
    }
}
using System;
using System.Linq;
using System.Threading.Tasks;
using Medico.Application.ViewModels;

namespace Medico.Application.Interfaces
{
    public interface IAppointmentStatusColorService
    {
        IQueryable<AppointmentStatusColorViewModel> GetAll();
        Task<AppointmentStatusColorViewModel> Create(AppointmentStatusColorViewModel appointmentStatusColorViewModel);

        Task DeleteAll();
    }
}
﻿using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Medico.Application.ViewModels;

namespace Medico.Application.Interfaces
{
    public interface IBaseVitalSignsService
    {
        Task<BaseVitalSignsViewModel> GetByPatientId(Guid patientId);

        Task<BaseVitalSignsViewModel> Create(BaseVitalSignsViewModel baseVitalSignsViewModel);

        Task<BaseVitalSignsViewModel> Update(BaseVitalSignsViewModel baseVitalSignsViewModel);
        Task<IEnumerable<BaseVitalSignsViewModel>> GetHistoryByPatientId(Guid patientId);
    }
}

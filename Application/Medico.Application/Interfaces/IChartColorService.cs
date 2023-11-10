
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Medico.Application.ViewModels;

namespace Medico.Application.Interfaces
{
    public interface IChartColorService
    {
      Task<ChartColorViewModel> GetColors();

      Task<bool> UpdateColor(ChartColorViewModel newColors);

      Task<ChartColorViewModel> SetDefaultColors();
    }
}

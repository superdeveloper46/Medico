using System;
using System.Data;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
using AutoMapper;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Medico.Domain.Models;
using Microsoft.Extensions.Configuration;
using System.Data.SqlClient;
using Dapper;

namespace Medico.Application.Services
{
  public class ChartColorService : IChartColorService
  {
    #region DI
    private readonly IMapper _mapper;
    private readonly IConfiguration _configuration;
    public IDbConnection Connection => new SqlConnection(_configuration.GetConnectionString("DefaultConnection"));
    public ChartColorService(IMapper mapper, IConfiguration configuration)
    {
        _mapper = mapper;
        _configuration = configuration;
    }
    #endregion

    public async Task<ChartColorViewModel> GetColors()
    {
      using (IDbConnection con = Connection)
      {
        con.Open();
        try
        {
          ChartColor cc = new ChartColor();
          string query = @"
            SELECT NoContentChanged, Updated, DefaultOrIncomplete, Abnormal, BorderNoContentChanged, BorderUpdated, BorderDefaultOrIncomplete, BorderAbnormal 
            FROM ChartColor
            WHERE preset = 'modified'";

          var result = await con.QueryAsync<ChartColorViewModel>(
              query,
              new
              {
                cc.noContentChanged,
                cc.updated,
                cc.defaultOrIncomplete,
                cc.abnormal,
                cc.borderNoContentChanged,
                cc.borderUpdated,
                cc.borderDefaultOrIncomplete,
                cc.borderAbnormal
              });
          return result.First();
        }
        catch (Exception ex)
        {
          throw ex;
        }
      }
    }

    public async Task<bool> UpdateColor(ChartColorViewModel newColors)
    {
      using (IDbConnection con = Connection)
      {
        con.Open();
        try
        {
          string query = String.Format(@"
            UPDATE ChartColor
            SET 
              Updated = '{0}',
              DefaultOrIncomplete = '{1}',
              Abnormal = '{2}',
              BorderUpdated = '{3}',
              BorderIncomplete = '{4}',
              BorderAbnormal = '{5}'
              NoContentChanged = '{6}',
              BorderNoContentChanged = '{7}'
            WHERE preset = 'modified'",
            newColors.updated,
            newColors.defaultOrIncomplete,
            newColors.abnormal,
            newColors.borderUpdated,
            newColors.borderDefaultOrIncomplete,
            newColors.borderAbnormal,
            newColors.noContentChanged,
            newColors.borderNoContentChanged);
          
          await con.QueryAsync(query);
          return true;
        }
        catch (Exception ex)
        {
          return false;
          //throw ex;
        }
      }
    }

    public async Task<ChartColorViewModel> SetDefaultColors()
    {

      using (IDbConnection con = Connection)
      {
        con.Open();
        try
        {
          string query = @"
            UPDATE ChartColor
            SET 
              Updated = defaultData.Updated,
              DefaultOrIncomplete = defaultData.DefaultOrIncomplete,
              Abnormal = defaultData.Abnormal,
              BorderUpdated = defaultData.BorderUpdated,
              BorderDefaultOrIncomplete = defaultData.BorderDefaultOrIncomplete,
              BorderAbnormal = defaultData.BorderAbnormal
              NoContentChanged = defaultData.NoContentChanged,
              BorderNoContentChanged = defaultData.BorderNoContentChanged
            FROM (
              SELECT
                Updated,
                DefaultOrIncomplete,
                Abnormal,
                BorderUpdated,
                BorderDefaultOrIncomplete,
                BorderAbnormal,
                NoContentChanged,
                BorderNoContentChanged
              FROM ChartColor
              WHERE
                preset = 'default'
            ) defaultData
            WHERE
              preset = 'modified'";

          await con.QueryAsync(query);
          return await this.GetColors();
        }
        catch (Exception ex)
        {
          throw ex;
        }
      }
    }
  }
}

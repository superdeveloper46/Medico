﻿using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using DevExtreme.AspNet.Data;
using Medico.Api.Constants;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Medico.Api.Controllers
{
    [Authorize]
    [Route("api/icdcode")]
    public class IcdCodeController : ControllerBase
    {
        private readonly IIcdCodeService _icdCodeService;

        public IcdCodeController(IIcdCodeService icdCodeService)
        {
            _icdCodeService = icdCodeService;
        }

        [HttpGet]
        [Route("{id}")]
        public Task<IcdCodeViewModel> Get(Guid id)
        {
            return _icdCodeService.GetById(id);
        }

        [HttpGet]
        [Route("keyword/{keyword}")]
        public Task<IEnumerable<IcdCodeViewModel>> GetIcdCodesMappedToKeyword(string keyword)
        {
            return _icdCodeService.GetIcdCodesMappedToKeyword(keyword);
        }


        [HttpGet]
        [Route("search")]
        public Task<IEnumerable<IcdCodeViewModel>> Search(string keyword)
        {
            return _icdCodeService.Search(keyword);
        }

        [HttpGet]
        [Route("dx/lookup")]
        public object DxLookupData(DxOptionsViewModel loadOptions)
        {
            var query = _icdCodeService
                .GetAllForLookup(loadOptions, AppConstants.SearchConfiguration.LookupItemsCount);

            return DataSourceLoader.Load(query, loadOptions);
        }

        [HttpGet]
        [Route("dx/grid")]
        public object DxIcdCodeKeywordsLoad(DxOptionsViewModel loadOptions)
        {
            loadOptions.PrimaryKey = new[] { "IcdCodeId" };
            loadOptions.PaginateViaPrimaryKey = true;

            var gridQuery = _icdCodeService.GetIcdCodeKeywords();
            return DataSourceLoader.Load(gridQuery, loadOptions);
        }
    }
}

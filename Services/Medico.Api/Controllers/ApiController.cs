using Medico.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Linq;

namespace Medico.Api.Controllers
{
    public class ApiController : ControllerBase
    {
        protected ApiController(ICompanySecurityService companySecurityService)
        {
            CompanySecurityService = companySecurityService;
        }

        protected ICompanySecurityService CompanySecurityService { get; }

        public string CurrentUserId
        {
            get
            {
                if (User.Claims.Count() > 0)
                {
                    return User.Claims.Skip(0).FirstOrDefault().Value;
                }
                return string.Empty;
            }
        }

        public string CurrentUserName
        {
            get
            {
                return User.Claims.Skip(1).FirstOrDefault().Value;
            }
        }

        public string BaseUrl
        {
            get
            {
                string scheme = HttpContext.Request.Scheme.ToString();
                string host = HttpContext.Request.Host.ToString();
                string baseUrl = scheme + "://" + host + "/";
                return baseUrl;
            }
        }
    }
}
using System;
using System.Net;
using System.Threading.Tasks;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels.ErrorLog;
using Medico.Identity.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Extensions;
using Microsoft.AspNetCore.Identity;

namespace Medico.Api.Middlewares
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;

        public ExceptionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext httpContext,
            IApiErrorLogRecordService apiErrorLogRecordService,
            IUserService userService,
            UserManager<ApplicationUser> userManager)
        {
            try
            {
                await _next(httpContext);
            }
            catch (Exception exception)
            {
                await LogException(httpContext, apiErrorLogRecordService, userService, exception, userManager);
                await HandleExceptionAsync(httpContext, exception);
            }
        }

        private Task HandleExceptionAsync(HttpContext context, Exception ex)
        {
            string statusCode = getStatus(ex)[0];
            string errorType = getStatus(ex)[1];
            context.Response.StatusCode = int.Parse(getStatus(ex)[0]);
            context.Response.ContentType = "application/json";

            return context.Response.WriteAsync("StatusCode: "+ statusCode + "<br>ErrorType: " + errorType + "<br>Error: " + ex.Message);
        }

        private string[] getStatus(Exception ex) {
            int statusCode = 500; // Default status code for server errors
            string errorType = "Internal Server Error";

            string[] data = new string[2];

            if (ex is ArgumentException)
            {
                statusCode = 400; // Bad request
                errorType = "Bad Request Error";
            }
            else if (ex is UnauthorizedAccessException)
            {
                statusCode = 401; // Unauthorized
                errorType = "Unauthorized Error";
            }

            data[0] = statusCode.ToString();
            data[1] = errorType;

            return data;
        }

        private async Task LogException(HttpContext httpContext,
            IApiErrorLogRecordService apiErrorLogRecordService,
            IUserService userService,
            Exception exception, UserManager<ApplicationUser> userManager)
        {
            var userName = httpContext.User.Identity.Name;
            var user = await userManager.GetUserAsync(httpContext.User);

            if (user != null)
            {
                var roles = await userManager.GetRolesAsync(user);
                userName = userName + "<br>(" + roles[0] + ")";
            }
            string errorAppForm = "";
            string errorAppType = "";
            var exceptionString = exception.ToString();
            if(exceptionString.Length > 0){
                errorAppType = exceptionString.Split(": ")[0];
            }
            if(exceptionString.Length > 1){
                var extraString = exceptionString.Split(": ")[1].Split("at ");
                errorAppForm = "<div><b>"+extraString[0]+"</b><ul><li>" + extraString[1] + "</li><li>" + extraString[2] + "</li></ul></div>";
            }

            string statusCode = getStatus(exception)[0];
            string errorType = getStatus(exception)[1];
            var apiErrorLogRecord = new ApiErrorLogRecordVm
            {
                Date = DateTime.UtcNow,
                RequestedUrl = httpContext.Request.GetEncodedUrl().Split("/api")[1],
                ErrorType = httpContext.Request.Method,
                UserName = userName,
                ErrorDetails = exception.ToString(),
                UserFriendlyErrorText = "StatusCode: "+ statusCode + "<br>ErrorType: " + errorType + "<br>Error: " + exception.Message,
                ErrorAppType = errorAppType,
                ErrorAppForm = errorAppForm,
                AdminErrorText = exception.ToString(),
                Status = "New Error"
            };

            await apiErrorLogRecordService.Create(apiErrorLogRecord);
        }
    }
}
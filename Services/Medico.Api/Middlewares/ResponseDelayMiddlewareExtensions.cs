using Microsoft.AspNetCore.Builder;

namespace Medico.Api.Middlewares
{
    public static class ResponseDelayMiddlewareExtensions
    {
        public static IApplicationBuilder UseResponseDelay(
            this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<ResponseDelayMiddleware>();
        }
    }
}
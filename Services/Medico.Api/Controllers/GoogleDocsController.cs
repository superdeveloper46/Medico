using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Google.Apis.Auth.AspNetCore;
using Google.Apis.Auth.OAuth2;
//using Google.Apis.Drive.v3;
using Google.Apis.Services;
using Google.Apis.Drive.v2;
using Google.Apis.Drive.v2.Data;

namespace Medico.Api.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class GoogleDocsController : ControllerBase
    {
        /// <summary>
        /// Lists the authenticated user's Google Drive files.
        /// Specifying the <see cref="GoogleScopedAuthorizeAttribute"> will guarantee that the code
        /// executes only if the user is authenticated and has granted the scope specified in the attribute
        /// to this application.
        /// </summary>
        /// <param name="auth">The Google authorization provider.
        /// This can also be injected on the controller constructor.</param>
        [GoogleScopedAuthorize(DriveService.ScopeConstants.DriveReadonly)]
        public async Task<IActionResult> DriveFileList([FromServices] IGoogleAuthProvider auth)
        {
            GoogleCredential cred = await auth.GetCredentialAsync();
            var service = new DriveService(new BaseClientService.Initializer
            {
                HttpClientInitializer = cred,
            });
            // var files = await service.Files.List().ExecuteAsync();
            // var fileNames = files.Files.Select(x => x.Name).ToList();

            ChildrenResource.ListRequest request = service.Children.List("1V1Co52vbr4BMBiPRLJgHdHoJ50lvbxx3");

            do
            {
                try
                {
                    ChildList children = request.Execute();

                    foreach (ChildReference child in children.Items)
                    {
                        //var file = child.ChildLink;

                        File file = service.Files.Get(child.Id).Execute();
                    }
                    request.PageToken = children.NextPageToken;
                }
                catch (Exception e)
                {
                    Console.WriteLine("An error occurred: " + e.Message);
                    request.PageToken = null;
                }
            } while (!String.IsNullOrEmpty(request.PageToken));

            return Ok();
        }


        [Route("signin-oidc")]
        public async Task<IActionResult> Test()
        {
            return Ok();
        }

    }
}

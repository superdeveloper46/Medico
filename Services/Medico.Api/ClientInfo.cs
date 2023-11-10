using Newtonsoft.Json.Linq;
using System;
using System.IO;

namespace Medico.Api
{
    public class ClientInfo
    {
        public static ClientInfo Load()
        {
            //const string ClientSecretFilenameVariable = "appsettings.Development.json";
            //string clientSecretFilename = Environment.GetEnvironmentVariable(ClientSecretFilenameVariable);
            //if (string.IsNullOrEmpty(clientSecretFilename))
            //{
            //    throw new InvalidOperationException($"Please set the {ClientSecretFilenameVariable} environment variable before running tests.");
            //}
            // This MUST be a "web" credential, not an "installed app" credential.
            // var secrets = JObject.Parse(File.ReadAllText(clientSecretFilename))["web"];
            var projectId = "medico-315911"; //secrets["project_id"].Value<string>();
            var clientId = "738641893213-6cm842dv7ermm17c7djq3j51e64kdtbn.apps.googleusercontent.com"; //secrets["client_id"].Value<string>();
            var clientSecret = "CAD1RENBnqLV-Dxer8yX3qeg"; //secrets["client_secret"].Value<string>();
            return new ClientInfo(projectId, clientId, clientSecret);
        }

        private ClientInfo(string projectId, string clientId, string clientSecret)
        {
            ProjectId = projectId;
            ClientId = clientId;
            ClientSecret = clientSecret;
        }

        public string ProjectId { get; }
        public string ClientId { get; }
        public string ClientSecret { get; }
    }
}

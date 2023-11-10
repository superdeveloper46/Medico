using AutoMapper;
using Medico.Application.Helpers;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Medico.Domain.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SendGrid;
using SendGrid.Helpers.Mail;
using System;
using System.IO;
using System.Threading.Tasks;
using System.Net;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Net.Http.Headers;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Text;

namespace Medico.Application.Services
{
    public class SendEmailService : ISendEmailService
    {
        #region DI
        private readonly IMapper _mapper;
        private readonly IOptions<SendEmailViewModel> _mailSettings;
        private readonly IOptions<AzureEmailSettingModel> _azureSettings;
        private readonly IHostingEnvironment _environment;
        private readonly IEmailRepository _emailRepository;

        public SendEmailService(
            IMapper mapper,
            IOptions<SendEmailViewModel> mailSettings,
            IOptions<AzureEmailSettingModel> azureSettings,
            IEmailRepository emailRepository,
            IHostingEnvironment environment)
        {
            _environment = environment;
            _mailSettings = mailSettings;
            _azureSettings = azureSettings;
            _emailRepository = emailRepository;
            _mapper = mapper;
        }
        #endregion

        #region Methods
        public async Task Execute(EmailViewModel email, EmailAccountViewModel emailAccount)
        {
            try
            {
                if (emailAccount == null)
                {
                    throw new Exception("Email Account is not configured.");
                }

                var mailSettingsValue = _mailSettings.Value;
                var apiKey = mailSettingsValue.ApiKey; //emailAccount.SendGridKey;
                var client = new SendGridClient(apiKey);
                var from = new EmailAddress(emailAccount.FromEmail, "");
                var subject = email.Subject;
                var to = new EmailAddress(email.To, $"{emailAccount.FromName}");
                
                string emailBody = email.Body;
                if (email.HashValues != null)
                {
                    var fileName = Path.Combine(_environment.ContentRootPath, "EmailTemplates", string.Format("{0}.html", email.TemplateName));
                    FileInfo file__1 = new FileInfo(fileName);
                    if (file__1.Exists)
                    {

                    }
                    emailBody = Utility.GetContentFromTemplate(email.HashValues, fileName);
                }
                var plainTextContent = emailBody;
                var msg = MailHelper.CreateSingleEmail(from, to, subject, "", emailBody);
                var response = await client.SendEmailAsync(msg);

                // CC
                if (email.CcList != null)
                {
                    var cc = new EmailAddress(email.CcList, $"{emailAccount.FromName}");
                    var msg2 = MailHelper.CreateSingleEmail(from, cc, subject, "", emailBody);
                    var response2 = await client.SendEmailAsync(msg2);
                }

                // BCC
                if (emailAccount.Bcc != null)
                {
                    var bcc = new EmailAddress(emailAccount.Bcc, $"{emailAccount.FromName}");
                    var msg3 = MailHelper.CreateSingleEmail(from, bcc, subject, "", emailBody);
                    var response3 = await client.SendEmailAsync(msg3);
                }
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        public async Task<EmailAccountViewModel> GetEmailAccount()
        {
            var all = _emailRepository.GetAll();
            var emailAccount = await all.FirstOrDefaultAsync();

            return _mapper.Map<EmailAccountViewModel>(emailAccount);
        }

        public async Task SendEmailAsync(string emailTo, string subject, string smtpMsg)
        {
            var mailSettingsValue = _mailSettings.Value;
            var client = new SendGridClient(mailSettingsValue.ApiKey);
            var from = new EmailAddress(mailSettingsValue.From, "Administrator");
            var to = new EmailAddress(emailTo, "Patient User");
            var msg = MailHelper.CreateSingleEmail(from, to, subject, smtpMsg, smtpMsg);
            var response = await client.SendEmailAsync(msg);
        }

        private readonly HttpClient httpClient = new HttpClient();

        public async Task<IEnumerable<EmailMessage>> GetAllEmail()
        {
            var azureSettingsValue = _azureSettings.Value;
            string userId = azureSettingsValue.UserId;
            return await GetEmailsAsync(userId);
        }

        public async Task<IEnumerable<EmailMessage>> GetEmailsAsync(string userId)
        {
            var accessToken = await GetAccessTokenAsync();

            httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var response = await httpClient.GetAsync($"https://graph.microsoft.com/v1.0/users/{userId}/mailFolders/inbox/messages?$filter=isRead eq false");

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Failed to retrieve emails: {response.StatusCode}");
            }

            var responseString = await response.Content.ReadAsStringAsync();
            
            var messages = JsonConvert.DeserializeObject<EmailResponse>(responseString);
            var emails = messages.value.ToArray();

            return emails;
        }

        public async Task<string> GetAccessTokenAsync()
        {
            var azureSettingsValue = _azureSettings.Value;
            string clientId = azureSettingsValue.ClientId;
            string clientSecret = azureSettingsValue.ClientSecret;
            string tenantId = azureSettingsValue.TenantId;
            string scope = "https://graph.microsoft.com/.default";
            var url = $"https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token";

            var body = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("client_id", clientId),
                new KeyValuePair<string, string>("scope", scope),
                new KeyValuePair<string, string>("client_secret", clientSecret),
                new KeyValuePair<string, string>("grant_type", "client_credentials")
            });

            var response = await httpClient.PostAsync(url, body);
            var json = await response.Content.ReadAsStringAsync();
            var accessToken = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(json).GetProperty("access_token").GetString();

            return accessToken;
        }

        public async Task MarkEmailAsReadAsync(string messageId)
        {
            var azureSettingsValue = _azureSettings.Value;
            string userId = azureSettingsValue.UserId;
            var accessToken = await GetAccessTokenAsync();

            httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var url = $"https://graph.microsoft.com/v1.0/users/{userId}/messages/{messageId}";

            var json = new StringContent("{\"isRead\": true}", Encoding.UTF8, "application/json");

            var response = await httpClient.PatchAsync(url, json);

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Failed to mark email as read: {response.StatusCode}");
            }
        }
        #endregion
    }

    public class EmailResponse {
        public string @odata__context { get; set; }
        public List<EmailMessage> value { get; set; }
    }
}

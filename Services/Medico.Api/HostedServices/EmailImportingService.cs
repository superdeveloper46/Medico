using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Medico.Application.Interfaces;
using Medico.Application.Queues;
using Medico.Application.ViewModels;
using Medico.Domain.Enums;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System.Net.Http;

using Medico.Identity.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;


namespace Medico.Api.HostedServices
{
    public class EmailImportingService : BackgroundService
    {
        private readonly HttpClient _httpClient;
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private INotificationService _notificationService;
        private ISendEmailService myService;
        private IConfigurationSettingsService configService;

        public EmailImportingService(IServiceScopeFactory serviceScopeFactory)
        {
            _httpClient = new HttpClient();
            _serviceScopeFactory = serviceScopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                using (var scope = _serviceScopeFactory.CreateScope())
                {
                    myService = scope.ServiceProvider.GetRequiredService<ISendEmailService>();
                    configService = scope.ServiceProvider.GetRequiredService<IConfigurationSettingsService>();
                    _notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                    setEmail(await myService.GetAllEmail());

                    await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
                }
            }
        }

        public async void setEmail(IEnumerable<EmailMessage> emails)
        {
            foreach (var email in emails)
            {
                String sender = email.From.EmailAddress.Name;
                String senderEmail = email.From.EmailAddress.Address;
                NotificationViewModel notificationViewModel = new NotificationViewModel
                {
                    Description = email.Body.Content,
                    Title = sender + " (" + senderEmail + ")",
                    ParentId = 0,
                    NotificationTypeId = 1,
                    MessageTypeId = "Message",
                    Priority = "Medium",
                    CreatedBy = "1efda89c-fc38-45e7-935a-b44db371382c",
                    CreatedOn = DateTime.UtcNow.AddHours(-7),
                    CreateDate = DateTime.UtcNow.AddHours(-7),
                    Archive = false
                };

                string adminUserId = "1efda89c-fc38-45e7-935a-b44db371382c";
                string assignedUserId = "";
                if (senderEmail.IndexOf("grasshopper.com") != -1)
                {
                    string phone = searchPhone(email.Body.Content);
                    if (phone != "")
                        assignedUserId = await GetUserByEmail(phone);
                }

                assignedUserId = await GetUserByEmail(senderEmail);

                IQueryable<ConfigurationSettingsViewModel> excludeLists = configService.GetAll("Exclude List");

                int count = 0;
                foreach (ConfigurationSettingsViewModel data in excludeLists)
                {
                    if (senderEmail.IndexOf(data.Value) != -1)
                    {
                        count++;
                    }
                }
                if (count != 0)
                {
                    continue;
                }

                IQueryable<ConfigurationSettingsViewModel> includeLists = configService.GetAll("Include List");
                if (assignedUserId != "")
                {
                    saveNotifciation(notificationViewModel, new string[] { adminUserId, assignedUserId });
                    await myService.MarkEmailAsReadAsync(email.Id);
                }
                else
                {
                    foreach (ConfigurationSettingsViewModel data in includeLists)
                    {
                        if (senderEmail.IndexOf(data.Value) != -1)
                        {
                            saveNotifciation(notificationViewModel, new string[] { adminUserId });
                            await myService.MarkEmailAsReadAsync(email.Id);
                            break;
                        }
                    }
                }

            }
        }

        public string searchPhone(string body)
        {
            string pattern = @"\(\d{3}\) \d{3}-\d{4}";
            Regex rg = new Regex(pattern);
            MatchCollection matchedPhones = rg.Matches(body);

            foreach (Match phone in matchedPhones)
            {
                return Regex.Replace(phone.Value, @"\D", "");
            }
            return "";
        }

        public async void saveNotifciation(NotificationViewModel notificationViewModel, string[] userIds)
        {
            int notifyId = await _notificationService.Create(notificationViewModel);
            if (notifyId > 0)
            {
                await _notificationService.MapParentNotification(notifyId, userIds);
            }
        }

        public async Task<string> GetUserByEmail(string email)
        {
            using (var scope = _serviceScopeFactory.CreateScope())
            {
                var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
                ApplicationUser user = await userManager.Users.SingleOrDefaultAsync(c => c.Email == email);
                if (user == null)
                {
                    return "";
                }
                return user.Id.ToString();
            }
        }

        public async Task<string> GetUserByPhone(string phone)
        {
            using (var scope = _serviceScopeFactory.CreateScope())
            {
                IUserService userService = scope.ServiceProvider.GetRequiredService<IUserService>();
                var medicoUsers = userService.GetAll().Where(c => c.IsActive && c.PrimaryPhone == phone).ToList();
                var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
                var aspNetUsers = await userManager.Users.ToListAsync();
                var list = from u in medicoUsers
                           join a in aspNetUsers on u.Email equals a.Email
                           select new MedicoApplicationUserViewModel
                           {
                               Id = Guid.Parse(a.Id),
                               FirstName = $"{u.FirstName} {u.LastName}",
                               MedicoUserId = u.Id
                           };

                foreach (var item in list)
                {
                    return item.Id.ToString();
                }
                return "";
            }
        }

        public override async Task StopAsync(CancellationToken stoppingToken)
        {
            _httpClient.Dispose();
            await base.StopAsync(stoppingToken);
        }
    }
}
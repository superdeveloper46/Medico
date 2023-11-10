using AutoMapper;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Medico.Domain.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Medico.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NotificationController : ApiController
    {
        #region DI

        private readonly INotificationService _notificationService;
        private readonly IMapper _mapper;

        public NotificationController(
            INotificationService notificationService,
            ICompanySecurityService companySecurityService,
            IMapper mapper) : base(companySecurityService)
        {
            _notificationService = notificationService;
            _mapper = mapper;
        }

        #endregion

        #region Method
        [HttpPost]
        public async Task<IActionResult> Post(NotificationInputModel notificationInputModel)
        {
            try
            {
                var notificationViewModel = _mapper.Map<NotificationViewModel>(notificationInputModel);

                notificationViewModel.CreatedBy = CurrentUserId;
                notificationViewModel.CreatedOn = DateTime.UtcNow.AddHours(-7);
                int notifyId = await _notificationService.Create(notificationViewModel);

                if (notifyId > 0)
                {
                    notificationInputModel.UserIds.Add(CurrentUserId);
                    NotificationReadViewModel notificationReadViewModel = new NotificationReadViewModel
                    {
                        IsRead = false,
                        UserIds = notificationInputModel.UserIds
                    };
                    //int notifyReadId = await _notificationService.AddNotifyRead(notificationReadViewModel, notifyId);

                    // Map Parent Notification to Recipient Users
                    int notifyAddedId = await _notificationService.MapParentNotification(notifyId, notificationInputModel.UserIds);
                }

                return Ok(new
                {
                    success = notifyId != 0,
                    message = notifyId != 0 ? "Notification saved." : "Error Saving Notification",
                    data = notifyId
                });
            }
            catch (Exception ex)
            {
                return Ok(new
                {
                    success = false,
                    message = "Error Saving Notification",
                });
            }
        }

        [HttpPost]
        [Route("reply")]
        public async Task<IActionResult> Reply(NotificationInputModel notificationInputModel)
        {
            var notificationViewModel = _mapper.Map<NotificationViewModel>(notificationInputModel);

            notificationViewModel.CreatedBy = CurrentUserId;
            notificationViewModel.CreatedOn = DateTime.UtcNow.AddHours(-7);
            int notifyId = await _notificationService.Create(notificationViewModel);

            if (notifyId != 0)
            {
                notificationInputModel.UserIds.Add(CurrentUserId);
                NotificationReadViewModel notificationReadViewModel = new NotificationReadViewModel
                {
                    IsRead = false,
                    UserIds = notificationInputModel.UserIds
                };
                //int notifyReadId = await _notificationService.AddNotifyRead(notificationReadViewModel, notifyId);

                // Map Parent Notification to Replied User
                int notifyAddedId = await _notificationService.MapParentNotification(notificationInputModel.ParentId, notificationInputModel.UserIds);
            }

            return Ok(new
            {
                success = notifyId != 0,
                message = notifyId != 0 ? "Notification saved." : "Error Saving Notification",
                data = notifyId
            });

        }

        [HttpGet]
        public async Task<IActionResult> GetNotification()
        {
            IEnumerable<NotificationViewModel> notificationDto = await _notificationService.GetNotification(CurrentUserId);

            // Get all recipients
            if (notificationDto != null)
            {
                foreach (var item in notificationDto)
                {
                    item.UserModels = await _notificationService.GetRecipients(item.Id);
                }
            }
            return Ok(new
            {
                Data = notificationDto,
                success = true,
                Message = "done"
            });
        }

        [HttpGet]
        [Route("header-notifications")]
        public async Task<IActionResult> GetHeaderNotifications()
        {
            IEnumerable<NotificationViewModel> notificationDto = await _notificationService.GetHeaderNotifications(CurrentUserId);

            return Ok(new
            {
                Data = notificationDto,
                success = true,
                Message = "done"
            });
        }

        [HttpGet]
        [Route("Get-NotificationReply/{id}")]
        public async Task<IActionResult> GetNotificationReply(int id)
        {
            IEnumerable<NotificationViewModel> notificationDto = await _notificationService.GetNotificationReply(id, CurrentUserId);

            return Ok(new
            {
                Data = notificationDto,
                success = true,
                Message = "done"
            });
        }

        [HttpPut]
        [Route("EditNotifyRead/{id}")]
        public async Task<IActionResult> EditNotifyRead(int id, NotificationReadViewModel1 notificationReadDto1)
        {
            bool result = await _notificationService.EditNotifyRead(id, notificationReadDto1, CurrentUserId);

            return Ok(new
            {
                Data = result,
                success = true,
                Message = "done"
            });
        }

        [HttpPut]
        [Route("setArchive/{id}")]
        public async Task<IActionResult> SetArchive(int id, NotificationArchiveViewModel notificationArchiveDto)
        {
            bool result = await _notificationService.SetArchive(id, notificationArchiveDto);

            return Ok(new
            {
                Data = result,
                success = true,
                Message = "done"
            });
        }

        [HttpGet]
        [Route("getNotificationCount")]
        public async Task<IActionResult> GetNotificationCount()
        {
            NotificationCount notificationCount = await _notificationService.GetNotificationCount(CurrentUserId);

            return Ok(new
            {
                success = true,
                Message = "done",
                Data = notificationCount
            });
        }

        [HttpGet]
        [Route("getNotificationType")]
        public async Task<IActionResult> GetNotificationType()
        {
            IEnumerable<NotificationType> notificationType = await _notificationService.GetNotificationType();

            return Ok(new
            {
                success = true,
                Message = "done",
                Data = notificationType
            });
        }
        #endregion
    }
}

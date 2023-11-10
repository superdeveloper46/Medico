using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http.Headers;
using System.Threading.Tasks;

namespace Medico.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrderController : ApiController
    {
        #region
        private readonly ILabTestService _labTestService;
        private readonly INotificationService _notificationService;
        private readonly ISubTaskService _subTaskService;
        private readonly ISubTaskUserService _subTaskUserService;
        public OrderController(ILabTestService labOrderService, ISubTaskService subTaskService, ISubTaskUserService subTaskUserService, ICompanySecurityService companySecurityService, INotificationService notificationService)
            : base(companySecurityService)
        {
            _labTestService = labOrderService;
            _notificationService = notificationService;
            _subTaskService = subTaskService;
            _subTaskUserService = subTaskUserService;
        }
        #endregion

        #region Lab Tests
        [HttpPost]
        public async Task<IActionResult> Post(LabTestViewModel labTestViewModel)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest();

                var allTests = await _labTestService.GetExisting(labTestViewModel.Code_Desc);
                if (allTests != null)
                {
                    return Ok(new { success = false, message = $"Lab Test {labTestViewModel.Code_Desc} already exists" });
                }

                var id = await _labTestService.Create(labTestViewModel);

                return Ok(new
                {
                    success = id != null,
                    message = id != null ? "Lab Test saved." : "There was an error saving Lab Test",
                    data = id
                });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, message = $"Lab Test could not be saved. {ex.Message}" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> Search(string categoryId)
        {
            try
            {
                var labTests = await _labTestService.Search(categoryId);

                return Ok(new
                {
                    success = labTests.Count() > 0,
                    message = labTests.Count() > 0 ? "Lab Test fetched." : "There was an error fetching lab tests",
                    data = labTests
                });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, message = $"Lab Tests could not be fetched" });
            }
        }

        [HttpGet]
        [Route("most-ordered")]
        public async Task<IActionResult> GetMostOrdered(string categoryId)
        {
            var allOrders = await _labTestService.GetMostOrdered(categoryId);

            return Ok(new { success = true, data = allOrders });
        }

        [HttpPut]
        [Route("editLabTest")]
        public async Task<IActionResult> EditLabTest(LabTestViewModel labTestViewModel)
        {
            if (labTestViewModel.VendorId == null)
            {
                labTestViewModel.VendorId = 0;
            }
            var data = await _labTestService.EditLabTest(labTestViewModel);
            return Ok(data);
        }

        [HttpPut]
        [Route("editLabTestFee/{id}")]
        public async Task<IActionResult> EditLabTestFee(string id, LabTestFee fee)
        {
            var data = await _labTestService.EditLabTestFee(id, fee);
            return Ok(data);
        }

        [HttpGet]
        [Route("labTest/{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            return Ok(await _labTestService.GetTestById(id));
        }

        [HttpDelete]
        [Route("deleteLabTest/{id}")]
        public async Task<IActionResult> DeleteLabTest(string id)
        {
            return Ok(await _labTestService.DeleteLabTest(id));
        }
        #endregion

        #region Patient Order
        [HttpPost]
        [Route("patientOrder")]
        public async Task<IActionResult> Post(PatientOrderViewModel patientOrderViewModel)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest();

                patientOrderViewModel.CreatedBy = new Guid(CurrentUserId);
                patientOrderViewModel.CreatedOn = DateTime.UtcNow;
                patientOrderViewModel.OrderStatus = "Unread"; // order status

                var patientOrder = await _labTestService.CreatePatientOrder(patientOrderViewModel);
                var items = await _labTestService.GetOrderItems(patientOrder.Id);

                int notifyId = await SaveNotification(patientOrderViewModel, "Unread", "Patient Order added", items);

                DateTime reminderDate = (DateTime)patientOrderViewModel.ReminderDate;

                foreach (var item in patientOrderViewModel.PatientOrderItems)
                {
                    await SaveSubTask(notifyId, item.LabTestId, reminderDate, "Unread", patientOrderViewModel.UserIds);
                }

                return Ok(new
                {
                    success = patientOrder != null,
                    message = patientOrder != null ? "Patient Order saved." : "There was an error saving Patient Order",
                    data = patientOrder
                });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, message = $"Patient Order could not be saved. {ex.Message}" });
            }
        }

        [NonAction]
        private async Task SaveSubTask(int notifyId, Guid labTestId, DateTime reminderDate, string status, IList<string> userIds)
        {
            IEnumerable<LabTestViewModel> labTestDatas = await _labTestService.GetTestById(labTestId);
            LabTestViewModel labTestData = labTestDatas.FirstOrDefault();

            DateTime currentTime = DateTime.UtcNow;
            SubTaskViewModel subTaskViewModel = new SubTaskViewModel
            {
                CreatedBy = CurrentUserId,
                CreatedOn = currentTime,
                ReporterId = CurrentUserId,
                Status = "Open",
                Description = labTestData.Notes,
                Title = labTestData.Code_Desc + "-" + labTestData.Code + " added",
                DueDate = reminderDate,
                NotificationId = notifyId,
                Priority = "Medium",
                TaskTypeId = "Order",
                CreateDate = currentTime,
                NotificationStatus = "Unread",
            };

            var createUpdateTask = _subTaskService.Create(subTaskViewModel);
            await createUpdateTask;

            for (int i = 0; i < userIds.Count; i++)
            {
                SubTaskUserViewModel subTaskUserViewModel = new SubTaskUserViewModel
                {
                    SubTaskId = subTaskViewModel.Id,
                    UserId = userIds[i]
                };

                // sub task user
                var createUpdateTask2 = _subTaskUserService.Create(subTaskUserViewModel);

                await createUpdateTask2;
            }
        }

        [NonAction]
        private async Task<int> SaveNotification(PatientOrderViewModel patientOrderViewModel, string status, string title, List<string> items)
        {
            NotificationViewModel notificationDto = new NotificationViewModel();
            string notes = string.IsNullOrEmpty(patientOrderViewModel.Notes) ? "" :
                            patientOrderViewModel.Notes.Length > 200 ? patientOrderViewModel.Notes.Substring(0, 200) : patientOrderViewModel.Notes;
            notificationDto.Title = $"{patientOrderViewModel.OrderNumber} - {title} - {items.Count()} items";
            notificationDto.Description = string.Join(",", items);

            var reminderDate = patientOrderViewModel.ReminderDate != null ? patientOrderViewModel.ReminderDate.Value.AddHours(-7).ToString() : null;

            notificationDto.Link = $"/patient-chart/{patientOrderViewModel.AppointmentId}";
            notificationDto.CreatedBy = CurrentUserId;
            notificationDto.ModifiedBy = CurrentUserId;
            notificationDto.CreatedOn = DateTime.UtcNow;
            notificationDto.NotificationTypeId = 1;
            notificationDto.MessageTypeId = "Order";
            notificationDto.EntityStatus = status;
            notificationDto.Priority = "Medium";
            notificationDto.CreateDate = DateTime.UtcNow;
            notificationDto.PatientId = patientOrderViewModel.PatientId.ToString();

            if (reminderDate != null)
                notificationDto.ReminderDate = Convert.ToDateTime(reminderDate);

            int notifyId = await _notificationService.Create(notificationDto);
            if (notifyId != 0)
            {
                patientOrderViewModel.UserIds.Add(CurrentUserId);

                // Map Parent Notification to Replied User
                int notifyAddedId = await _notificationService.MapParentNotification(notifyId, patientOrderViewModel.UserIds);
            }

            return notifyId;
        }

        [HttpGet]
        [Route("patientOrders/{companyId}/{patientId}/{categoryId}")]
        public async Task<IActionResult> GetPatientOrders(string companyId, string patientId, string categoryId)
        {
            if (categoryId == "undefined")
            {
                categoryId = null;
            }
            var cid = new Guid(companyId);
            var pid = new Guid(patientId);
            IEnumerable<PatientOrderSearch> patientOrders = await _labTestService.GetPatientOrders(cid, pid, categoryId);

            return Ok(new { success = true, data = patientOrders });
        }

        [HttpGet]
        [Route("patientOrdersBystatus/{patientId}/{status}")]
        public async Task<IActionResult> GetPatientOrdersBystatus(string patientId, string status)
        {
            var pid = new Guid(patientId);
            IEnumerable<PatientOrderSearch> patientOrders = await _labTestService.GetPatientOrdersBystatus(pid, status);

            return Ok(new { success = true, data = patientOrders });
        }

        [HttpGet]
        [Route("all/{companyId}/{categoryId}/{statusId}/{patientId?}/{physicianId?}")]
        public async Task<IActionResult> GetAll(string patientId, string companyId, string categoryId, string statusId, string physicianId)
        {
            if (categoryId == "undefined")
            {
                categoryId = null;
            }
            if (patientId == "undefined")
            {
                patientId = null;
            }
            if (physicianId == "undefined")
            {
                physicianId = null;
            }

            var allOrders = await _labTestService.GetAllOrders(patientId, companyId, categoryId, statusId, physicianId);

            return Ok(new { success = true, data = allOrders });
        }

        [HttpPut]
        [Route("update")]
        public async Task<IActionResult> PutOrder(PatientOrderUpdateModel patientOrderUpdateModel)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest();

                int completeCount = 0;
                string orderStatus = "Unread";
                foreach (var item in patientOrderUpdateModel.PatientOrderItems)
                {
                    if (item.Status == "Completed")
                    {
                        completeCount++;
                    }
                }

                // If all order item are completed, update status
                if (completeCount == patientOrderUpdateModel.PatientOrderItems.Count())
                {
                    orderStatus = "Completed";
                }

                var result = await _labTestService.PutOrder(patientOrderUpdateModel);
                var patientOrderViewModel = new PatientOrderViewModel
                {
                    AttachmentId = 0,
                    AppointmentId = patientOrderUpdateModel.AppointmentId,
                    ModifiedBy = Guid.Parse(CurrentUserId),
                    ModifiedOn = DateTime.UtcNow,
                    Notes = patientOrderUpdateModel.Notes,
                    PhysicianId = patientOrderUpdateModel.PhysicianId,
                    VendorId = patientOrderUpdateModel.VendorId,
                    ReminderDate = null,
                };

                var items = await _labTestService.GetOrderItems(patientOrderUpdateModel.Id, string.Empty);
                // await SaveNotification(patientOrderViewModel, orderStatus, "Patient Order updated", items);

                return Ok(new
                {
                    success = result,
                    message = result ? "Patient Order updated." : "There was an error updating Patient Order",
                    data = result
                });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, message = $"Patient Order could not be updated. {ex.ToString()}" });
            }
        }

        [HttpPut]
        [Route("update-status")]
        public async Task<IActionResult> PutOrderStatus(IEnumerable<PatientOrderItemModel> patientOrderItemModel)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest();

                var result = await _labTestService.PutOrderStatus(patientOrderItemModel);

                return Ok(new
                {
                    success = result,
                    message = result ? "Patient Order updated." : "There was an error updating Patient Order",
                    data = result
                });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, message = $"Patient Order could not be updated. {ex.Message}" });
            }
        }

        [HttpGet]
        [Route("getAllLabTest")]
        public async Task<IActionResult> GetAllLabTest()
        {

            var allOrders = await _labTestService.GetAllLabTest();

            return Ok(new { success = true, data = allOrders });
        }

        [HttpGet]
        [Route("getPatientOrders/{companyId}/{id}")]
        public async Task<IActionResult> GetOrdersById(string id, string companyId)
        {
            var pid = new Guid(id);
            var cid = new Guid(companyId);
            IEnumerable<PatientOrderGrouped> patientOrders = await _labTestService.GetOrdersById(pid, cid);

            return Ok(new { success = true, data = patientOrders });
        }

        [HttpDelete]
        [Route("patient-order-delete/{id}")]
        public async Task<IActionResult> DeleteOrder(string id)
        {
            return Ok(await _labTestService.DeleteOrder(id));
        }

        #endregion

        [HttpPost]
        [Route("uploadFile")]
        public IActionResult UploadImage()
        {
            var file = Request.Form.Files[0];
            var destinationFilename = "";
            string fileName = "";
            if (file.Length > 0)
            {
                fileName = ContentDispositionHeaderValue.Parse(file.ContentDisposition).FileName.Trim('"');
                destinationFilename = Directory.GetCurrentDirectory() + "/Docs/" + fileName;
                using (var stream = new FileStream(destinationFilename, FileMode.Create))
                {
                    file.CopyTo(stream);
                }
            }

            var location = $"{BaseUrl}Docs/{fileName}";
            return Ok(new { location });
        }
    }
}

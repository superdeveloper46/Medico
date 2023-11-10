using Medico.Application.ViewModels;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Medico.Application.Interfaces
{
    public interface ILabTestService
    {
        #region Lab Test

        Task<LabTestViewModel> Create(LabTestViewModel labOrderModel);
        Task<LabTestViewModel> GetExisting(string code_desc);
        Task<IEnumerable<LabTestViewModel>> Search(string categoryId);
        Task<IEnumerable<LabTestGrouped>> GetMostOrdered(string categoryId);
        Task<IEnumerable<LabTestViewModel>> GetTestById(Guid id);
        Task<bool> EditLabTest(LabTestViewModel labTestViewModel);
        Task<IEnumerable<LabTestViewModel>> GetAllLabTest();
        Task<bool> DeleteLabTest(string id);

        #endregion

        #region Patient Order

        Task<PatientOrderViewModel> CreatePatientOrder(PatientOrderViewModel patientOrderViewModel);
        Task<IEnumerable<PatientOrderSearch>> GetPatientOrders(Guid pid, Guid cid, string categoryId);
        Task<IEnumerable<PatientOrderSearch>> GetPatientOrdersBystatus(Guid pid, string status);
        Task<IEnumerable<PatientOrderGrouped>> GetAllOrders(string patientId, string companyId, string categoryId, string statusId, string physicianId);
        Task<IEnumerable<PatientOrderGrouped>> GetOrdersById(Guid id, Guid cid);
        Task<bool> DeleteOrder(string id);
        Task<bool> EditLabTestFee(string id, LabTestFee fee);
        Task<bool> PutOrder(PatientOrderUpdateModel patientOrderUpdateModel);
        Task<bool> PutOrderStatus(IEnumerable<PatientOrderItemModel> patientOrderItemModel);
        Task<List<string>> GetOrderItems(Guid id, string catId);
        Task<List<string>> GetOrderItems(Guid id);
        #endregion
    }
}

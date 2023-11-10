export interface SubTask {
  id: string;
  taskTypeId: string;
  title: string;
  createDate: Date | string;
  description: string;
  dueDate: Date | string;
  priority: string;
  notificationId: number;
  notificationStatus: string;
  patientOrderId: string;
  userIds: string[];
}

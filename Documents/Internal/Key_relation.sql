ALTER TABLE [dbo].[AppointmentPatientChartDocument]  WITH CHECK ADD  CONSTRAINT [FK_AppointmentPatientChartDocument_PatientChartDocumentNode_PatientChartDocumentNodeId] FOREIGN KEY([PatientChartDocumentNodeId])
REFERENCES [dbo].[PatientChartDocumentNode] ([Id])
ON DELETE CASCADE
GO

ALTER TABLE [dbo].[AppointmentPatientChartDocument] CHECK CONSTRAINT [FK_AppointmentPatientChartDocument_PatientChartDocumentNode_PatientChartDocumentNodeId]
GO



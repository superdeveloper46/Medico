--patient chart--
select * from Appointment where Id ='332AF7E9-8835-EB11-9FB4-0003FF21D4D7'
select * from Admission where AppointmentId ='332AF7E9-8835-EB11-9FB4-0003FF21D4D7'
select * from Admission where Id ='1c4f6d7c-1a59-eb11-a607-0003ff21d4d4'
select * from SignatureInfo where AdmissionId='dd619065-534a-eb11-9fb4-0003ff21dac6'

--chart ok
select * from AppointmentPatientChartDocument where AppointmentId ='747D9C8A-4275-EB11-9889-0003FF21DA0D'

select * from AppointmentPatientChartDocument where AppointmentId ='1B4F6D7C-1A59-EB11-A607-0003FF21D4D4'

-- copy large JSON
SELECT CAST('<![CDATA[' + AdmissionData + ']]>' AS XML) FROM Admission where Id ='1666de93-4275-eb11-9889-0003ff21da0d';

--patient--
select * from Patient where id ='5590646E-8635-EB11-9FB4-0003FF21D4D7'

select * from PatientChartDocumentNode where id ='882E8831-CEFA-41EE-B8FB-3035BFD5D53F'
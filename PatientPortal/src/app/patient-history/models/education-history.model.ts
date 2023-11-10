export class EducationHistoryModel {
    id: string;
    patientId: string;
    createDate: any;
    degree: string;
    yearCompleted: number;
    notes: string;

    constructor() {
        this.createDate = new Date();
    }
}
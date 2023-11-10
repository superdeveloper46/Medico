import { Injectable } from '@angular/core';
import { ConfigService } from './config.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiBaseUrls } from '../_models/apiBaseUrls';
import { ExpressionTestEntityIds } from '../_classes/expressionTestEntityIds';
import { ExpressionTestExecutionContext } from '../_models/expressionTestExecutionContext';
import { DateHelper } from '../_helpers/date.helper';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ExpressionExecutionContextsService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  getExpressionTestExecutionContext(): Promise<ExpressionTestExecutionContext> {
    const queryParams = new HttpParams({
      fromObject: {
        admissionId: ExpressionTestEntityIds.admissionId,
        patientId: ExpressionTestEntityIds.patientId,
      },
    });

    return firstValueFrom(
      this.http.get<ExpressionTestExecutionContext>(
        `${this.config.apiUrl}${ApiBaseUrls.expressionExecutionContexts}/`,
        { params: queryParams }
      )
    ).then(expressionExecutionContext => {
      if (expressionExecutionContext?.patient) {
        expressionExecutionContext.patient.dateOfBirth =
          DateHelper.sqlServerUtcDateToLocalJsDate(
            expressionExecutionContext.patient.dateOfBirth
          );
      }

      const vitalSigns = expressionExecutionContext.vitalSigns;
      if (vitalSigns && vitalSigns.length) {
        for (let i = 0; i < vitalSigns.length; i++) {
          const vitalSignsItem = vitalSigns[i];
          vitalSignsItem.createdDate = DateHelper.sqlServerUtcDateToLocalJsDate(
            vitalSignsItem.createdDate
          );
        }
      }

      return expressionExecutionContext;
    });
  }
}

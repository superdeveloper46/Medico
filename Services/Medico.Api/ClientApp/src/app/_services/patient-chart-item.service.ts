import { Injectable } from '@angular/core';
import { ApiBaseUrls } from '../_models/apiBaseUrls';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from './config.service';
import { firstValueFrom } from 'rxjs';
import * as $ from 'jquery';
import { Constants } from '../_classes/constants';

@Injectable({ providedIn: 'root' })
export class PatientChartItemService {
  basePatientItemUrl: string = ApiBaseUrls.patientChart;

  constructor(private http: HttpClient, private config: ConfigService) {}

  getPatientChartHtmlElementString(patientChartId: string, companyId: string, admissionId: string): Promise<string> {
    return firstValueFrom(
      this.http.get<any>(
        `${this.config.apiUrl}${this.basePatientItemUrl}/expression/${patientChartId}/${companyId}/${admissionId}`
      )
    ).then(response => {
      return response;
    });
  }

  evaluateExpressionHtmlElement(expressions: any, htmlString: string): string {
    if(expressions == null || expressions.length == 0) {
      return htmlString;
    }
    
    const container = `<div>${htmlString}</div>`;
    const dom = $.parseHTML(container);
    const expressionItemSelector = `[${Constants.expressionItem.attributes.expressionId}]`;
    const expressionItemElements = $(dom).find(expressionItemSelector);    

    for (let i = 0; i < expressionItemElements.length; i++) {
      const expressionItemElement = expressionItemElements[i];
      const expressionItemId = expressionItemElement.getAttribute(Constants.expressionItem.attributes.expressionId);
      if(expressionItemId != null && expressions.hasOwnProperty(expressionItemId)) {
        expressionItemElement.replaceWith($.parseHTML(`<p style="display:inline-block">${expressions[expressionItemId]['expressionResult']}</p>`)[0]);
      }
    }

    return $(dom).html();
  }
}

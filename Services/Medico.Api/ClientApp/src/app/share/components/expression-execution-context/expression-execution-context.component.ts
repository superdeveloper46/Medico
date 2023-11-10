import { Component } from '@angular/core';
import { ExpressionExecutionContextsService } from 'src/app/_services/expression-execution-contexts.service';
import { ExpressionTestExecutionContext } from 'src/app/_models/expressionTestExecutionContext';
import { DateHelper } from 'src/app/_helpers/date.helper';

@Component({
  selector: 'expression-execution-context',
  templateUrl: './expression-execution-context.component.html',
})
export class ExpressionExecutionContextComponent {
  expressionExecutionContext?: ExpressionTestExecutionContext;

  constructor(expressionExecutionContextsService: ExpressionExecutionContextsService) {
    expressionExecutionContextsService
      .getExpressionTestExecutionContext()
      .then(
        expressionExecutionContext =>
          (this.expressionExecutionContext = expressionExecutionContext)
      );
  }

  get isHeadCircumferenceEnabled(): boolean {
    const dob = this.expressionExecutionContext?.patient?.dateOfBirth;
    if (!dob) return false;

    return DateHelper.getAge(dob) <= 3;
  }
}

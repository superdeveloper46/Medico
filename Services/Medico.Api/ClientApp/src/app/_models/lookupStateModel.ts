import { LookupModel } from './lookupModel';
import { EntityStateType } from './entityStateType';

export class LookupStateModel extends LookupModel {
  entityStateType?: EntityStateType;

  static createNew(lookupModel: LookupModel): LookupStateModel {
    const lookupStateModel = new LookupStateModel();

    lookupStateModel.id = lookupModel.id;
    lookupStateModel.name = lookupModel.name;
    lookupStateModel.entityStateType = EntityStateType.New;

    return lookupStateModel;
  }

  static createSaved(lookupModel: LookupModel): LookupStateModel {
    const lookupStateModel = new LookupStateModel();

    lookupStateModel.id = lookupModel.id;
    lookupStateModel.name = lookupModel.name;
    lookupStateModel.entityStateType = EntityStateType.Saved;

    return lookupStateModel;
  }
}

// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  ethereum,
  JSONValue,
  TypedMap,
  Entity,
  Bytes,
  Address,
  BigInt
} from "@graphprotocol/graph-ts";

export class SetPurpose extends ethereum.Event {
  get params(): SetPurpose__Params {
    return new SetPurpose__Params(this);
  }
}

export class SetPurpose__Params {
  _event: SetPurpose;

  constructor(event: SetPurpose) {
    this._event = event;
  }

  get sender(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get purpose(): string {
    return this._event.parameters[1].value.toString();
  }
}

export class YourContract extends ethereum.SmartContract {
  static bind(address: Address): YourContract {
    return new YourContract("YourContract", address);
  }

  higherPurpose(): string {
    let result = super.call("higherPurpose", "higherPurpose():(string)", []);

    return result[0].toString();
  }

  try_higherPurpose(): ethereum.CallResult<string> {
    let result = super.tryCall("higherPurpose", "higherPurpose():(string)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toString());
  }

  purpose(): string {
    let result = super.call("purpose", "purpose():(string)", []);

    return result[0].toString();
  }

  try_purpose(): ethereum.CallResult<string> {
    let result = super.tryCall("purpose", "purpose():(string)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toString());
  }
}

export class ConstructorCall extends ethereum.Call {
  get inputs(): ConstructorCall__Inputs {
    return new ConstructorCall__Inputs(this);
  }

  get outputs(): ConstructorCall__Outputs {
    return new ConstructorCall__Outputs(this);
  }
}

export class ConstructorCall__Inputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }
}

export class ConstructorCall__Outputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }
}

export class SetHigherPurposeCall extends ethereum.Call {
  get inputs(): SetHigherPurposeCall__Inputs {
    return new SetHigherPurposeCall__Inputs(this);
  }

  get outputs(): SetHigherPurposeCall__Outputs {
    return new SetHigherPurposeCall__Outputs(this);
  }
}

export class SetHigherPurposeCall__Inputs {
  _call: SetHigherPurposeCall;

  constructor(call: SetHigherPurposeCall) {
    this._call = call;
  }

  get newPurpose(): string {
    return this._call.inputValues[0].value.toString();
  }
}

export class SetHigherPurposeCall__Outputs {
  _call: SetHigherPurposeCall;

  constructor(call: SetHigherPurposeCall) {
    this._call = call;
  }
}

export class SetPurposeCall extends ethereum.Call {
  get inputs(): SetPurposeCall__Inputs {
    return new SetPurposeCall__Inputs(this);
  }

  get outputs(): SetPurposeCall__Outputs {
    return new SetPurposeCall__Outputs(this);
  }
}

export class SetPurposeCall__Inputs {
  _call: SetPurposeCall;

  constructor(call: SetPurposeCall) {
    this._call = call;
  }

  get newPurpose(): string {
    return this._call.inputValues[0].value.toString();
  }
}

export class SetPurposeCall__Outputs {
  _call: SetPurposeCall;

  constructor(call: SetPurposeCall) {
    this._call = call;
  }
}
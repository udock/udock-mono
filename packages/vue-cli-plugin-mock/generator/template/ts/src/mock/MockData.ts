import { MockConfig, MockFunction, MockResult } from '@udock/plugin-mock'

export const override = (v: object) => v

export type MockJSContext = {
  context: {
    currentContext: {
      id: number;
    };
  };
}

type CommonData<Payload> = {
  data: Payload;
  msg: string;
  code: number;
}

export type MockData<Params = unknown, Result = unknown> = MockConfig<Params, CommonData<Result>> | MockFunction<CommonData<Result>> | MockResult<CommonData<Result>>

export function success <Payload> (data: Payload): CommonData<Payload> {
  return {
    data,
    msg: 'success',
    code: 200,
  }
}

export function success$ <Payload> (data: { data: Payload; [key: string]: unknown }): CommonData<Payload> {
  return {
    msg: 'success',
    code: 200,
    ...data
  }
}

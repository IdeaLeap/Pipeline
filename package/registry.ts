import { MaybePromise, PipelineContext } from "@idealeap/pipeline/pipe";
import { DynamicExecutor } from "@idealeap/pipeline/executor";
import lodash from "lodash";
export type PipeRegistryType = PipeRegistry;

export type Registry = Record<
  string,
  (input: any, context: PipelineContext) => MaybePromise<any>
>;

export class PipeRegistry {
  private registry: Registry = {};

  register(
    type: string,
    callback: (input: any, context: PipelineContext) => MaybePromise<any>,
  ) {
    this.registry[type] = callback;
  }

  get(type: string) {
    return this.registry[type];
  }

  static commonPreProcess = {
    validateData: (input: any, context: PipelineContext) => {
      // 数据验证逻辑
      console.log("validateData", input, context);
      return input;
    },
  };

  static commonPostProcess = {
    logData: (result: any, context: PipelineContext) => {
      console.log(result, context);
      return result;
    },
  };

  static customFn: Record<
    string,
    (input: any, context: PipelineContext) => any
  > = {};

  _Fn = {
    DynamicExecutor: async (input: any, context: PipelineContext) => {
      const params = context.stepParams["self_params"];
      const executor = new DynamicExecutor(params);
      if(lodash.isObject(params.input)){
        return await executor.execute<any>(
          params.code,
          ...params.input,
        );
      }else{
        return await executor.execute<any>(
          params.code,
          params.input,
        );
      }
    }
  };

  static init() {
    const pipeRegistry = new PipeRegistry();
    //遍历commonPreProcess进行pipeRegistry.register注册
    Object.entries(PipeRegistry.commonPreProcess).forEach(([type, fn]) => {
      pipeRegistry.register(type, fn);
    });
    //遍历commonPostProcess进行pipeRegistry.register注册
    Object.entries(PipeRegistry.commonPostProcess).forEach(([type, fn]) => {
      pipeRegistry.register(type, fn);
    });
    //遍历customFn进行pipeRegistry.register注册
    Object.entries(PipeRegistry.customFn).forEach(([type, fn]) => {
      pipeRegistry.register(type, fn);
    });
    Object.entries(pipeRegistry._Fn).forEach(([type, fn]) => {
      pipeRegistry.register(type, fn);
    });
    return pipeRegistry;
  }
}

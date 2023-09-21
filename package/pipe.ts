// 本代码由GPT4生成，具体可见https://pandora.idealeap.cn/share/33072598-a95f-4188-9003-76ccc5d964cb
import { batchDecorator, BatchOptions } from "@idealeap/pipeline/batch/index";
import { PipeRegistryType } from "@idealeap/pipeline/utils";
import lodash from "lodash";
// 类型和接口定义
export type MaybePromise<T> = T | Promise<T>;

// 简单的 EventEmitter 实现
export class EventEmitter {
  private events: Record<string, ((...args: any[]) => void)[]> = {};

  on(event: string, listener: (...args: any[]) => void) {
    this.events = lodash.defaults(this.events, {});
    lodash.set(this.events, [event], lodash.get(this.events, [event], []));
    this.events[event]?.push(listener);
  }

  emit(event: string, ...args: any[]) {
    lodash.forEach(this.events[event], (listener) => listener(...args));
  }
}

export interface PipeOptions<T, R> extends BatchOptions<T, R> {
  id: string;
  description?: string;
  retries?: number;
  timeout?: number;
  preProcess?: (input: T, context: PipelineContext) => MaybePromise<T>;
  preProcessType?: string;
  postProcess?: (result: R, context: PipelineContext) => MaybePromise<R>;
  postProcessType?: string;
  errProcess?: (error: any, context: PipelineContext) => MaybePromise<boolean>;
  errProcessType?: string;
  destroyProcess?: () => void;
  destroyProcessType?: string;
  batch?: boolean;
  type?: string;
  params?: Record<string, any>;
}

export interface PipelineContext {
  stepResults: Record<string, any>;
  stepParams: Record<string, any>;
  emitter: EventEmitter;
  abortController: AbortController;
}

export interface PipelineOptions {
  onProgress?: (completed: number, total: number) => void;
  emitter?: EventEmitter;
  destroyProcess?: () => void;
  errProcess?: (error: any, context: PipelineContext) => MaybePromise<boolean>;
  globalParams?:Record<string,any>;
}

export type SerializablePipeOptions = PipeOptions<any, any>;

export interface SerializablePipelineOptions
  extends PipelineOptions {
  pipes: SerializablePipeOptions[];
}

interface SlotReplacements {
  [key: string]: string;
}

function replaceSlots(obj: any, replacements: SlotReplacements): any {
  return lodash.cloneDeepWith(obj, (value: any) => {
    if (lodash.isString(value)) {
      return value.replace(/{{\s*(.*?)\s*}}/g, (match, key) => {
        return replacements[key.trim()] ?? match;
      });
    }
  });
}

function mergeJSONSafely(obj1: object, obj2: object): object {
  lodash.mergeWith(obj1, obj2, (objValue, srcValue, key, object, source) => {
    if (lodash.has(obj1, key) && lodash.has(obj2, key)) {
      throw new Error(`Pipe Params ${key} 与 globalParams 冲突`);
    }
    return undefined; // 返回undefined以使用默认的合并行为
  });
  return obj1;
}

const maybeAwait = async <T>(input: MaybePromise<T>) =>
  await Promise.resolve(input);

// 用于处理超时的函数
const withTimeout = <T>(
  promise: MaybePromise<T>,
  timeout: number
): Promise<T> => {
  const timer = new Promise<T>((_, reject) => {
    setTimeout(() => reject(new Error("Timeout")), timeout);
  });
  return Promise.race([promise, timer]);
};

// Pipe 类定义
export class Pipe<T, R> {
  constructor(
    private callback: (input: T, context: PipelineContext) => MaybePromise<R>,
    public options: PipeOptions<T, R>
  ) {}

  private async handlePreProcess(
    input: T,
    context: PipelineContext
  ): Promise<T> {
    return this.options.preProcess
      ? await maybeAwait(this.options.preProcess(input, context))
      : input;
  }

  private async handlePostProcess(
    result: R,
    context: PipelineContext
  ): Promise<R> {
    return this.options.postProcess
      ? await maybeAwait(this.options.postProcess(result, context))
      : result;
  }

  async execute(input: T | T[], context: PipelineContext): Promise<R | R[]> {
    if (
      this.options.id === "self_params" ||
      this.options.id === "index_input"
    ) {
      context.emitter.emit("err", "禁止设置id为self_params或index_input");
      throw new Error("禁止设置id为self_params或index_input");
    }
    lodash.set(
      context,
      ["stepParams", this.options.id],
      this.options.params || {}
    );
    lodash.set(
      context,
      ["stepParams", "self_params"],
      this.options.params || {}
    );
    if (this.options.batch) {
      const batchedFunction = batchDecorator(
        (input: T) => this.handleExecution(input, context),
        this.options
      ) as (input: T | T[]) => Promise<R | R[]>;
      return await batchedFunction(input);
    } else {
      if (Array.isArray(input)) {
        context.emitter.emit("err", "Batch mode is not enabled for this pipe.");
        throw new Error("Batch mode is not enabled for this pipe.");
      }
      return await this.handleExecution(input, context);
    }
  }

  private async handleExecution(
    input: T,
    context: PipelineContext
  ): Promise<R> {
    let retries = this.options.retries || 0;
    while (true) {
      try {
        if (context.abortController.signal.aborted) {
          context.emitter.emit("err", "Operation cancelled");
          throw new Error("Operation cancelled");
        }

        // 处理依赖项
        lodash.set(
          context,
          ["stepParams", "self_params"],
          replaceSlots(
            lodash.get(context, ["stepParams", "self_params"]),
            context.stepResults
          )
        );

        let promise = this.callback(
          await this.handlePreProcess(input, context),
          context
        );
        if (this.options.timeout) {
          promise = withTimeout(promise, this.options.timeout);
        }

        const result = await maybeAwait(promise);
        const postProcessedResult = await this.handlePostProcess(
          result,
          context
        );

        lodash.set(
          context,
          ["stepResults", this.options.id],
          postProcessedResult
        );

        return postProcessedResult;
      } catch (error) {
        retries--;
        if (this.options.errProcess) {
          const skip = await maybeAwait(
            this.options.errProcess(error, context)
          );
          if (skip) return input as unknown as R;
        }
        if (retries < 0) {
          context.emitter.emit("err", error);
          throw error;
        }
      }
    }
  }

  // 从一个 SerializablePipeOptions 对象创建一个 Pipe 实例
  static fromJSON<T, R>(
    json: SerializablePipeOptions,
    callback: (input: T, context: PipelineContext) => MaybePromise<R>,
    predefinedTypes?: PipeRegistryType
  ): Pipe<T, R> {
    if (
      json.preProcessType &&
      !!predefinedTypes &&
      !!predefinedTypes.get(json.preProcessType)
    ) {
      (json as PipeOptions<T, R>).preProcess = predefinedTypes.get(
        json.preProcessType
      ) as unknown as (input: T, context: PipelineContext) => MaybePromise<T>;
    }
    if (
      json.postProcessType &&
      !!predefinedTypes &&
      !!predefinedTypes.get(json.postProcessType)
    ) {
      (json as PipeOptions<T, R>).postProcess = predefinedTypes?.get(
        json.postProcessType
      ) as unknown as (input: R, context: PipelineContext) => MaybePromise<R>;
    }
    if (
      json.errProcessType &&
      !!predefinedTypes &&
      !!predefinedTypes.get(json.errProcessType)
    ) {
      (json as PipeOptions<T, R>).errProcess = predefinedTypes?.get(
        json.errProcessType
      ) as unknown as (
        error: any,
        context: PipelineContext
      ) => MaybePromise<boolean>;
    }
    if (json.destroyProcessType) {
      (json as PipeOptions<T, R>).destroyProcess = predefinedTypes?.get(
        json.destroyProcessType
      ) as () => void;
    }
    if (json.type && predefinedTypes) {
      const predefinedCallback = predefinedTypes.get(json.type) as unknown as (
        input: T,
        context: PipelineContext
      ) => any;
      if (predefinedCallback) {
        return new Pipe(predefinedCallback, json as PipeOptions<T, R>);
      }
    }

    if (!json.id) {
      throw new Error("JSON configuration for Pipe must contain an 'id' field");
    }

    return new Pipe(callback, json as PipeOptions<T, R>);
  }

  // 新增一个 static 方法用于创建新实例，并支持链式调用
  static create<T, R>(
    callback: (input: T, context: PipelineContext) => MaybePromise<R>,
    options?: Partial<PipeOptions<T, R>>
  ): Pipe<T, R> {
    return new Pipe(callback, options as PipeOptions<T, R>);
  }

  setId(id: string): this {
    this.options.id = id;
    return this;
  }

  setDescription(description: string): this {
    this.options.description = description;
    return this;
  }

  enableBatching(): this {
    this.options.batch = true;
    return this;
  }

  setRetries(retries: number): this {
    this.options.retries = retries;
    return this;
  }

  // 添加一个动态依赖检查函数，返回一个布尔值以确定是否应执行该 Pipe
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldExecute(context: PipelineContext): boolean {
    // 自定义逻辑，例如：
    // return context.stepResults.get('someDependency') !== 'someValue';
    return true;
  }
}

// 主函数
export class Pipeline {
  private pipes: Pipe<any, any>[] = [];
  private options: PipelineOptions;

  constructor(pipes: Pipe<any, any>[], options: PipelineOptions = {}) {
    this.pipes = pipes;
    this.options = options;
  }

  // 删除 Pipe
  removePipe(id: string): this {
    this.pipes = lodash.filter(this.pipes, (pipe) => pipe.options.id !== id);
    return this;
  }

  async execute(
    input?: any
  ): Promise<Record<string, any> | Record<string, any>[]> {
    const emitter = this.options.emitter || new EventEmitter();
    const abortController = new AbortController();
    const context: PipelineContext = {
      stepResults: {},
      stepParams: {},
      emitter,
      abortController,
    };

    let lastOutput: any = input;
    lodash.set(context, ["stepParams", "self_params"], {});
    lodash.set(context, ["stepResults", "index_input"], lastOutput);

    try {
      for (let i = 0; i < this.pipes.length; i++) {
        const pipe = this.pipes[i];
        if (!pipe) {
          continue;
        }
        if (!!pipe && !pipe.shouldExecute(context)) {
          continue;
        }

        !!this.options.globalParams && lodash.set(pipe, ["options", "params"], mergeJSONSafely(this.options.globalParams, pipe.options.params || {}));

        lastOutput = await pipe.execute(lastOutput, context);
        emitter.emit("stepComplete", i + 1, this.pipes.length, lastOutput); //可能会被onProgress取代
        this.options.onProgress?.(i + 1, this.pipes.length);
      }
    } finally {
      this.pipes.forEach((pipe) => pipe.options.destroyProcess?.());
      this.options.destroyProcess?.();
    }

    return context.stepResults;
  }
  // 从一个 SerializablePipelineOptions 和函数映射创建一个 Pipeline
  static fromJSON(
    json: SerializablePipelineOptions,
    fnMap: Record<
      string,
      (input: any, context: PipelineContext) => MaybePromise<any>
    >,
    predefinedTypes?: PipeRegistryType
  ): Pipeline {
    if (!Array.isArray(json.pipes)) {
      throw new Error("Invalid JSON configuration: 'pipes' must be an array");
    }

    const pipes = json.pipes.map((pipeJson: SerializablePipeOptions) => {
      const fn =
        fnMap[pipeJson.id] ||
        (predefinedTypes && pipeJson.type
          ? predefinedTypes.get(pipeJson.type)
          : undefined);
      if (!fn) {
        throw new Error(`Function not found for id: ${pipeJson.id}`);
      }
      return Pipe.fromJSON(
        pipeJson,
        fn as (input: any, context: PipelineContext) => any,
        predefinedTypes
      );
    });

    return new Pipeline(pipes, json);
  }

  // 新增一个 static 方法用于创建新实例，并支持链式调用
  static create(options?: PipelineOptions): Pipeline {
    return new Pipeline([], options);
  }

  // 添加 Pipe 并返回 this，以支持链式调用
  addPipe<T, R>(pipe: Pipe<T, R> | Pipe<T, R>[]): this {
    if (Array.isArray(pipe)) {
      this.pipes = this.pipes.concat(pipe);
      return this;
    }
    this.pipes.push(pipe);
    return this;
  }

  // 设置进度回调并返回 this，以支持链式调用
  setOnProgress(callback: (completed: number, total: number) => void): this {
    this.options.onProgress = callback;
    return this;
  }

  // 序列化为 JSON 的方法
  toJSON(): SerializablePipelineOptions {
    return {
      pipes: this.pipes.map((pipe) => ({
        id: pipe.options.id,
        description: pipe.options.description,
        retries: pipe.options.retries,
        timeout: pipe.options.timeout,
        batch: pipe.options.batch,
        type: pipe.options.type,
        params: pipe.options.params,
        preProcessType: pipe.options.preProcessType,
        postProcessType: pipe.options.postProcessType,
        errProcessType: pipe.options.errProcessType,
        destroyProcessType: pipe.options.destroyProcessType,
      })) as SerializablePipeOptions[],
    };
  }
}
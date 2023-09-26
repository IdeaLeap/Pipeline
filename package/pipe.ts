// 本代码由GPT4生成，具体可见https://pandora.idealeap.cn/share/33072598-a95f-4188-9003-76ccc5d964cb
import { batchDecorator, BatchOptions } from "@idealeap/pipeline/batch/index";
import { PipeRegistryType } from "@idealeap/pipeline/registry";
import {
  replaceSlots,
  mergeJSONSafely,
  isRecordOfString,
} from "@idealeap/pipeline/utils";
import lodash from "lodash";

/**
 * Represents a value that can be either a direct value of type `T` or a Promise that resolves to type `T`.
 * Useful for functions that might return a value synchronously or asynchronously.
 *
 * @typeParam T - The underlying type of the value or Promise.
 *
 * @public
 */
export type MaybePromise<T> = T | Promise<T>;

/**
 * A simple implementation of an event emitter.
 *
 * The `EventEmitter` class provides methods to subscribe to events (`on`) and to trigger those events (`emit`).
 *
 * @public
 */
export class EventEmitter {
  /**
   * Holds a record of all events and their respective listeners.
   * The key represents the event name, and the value is an array of listener functions for that event.
   */
  private events: Record<string, ((...args: any[]) => void)[]> = {};

  /**
   * Subscribes a listener function to a specified event.
   *
   * @param event - The name of the event to which the listener should be subscribed.
   * @param listener - The callback function that will be invoked when the event is emitted.
   *
   * @example
   * ```js
   * const emitter = new EventEmitter();
   * emitter.on('data', (data) => console.log(data));
   * ```
   */
  on(event: string, listener: (...args: any[]) => void) {
    this.events = lodash.defaults(this.events, {});
    lodash.set(this.events, [event], lodash.get(this.events, [event], []));
    this.events[event]?.push(listener);
  }

  /**
   * Emits a specified event with the provided arguments, invoking all subscribed listeners for that event.
   *
   * @param event - The name of the event to emit.
   * @param args - The arguments to pass to each listener function.
   *
   * @example
   * ```js
   * const emitter = new EventEmitter();
   * emitter.emit('data', { message: 'Hello World' });
   * ```
   */
  emit(event: string, ...args: any[]) {
    lodash.forEach(this.events[event], (listener) => listener(...args));
  }
}

/**
 * Options for configuring a pipe.
 *
 * The `PipeOptions` interface extends the `BatchOptions` interface, adding more configurations specific to pipes.
 *
 * @typeParam T - The type of the input data for the pipe.
 * @typeParam R - The type of the result produced by the pipe.
 *
 * @public
 */
export interface PipeOptions<T, R> extends BatchOptions<T, R> {
  /** A unique identifier for the pipe. */
  id: string;
  /** An optional description of the pipe. */
  description?: string;
  /** The number of times to retry the pipe in case of failure. */
  retries?: number;
  /** The maximum duration (in milliseconds) before timing out the pipe. */
  timeout?: number;
  /**
   * An optional function to preprocess the input data before passing it to the pipe.
   *
   * @param input - The original input data.
   * @param context - The current pipeline context.
   */
  preProcess?: (input: T, context: PipelineContext) => MaybePromise<T>;
  /** The funcName of preprocessing. */
  preProcessUse?: string;
  /**
   * An optional function to postprocess the result data after it's produced by the pipe.
   *
   * @param result - The result produced by the pipe.
   * @param context - The current pipeline context.
   */
  postProcess?: (result: R, context: PipelineContext) => MaybePromise<R>;
  /** The funcName of postprocessing. */
  postProcessUse?: string;
  /**
   * An optional function to handle errors that occur during the execution of the pipe.
   *
   * @param error - The error that occurred.
   * @param context - The current pipeline context.
   * @returns A boolean indicating whether the error was successfully handled.
   */
  errProcess?: (error: any, context: PipelineContext) => MaybePromise<boolean>;
  /** The funcName of error processing. */
  errProcessUse?: string;
  /** An optional function to clean up resources when the pipe is destroyed. */
  destroyProcess?: () => void;
  /** The funcName of destroy processing. */
  destroyProcessUse?: string;
  /** A flag indicating whether batching should be used. If `true`, the pipe will handle inputs in batches. */
  batch?: boolean;
  /** An predefined funcName. */
  use?: string;
  /** An optional set of parameters to configure the pipe's behavior. */
  params?: Record<string, any>;
  /**
   * The inputs for the pipe. This can either be a record (object) of named inputs,
   * or a string representing a single input value.
   */
  inputs?: Record<string, any> | string;
}

/**
 * Represents the context in which a pipeline operates.
 *
 * @public
 */
export interface PipelineContext {
  /** A record of results from previously executed steps in the pipeline. */
  stepResults: Record<string, any>;
  /** A record of parameters for the steps in the pipeline. */
  stepParams: Record<string, any>;
  /** An event emitter for the pipeline to emit and listen to custom events. */
  emitter: EventEmitter;
  /** An abort controller to signal and handle aborting pipeline operations. */
  abortController: AbortController;
}

/**
 * Options for configuring a pipeline.
 *
 * @public
 */
export interface PipelineOptions {
  /**
   * An optional callback function that gets called during the pipeline's execution to report progress.
   *
   * @param completed - The number of steps that have been completed.
   * @param total - The total number of steps in the pipeline.
   */
  onProgress?: (completed: number, total: number) => void;
  /** An optional custom event emitter to use for the pipeline. */
  emitter?: EventEmitter;
  /** An optional function to clean up resources when the pipeline is destroyed. */
  destroyProcess?: () => void;
  /**
   * An optional function to handle errors that occur during the execution of the pipeline.
   *
   * @param error - The error that occurred.
   * @param context - The current pipeline context.
   * @returns A boolean indicating whether the error was successfully handled.
   */
  errProcess?: (error: any, context: PipelineContext) => MaybePromise<boolean>;
  /** Optional global parameters to be used by all steps in the pipeline which will be inserted to pipe's context self_params */
  globalParams?: Record<string, any>;
}

/**
 * Represents serializable options for a pipe. It's a type alias for the `PipeOptions` interface
 * that does not constrain the types of its input or result, making it usable in contexts
 * where generic type parameters might not be specified.
 *
 * @public
 */
export type SerializablePipeOptions = PipeOptions<any, any>;

/**
 * Represents serializable options for a pipeline.
 * It extends `PipelineOptions` with an array of `SerializablePipeOptions` to represent individual pipe configurations.
 *
 * @public
 */
export interface SerializablePipelineOptions extends PipelineOptions {
  pipes: SerializablePipeOptions[];
}

/**
 * Asynchronously resolves a value that might be a promise.
 * If the input is a promise, it waits for it to resolve, otherwise it returns the input directly.
 *
 * @typeParam T - The type of value being resolved.
 * @param input - A value or a promise of a value.
 * @returns A promise that resolves to the value.
 *
 * @internal
 */
const maybeAwait = async <T>(input: MaybePromise<T>) =>
  await Promise.resolve(input);

/**
 * Wraps a promise (or a value) with a timeout. If the promise doesn't resolve within the given timeout,
 * it gets rejected with a "Timeout" error.
 *
 * @typeParam T - The type of value the promise resolves to.
 * @param promise - A promise or a value that should be wrapped with a timeout.
 * @param timeout - The timeout duration in milliseconds.
 * @returns A promise that either resolves to the original promise's value, or rejects with a "Timeout" error.
 *
 * @internal
 */
const withTimeout = <T>(
  promise: MaybePromise<T>,
  timeout: number,
): Promise<T> => {
  const timer = new Promise<T>((_, reject) => {
    setTimeout(() => reject(new Error("Timeout")), timeout);
  });
  return Promise.race([promise, timer]);
};

/**
 * Represents a processing unit within a pipeline.
 * It encapsulates a callback function and various options to control its behavior.
 *
 * @typeParam T - The input type for the pipe.
 * @typeParam R - The result type of the pipe.
 *
 * @public
 */
export class Pipe<T, R> {
  /**
   * Constructs a new instance of the Pipe.
   *
   * @param callback - The core processing function for this pipe.
   * @param options - Configuration options for this pipe.
   */
  constructor(
    private callback: (input: T, context: PipelineContext) => MaybePromise<R>,
    public options: PipeOptions<T, R>,
  ) {}

  /**
   * Processes the input using the provided `preProcess` option, if available.
   *
   * @param input - The initial input to the pipe.
   * @param context - The current pipeline context.
   * @returns The pre-processed input or the original input if no `preProcess` is specified.
   */
  private async handlePreProcess(
    input: T,
    context: PipelineContext,
  ): Promise<T> {
    return this.options.preProcess
      ? await maybeAwait(this.options.preProcess(input, context))
      : input;
  }

  /**
   * Processes the result using the provided `postProcess` option, if available.
   *
   * @param result - The result from the main pipe callback.
   * @param context - The current pipeline context.
   * @returns The post-processed result or the original result if no `postProcess` is specified.
   */
  private async handlePostProcess(
    result: R,
    context: PipelineContext,
  ): Promise<R> {
    return this.options.postProcess
      ? await maybeAwait(this.options.postProcess(result, context))
      : result;
  }

  /**
   * Executes the pipe's main functionality, handling batching if enabled, and managing
   * retries, errors, pre-processing, and post-processing.
   *
   * @param input - The input to the pipe, which can be an array if batching is enabled.
   * @param context - The current pipeline context.
   * @returns The result of the pipe's execution, which can be an array if batching is enabled.
   * @throws Will throw an error if an invalid ID is used or if batching mode isn't enabled for an array input.
   */
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
      this.options.params || {},
    );
    lodash.set(
      context,
      ["stepParams", "self_params"],
      this.options.params || {},
    );
    if (this.options.batch) {
      const batchedFunction = batchDecorator(
        (input: T) => this.handleExecution(input, context),
        this.options,
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

  /**
   * Handles the main execution of the pipe, including retries and error processing.
   *
   * @param input - The input to the pipe.
   * @param context - The current pipeline context.
   * @returns The result of the pipe's execution.
   * @throws Will throw an error if all retries are exhausted or if the operation is cancelled.
   */
  private async handleExecution(
    input: T,
    context: PipelineContext,
  ): Promise<R> {
    let retries = this.options.retries || 0;
    while (true) {
      try {
        if (context.abortController.signal.aborted) {
          context.emitter.emit("err", "Operation cancelled");
          throw new Error("Operation cancelled");
        }

        // 处理依赖项
        !lodash.isString(this.options.inputs) &&
          lodash.set(
            context,
            ["stepParams", "self_params"],
            replaceSlots(
              lodash.get(context, ["stepParams", "self_params"]),
              this.options.inputs as Record<string, any>,
            ),
          );

        let promise = this.callback(
          await this.handlePreProcess(input, context),
          context,
        );
        if (this.options.timeout) {
          promise = withTimeout(promise, this.options.timeout);
        }

        const result = await maybeAwait(promise);
        const postProcessedResult = await this.handlePostProcess(
          result,
          context,
        );

        lodash.set(
          context,
          ["stepResults", this.options.id],
          postProcessedResult,
        );

        return postProcessedResult;
      } catch (error) {
        retries--;
        if (this.options.errProcess) {
          const skip = await maybeAwait(
            this.options.errProcess(error, context),
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

  /**
   * Creates a new `Pipe` instance from a serializable options object.
   *
   * @param json - The serializable pipe options.
   * @param callback - The processing function.
   * @param predefinedUses - An optional registry of predefined functions.
   * @returns A new instance of the Pipe.
   */
  static fromJSON<T, R>(
    json: SerializablePipeOptions,
    callback: (input: T, context: PipelineContext) => MaybePromise<R>,
    predefinedUses?: PipeRegistryType,
  ): Pipe<T, R> {
    if (
      json.preProcessUse &&
      !!predefinedUses &&
      !!predefinedUses.get(json.preProcessUse)
    ) {
      (json as PipeOptions<T, R>).preProcess = predefinedUses.get(
        json.preProcessUse,
      ) as unknown as (input: T, context: PipelineContext) => MaybePromise<T>;
    }
    if (
      json.postProcessUse &&
      !!predefinedUses &&
      !!predefinedUses.get(json.postProcessUse)
    ) {
      (json as PipeOptions<T, R>).postProcess = predefinedUses?.get(
        json.postProcessUse,
      ) as unknown as (input: R, context: PipelineContext) => MaybePromise<R>;
    }
    if (
      json.errProcessUse &&
      !!predefinedUses &&
      !!predefinedUses.get(json.errProcessUse)
    ) {
      (json as PipeOptions<T, R>).errProcess = predefinedUses?.get(
        json.errProcessUse,
      ) as unknown as (
        error: any,
        context: PipelineContext,
      ) => MaybePromise<boolean>;
    }
    if (json.destroyProcessUse) {
      (json as PipeOptions<T, R>).destroyProcess = predefinedUses?.get(
        json.destroyProcessUse,
      ) as () => void;
    }
    if (json.use && predefinedUses) {
      const predefinedCallback = predefinedUses.get(json.use) as unknown as (
        input: T,
        context: PipelineContext,
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

  /**
   * Creates and returns a new `Pipe` instance. This static method is designed to support chaining.
   *
   * @param callback - The core processing function for the new pipe.
   * @param options - Optional configuration options for the new pipe.
   * @returns A new instance of the Pipe.
   */
  static create<T, R>(
    callback: (input: T, context: PipelineContext) => MaybePromise<R>,
    options?: Partial<PipeOptions<T, R>>,
  ): Pipe<T, R> {
    return new Pipe(callback, options as PipeOptions<T, R>);
  }

  /**
   * Sets the ID of the pipe.
   *
   * @param id - The ID to be assigned.
   * @returns The same pipe instance, to support method chaining.
   */
  setId(id: string): this {
    this.options.id = id;
    return this;
  }

  /**
   * Sets the description of the pipe.
   *
   * @param description - The description to be assigned.
   * @returns The same pipe instance, to support method chaining.
   */
  setDescription(description: string): this {
    this.options.description = description;
    return this;
  }

  /**
   * Set `batch = true` for the pipe.
   *
   * @returns The same pipe instance, to support method chaining.
   */
  enableBatching(): this {
    this.options.batch = true;
    return this;
  }

  /**
   * Sets the number of retries for the pipe.
   *
   * @param retries - The number of retries to be assigned.
   * @returns The same pipe instance, to support method chaining.
   */
  setRetries(retries: number): this {
    this.options.retries = retries;
    return this;
  }

  /**
   * Sets a dynamic dependency check function that returns a boolean to determine whether the pipe should be executed.
   * @param context - The current pipeline context.
   * @returns A boolean indicating whether the pipe should be executed.
   *
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldExecute(context: PipelineContext): boolean {
    // 自定义逻辑，例如：
    // return context.stepResults.get('someDependency') !== 'someValue';
    return true;
  }
}

/**
 * Represents a pipeline that consists of multiple pipes, offering methods to execute them sequentially,
 * add or remove pipes, and serialize the pipeline configuration.
 *
 * @public
 */
export class Pipeline {
  private pipes: Pipe<any, any>[] = [];
  private options: PipelineOptions;
  /**
   * Constructs a new Pipeline instance.
   *
   * @param pipes - An array of pipes to be executed by the pipeline.
   * @param options - Optional settings for the pipeline's behavior.
   */
  constructor(pipes: Pipe<any, any>[], options: PipelineOptions = {}) {
    this.pipes = pipes;
    this.options = options;
  }

  /**
   * Removes a pipe from the pipeline based on its ID.
   *
   * @param id - The ID of the pipe to be removed.
   * @returns The updated pipeline instance.
   */
  removePipe(id: string): this {
    this.pipes = lodash.filter(this.pipes, (pipe) => pipe.options.id !== id);
    return this;
  }

  /**
   * Executes the pipeline using the provided input.
   *
   * @param input - The initial input for the pipeline.
   * @returns A record containing the results of each pipe's execution.
   * @throws Will throw an error if an expected output is missing or if an invalid configuration is detected.
   */
  async execute(
    input?: any,
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

        !!this.options.globalParams &&
          lodash.set(
            pipe,
            ["options", "params"],
            mergeJSONSafely(
              this.options.globalParams,
              pipe.options.params || {},
            ),
          );

        if (!!pipe.options.inputs) {
          if (lodash.isString(pipe.options.inputs)) {
            const pipeOutput = lodash.get(context, [
              "stepResults",
              pipe.options.inputs,
            ]);
            if (!pipeOutput) {
              throw new Error(
                `Pipe ${pipe.options.id} 不存在输出 ${pipe.options.inputs}`,
              );
            }
            lastOutput = pipeOutput;
          }
          if (isRecordOfString(pipe.options.inputs)) {
            lodash.forEach(
              pipe.options.inputs as Record<string, string>,
              (value, key) => {
                const pipeOutput = lodash.get(context, ["stepResults", value]);
                if (!pipeOutput) {
                  throw new Error(
                    `Pipe ${pipe.options.id} 不存在输出 ${value}`,
                  );
                }
                if (key === "input") {
                  lastOutput = pipeOutput;
                }
                lodash.set(
                  pipe.options.inputs as Record<string, string>,
                  key,
                  pipeOutput,
                );
              },
            );
          }
        }

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

  /**
   * Constructs a new Pipeline instance from a serializable configuration and a mapping of functions.
   *
   * @param json - The serializable pipeline configuration.
   * @param fnMap - A mapping of pipe IDs to their corresponding functions.
   * @param predefinedUses - Optional predefined pipe functions.
   * @returns A new Pipeline instance.
   * @throws Will throw an error if the configuration is invalid or if a function is not found for a given ID.
   */
  static fromJSON(
    json: SerializablePipelineOptions,
    fnMap: Record<
      string,
      (input: any, context: PipelineContext) => MaybePromise<any>
    >,
    predefinedUses?: PipeRegistryType,
  ): Pipeline {
    if (lodash.has(json,"pipes") || !Array.isArray(json.pipes)) {
      throw new Error("Invalid JSON configuration: 'pipes' must be an array");
    }

    const pipes = json.pipes.map((pipeJson: SerializablePipeOptions) => {
      const fn =
        fnMap[pipeJson.id] ||
        (predefinedUses && pipeJson.use
          ? predefinedUses.get(pipeJson.use)
          : undefined);
      if (!fn) {
        throw new Error(`Function not found for id: ${pipeJson.id}`);
      }
      return Pipe.fromJSON(
        pipeJson,
        fn as (input: any, context: PipelineContext) => any,
        predefinedUses,
      );
    });

    return new Pipeline(pipes, json);
  }

  /**
   * Constructs a new empty Pipeline instance, supporting chainable method calls.
   *
   * @param options - Optional settings for the pipeline's behavior.
   * @returns A new Pipeline instance.
   */
  static create(options?: PipelineOptions): Pipeline {
    return new Pipeline([], options);
  }

  /**
   * Adds one or more pipes to the pipeline.
   *
   * @param pipe - A single pipe or an array of pipes to add to the pipeline.
   * @returns The updated pipeline instance.
   */
  addPipe<T, R>(pipe: Pipe<T, R> | Pipe<T, R>[]): this {
    if (Array.isArray(pipe)) {
      this.pipes = this.pipes.concat(pipe);
      return this;
    }
    this.pipes.push(pipe);
    return this;
  }

  /**
   * Sets a callback to track the pipeline's execution progress.
   *
   * @param callback - A function that is called with the number of completed pipes and the total number of pipes.
   * @returns The updated pipeline instance.
   */
  setOnProgress(callback: (completed: number, total: number) => void): this {
    this.options.onProgress = callback;
    return this;
  }

  /**
   * Serializes the pipeline's configuration to a JSON-friendly format.
   *
   * @returns A serializable representation of the pipeline's configuration.
   */
  toJSON(): SerializablePipelineOptions {
    return {
      pipes: this.pipes.map((pipe) => ({
        id: pipe.options.id,
        description: pipe.options.description,
        retries: pipe.options.retries,
        timeout: pipe.options.timeout,
        batch: pipe.options.batch,
        use: pipe.options.use,
        params: pipe.options.params,
        preProcessUse: pipe.options.preProcessUse,
        postProcessUse: pipe.options.postProcessUse,
        errProcessUse: pipe.options.errProcessUse,
        destroyProcessUse: pipe.options.destroyProcessUse,
      })) as SerializablePipeOptions[],
    };
  }
}
